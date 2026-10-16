#!/usr/bin/env python3
"""Build a dependency-free, crawlable version of the canvas. Never deploys."""
import argparse
from copy import deepcopy
from hashlib import sha256
from html import escape
import json
from pathlib import Path
import re
import shutil
from urllib.parse import urljoin, urlparse
from xml.etree import ElementTree as ET
from html_tree import Node, parse, replace_contents

HERE = Path(__file__).resolve().parent
SOURCE = HERE.parent
REPO = SOURCE.parent
CONFIG = json.loads((HERE / 'pages.json').read_text())
SECTIONS, PROJECTS = CONFIG['sections'], CONFIG['projects']

def element(tag, attrs=None, content=''):
    n = Node(tag, attrs)
    replace_contents(n, content)
    return n

def build(output, origin):
    origin = origin.rstrip('/')
    if urlparse(origin).scheme != 'https' or urlparse(origin).path:
        raise ValueError('Use the HTTPS origin only, e.g. https://nandanadileep.com')
    output.mkdir(parents=True, exist_ok=True)
    assets = output / 'assets'
    assets.mkdir(exist_ok=True)
    template = parse((SOURCE / 'index.html').read_text())
    source_main = template.find(id='canvas')
    source_sections = {n.attrs['id']: n for n in source_main.children if isinstance(n, Node) and n.tag == 'section'}
    source_articles = {n.attrs['id']: n for n in source_sections['work'].nodes() if n.tag == 'article' and n.attrs.get('id') in PROJECTS}
    assert set(source_articles) == set(PROJECTS), 'Project configuration and canvas content differ'
    routes = {key: '/' + (value[0] + '/' if value[0] else '') for key, value in SECTIONS.items()}
    project_routes = {key: '/projects/' + value[0] + '/' for key, value in PROJECTS.items()}
    legacy = {**routes, **{'work/' + key: value for key, value in project_routes.items()}, 'work': project_routes['jlr-1'], 'projects': routes['work'], 'contact': routes['about']}

    # Keep the established visual design while using semantic headings and links.
    css = (SOURCE / 'canvas.css').read_text()
    css = css.replace('.project-sidebar button', '.project-sidebar a').replace('[aria-selected=true]', '[aria-current=page]')
    css = css.replace('.work-detail h4', '.work-detail h1').replace('.work-detail>h4', '.work-detail>h1')
    css = css.replace('.section-title h2', '.section-title :is(h1,h2)').replace('.misc-header h2', '.misc-header :is(h1,h2)')
    css += '\n' + (HERE / 'site.css').read_text()
    assets.joinpath('site.css').write_text(css)
    assets.joinpath('site.js').write_text((HERE / 'site.js').read_text())
    version = sha256((css + assets.joinpath('site.js').read_text()).encode()).hexdigest()[:10]
    portrait = SOURCE / 'seo' / 'portrait.jpg'
    shutil.copy2(portrait if portrait.exists() else SOURCE / 'nandana.jpg', assets / 'portrait.jpg')
    shutil.copy2(REPO / 'resume.pdf', output / 'resume.pdf')
    for filename in ['favicon.ico', 'favicon.png']:
        shutil.copy2(REPO / filename, output / filename)

    person = {'@type':'Person', '@id':origin+'/#person', 'name':'Nandana Dileep', 'url':origin+'/',
              'jobTitle':'AI Engineer', 'image':origin+'/assets/portrait.jpg',
              'worksFor':{'@type':'Organization','name':'JLR','url':'https://www.jaguarlandrover.com/'},
              'alumniOf':{'@type':'CollegeOrUniversity','name':'Indian Institute of Technology Madras','url':'https://www.iitm.ac.in/'},
              'homeLocation':{'@type':'City','name':'Bengaluru','alternateName':'Bangalore'},
              'knowsAbout':['AI engineering','AI agents','Agent reliability','AI infrastructure','LLM inference','Retrieval-augmented generation','Machine learning'],
              'sameAs':['https://github.com/nandanadileep','https://www.linkedin.com/in/nandana-dileep-06935a212/','https://medium.com/@nandanadileep29','https://x.com/nandana_dileep']}
    site = {'@type':'WebSite','@id':origin+'/#website','name':'Nandana Dileep','url':origin+'/', 'publisher':{'@id':person['@id']}}
    page_specs = [(key, None, routes[key], data[1], data[2]) for key, data in SECTIONS.items()]
    page_specs += [('work', key, project_routes[key], data[1], data[2]) for key, data in PROJECTS.items()]
    manifest = []
    for section_id, project_id, route, title, description in page_specs:
        doc = deepcopy(template)
        head, body = doc.find(tag='head'), doc.find(tag='body')
        main = doc.find(id='canvas')
        active = deepcopy(source_sections[section_id])
        active.remove_attr('hidden')
        main.children = []
        main.append(active)
        state = {'intro':'home','work':'work','stack':'stack','writing':'writing','about':'personal','miscellaneous':'personal','experience':'experience'}[section_id]
        body.set('class', state+'-view'+(' portrait-visible' if section_id == 'intro' else ''))
        doc.find(id='viewport').set('class','viewport is-'+state)
        if section_id == 'intro':
            portrait_node = deepcopy(template.find(id='portrait-reveal'))
            img = portrait_node.find(tag='img')
            img.set('src','/assets/portrait.jpg')
            img.set('alt','Nandana Dileep in a snowy landscape')
            img.set('fetchpriority','high')
            main.append(portrait_node)
        elif section_id != 'work':
            heading = active.find(tag='h2')
            heading.tag = 'h1'
            heading.changed = True

        graph = [person, site]
        page = {'@type':'ProfilePage' if section_id == 'intro' else 'WebPage', '@id':origin+route+'#webpage',
                'url':origin+route, 'name':title,'description':description,'inLanguage':'en',
                'isPartOf':{'@id':site['@id']},'about':{'@id':person['@id']}}
        if section_id == 'intro':
            page['mainEntity'] = {'@id':person['@id']}
        if section_id == 'work':
            sidebar = active.find(cls='project-sidebar')
            for attr in ['role','aria-orientation']:
                sidebar.remove_attr(attr)
            sidebar.set('aria-label','Engineering projects')
            overview = element('a', {'href':routes['work'],'class':'project-overview-link'}, 'All projects')
            if not project_id: overview.set('aria-current','page')
            sidebar.children.insert(0,overview)
            for tab in list(sidebar.nodes()):
                pid = tab.attrs.get('data-work-project')
                if not pid: continue
                tab.tag = 'a'
                for attr in ['role','aria-controls','aria-selected','tabindex','data-work-project']:
                    tab.remove_attr(attr)
                tab.set('href',project_routes[pid])
                if pid == project_id: tab.set('aria-current','page')
            picker = active.find(id='work-project-select')
            for option in picker.nodes():
                if option.tag != 'option': continue
                pid = option.attrs['value']
                option.set('value',project_routes[pid])
                if pid == project_id: option.set('selected',None)
            overview_option = element('option', {'value':routes['work']}, 'All projects')
            if not project_id: overview_option.set('selected',None)
            picker.children.insert(0,overview_option)
            reader = active.find(cls='work-reader-content')
            reader.children = []
            if project_id:
                article = deepcopy(source_articles[project_id])
                for node in [article, *article.nodes()]:
                    node.remove_attr('hidden')
                heading = article.find(tag='h4')
                heading.tag = 'h1'
                heading.changed = True
                heading.set('id','project-title')
                article.set('aria-labelledby','project-title')
                for subheading in article.nodes():
                    if subheading.tag == 'h5':
                        subheading.tag = 'h2'
                        subheading.changed = True
                links = article.find(cls='work-text-links')
                if links:
                    resources = active.find(id='work-project-links')
                    resources.remove_attr('hidden')
                    for link in links.nodes():
                        if link.tag == 'a': resources.append(deepcopy(link))
                reader.append(article)
                work = {'@type':'CreativeWork','@id':origin+route+'#project','name':heading.text(),
                        'description':description,'url':origin+route,'creator':{'@id':person['@id']},
                        'mainEntityOfPage':{'@id':page['@id']}}
                graph.append(work)
                page['mainEntity'] = {'@id':work['@id']}
            else:
                active.find(id='work-title').tag = 'h1'
                active.find(id='work-title').changed = True
                listing = '<div class="project-directory"><p class="project-directory-intro">I’m Nandana Dileep, an AI engineer at JLR and an IIT Madras alum based in Bangalore. I build AI agents, inference systems and the infrastructure around them.</p>'
                for label, ids in [('AI agents and applications',['personal-mycelium','personal-autoagent','personal-identiti','personal-refractor']),('LLM inference and model experiments',['personal-tiny-reranker','personal-mlx','personal-nanollm']),('Engineering at JLR',['jlr-1','jlr-2','jlr-4','jlr-3'])]:
                    listing += '<section class="project-directory-group"><h2>'+label+'</h2><ul class="project-card-grid">'
                    for pid in ids:
                        name = source_articles[pid].find(tag='h4').text()
                        listing += '<li><a class="project-directory-card" href="'+project_routes[pid]+'"><h3>'+escape(name)+'</h3><p>'+escape(PROJECTS[pid][2])+'</p></a></li>'
                    listing += '</ul></section>'
                replace_contents(reader,listing+'</div>')
                graph.append({'@type':'ItemList','@id':origin+route+'#projects','name':'AI engineering projects by Nandana Dileep',
                              'itemListElement':[{'@type':'ListItem','position':i,'url':origin+project_routes[pid],'name':source_articles[pid].find(tag='h4').text()} for i,pid in enumerate(PROJECTS,1)]})
                page['mainEntity'] = {'@id':origin+route+'#projects'}
        graph.append(page)
        if section_id != 'intro':
            crumbs = [('Home','/')]
            if project_id: crumbs.append(('Projects','/projects/'))
            crumbs.append((title.split(' | ')[0],route))
            graph.append({'@type':'BreadcrumbList','itemListElement':[{'@type':'ListItem','position':i,'name':label,'item':origin+path} for i,(label,path) in enumerate(crumbs,1)]})

        for node in list(doc.nodes()):
            if 'data-jump' in node.attrs:
                target = node.attrs['data-jump']
                node.set('href',project_routes['jlr-1'] if target == 'work' else routes[target])
                if target == 'work' and 'tool' in node.attrs.get('class','').split():
                    node.set('href',routes['work'])
                    node.set('data-mobile-href',routes['work'])
                    node.set('data-desktop-href',project_routes['jlr-1'])
                node.remove_attr('data-jump')
                if 'tool' in node.attrs.get('class','').split():
                    is_active = target == ('about' if section_id == 'miscellaneous' else section_id)
                    node.set('class','tool'+(' active' if is_active else ''))
                    if is_active: node.set('aria-current','page')
            if node.tag == 'a' and node.attrs.get('href','').startswith('../'):
                node.set('href','/'+node.attrs['href'][3:])
        skip = doc.find(cls='skip')
        skip.set('href','#'+section_id)
        replace_contents(skip,'Skip to content')
        active.set('tabindex','-1')
        for cls in ['bottom-left','zoom-controls']:
            doc.find(cls=cls).remove()
        doc.find(id='help-dialog').remove()
        body.append(element('script',{'id':'legacy-routes','type':'application/json'},json.dumps(legacy)))
        body.append(element('script',{'data-goatcounter':'https://nandana.goatcounter.com/count','async':None,'src':'https://gc.zgo.at/count.js'}))
        head.children = []
        schema_json = json.dumps({'@context':'https://schema.org','@graph':graph},ensure_ascii=False).replace('<','\\u003c')
        metadata = f'''<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{escape(title)}</title><meta name="description" content="{escape(description,quote=True)}">
<meta name="robots" content="index,follow,max-image-preview:large"><meta name="author" content="Nandana Dileep">
<link rel="canonical" href="{origin}{route}"><link rel="icon" href="/favicon.ico" type="image/x-icon"><link rel="icon" href="/favicon.png" type="image/png"><link rel="apple-touch-icon" href="/favicon.png">
<meta property="og:type" content="website"><meta property="og:site_name" content="Nandana Dileep">
<meta property="og:title" content="{escape(title,quote=True)}"><meta property="og:description" content="{escape(description,quote=True)}">
<meta property="og:url" content="{origin}{route}"><meta property="og:image" content="{origin}/assets/portrait.jpg">
<meta property="og:image:alt" content="Nandana Dileep"><meta name="twitter:card" content="summary">
<meta name="twitter:site" content="@nandana_dileep"><meta name="twitter:title" content="{escape(title,quote=True)}">
<meta name="twitter:description" content="{escape(description,quote=True)}"><meta name="twitter:image" content="{origin}/assets/portrait.jpg">
<script>try{{document.documentElement.dataset.theme=localStorage.getItem('portfolio-canvas-theme')==='dark'?'dark':'light'}}catch{{document.documentElement.dataset.theme='light'}}</script>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;450;500;550;600;650;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/site.css?v={version}"><script src="/assets/site.js?v={version}" defer></script>
<script type="application/ld+json">{schema_json}</script>
<noscript><style>.mobile-project-picker,.contact-tool,.theme-toggle{{display:none}}.is-work .project-sidebar{{display:flex;max-height:25vh;overflow:auto}}.is-work .work-browser{{min-height:0}}@media(max-width:700px){{.is-work .project-sidebar{{flex-direction:row;flex-wrap:wrap;gap:4px}}.project-sidebar a{{width:auto;padding:6px}}.project-nav-label{{display:none}}}}</style></noscript>'''
        replace_contents(head,metadata)
        destination = output / route.lstrip('/') / 'index.html'
        destination.parent.mkdir(parents=True,exist_ok=True)
        destination.write_text(doc.html())
        manifest.append({'path':route,'title':title,'description':description,'project':project_id,'section':section_id})

    # Existing public essays retain their URLs; do not silently delete indexed work.
    old_sitemap = ET.parse(REPO / 'sitemap.xml')
    old_routes = []
    for loc in old_sitemap.findall('.//{*}loc'):
        route = urlparse(loc.text).path
        if route == '/': continue
        src = REPO / route.lstrip('/')
        dest = output / route.lstrip('/')
        if src.is_dir(): shutil.copytree(src,dest,dirs_exist_ok=True)
        elif src.exists(): shutil.copy2(src,dest)
        else: continue
        old_routes.append(route)
    for file in REPO.iterdir():
        if file.is_file() and file.suffix.lower() in {'.css','.js','.png','.jpg','.ico','.pdf'}:
            shutil.copy2(file,output/file.name)
    output.joinpath('CNAME').write_text(urlparse(origin).hostname+'\n')
    output.joinpath('.nojekyll').touch()
    output.joinpath('robots.txt').write_text('User-agent: *\nAllow: /\n\nSitemap: '+origin+'/sitemap.xml\n')
    all_routes = [p['path'] for p in manifest] + old_routes
    # Omit lastmod rather than claim every page was edited whenever the build runs.
    output.joinpath('sitemap.xml').write_text('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+''.join('<url><loc>'+escape(origin+route)+'</loc></url>\n' for route in all_routes)+'</urlset>\n')
    output.joinpath('llms.txt').write_text('# Nandana Dileep\n\nAI engineer at JLR in Bangalore; IIT Madras alum. Work spans AI agent reliability, LLM inference, retrieval and AI infrastructure.\n\n## Engineering projects\n'+''.join(f'- [{source_articles[pid].find(tag="h4").text()}]({origin}{project_routes[pid]}): {PROJECTS[pid][2]}\n' for pid in PROJECTS)+'\n## More\n'+f'- [Writing]({origin}/writing/)\n- [Stack]({origin}/stack/)\n- [Resume]({origin}/resume.pdf)\n')
    output.joinpath('404.html').write_text('<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Page not found | Nandana Dileep</title><body><main><h1>This page is missing.</h1><p><a href="/">Back to Nandana’s homepage</a> or <a href="/projects/">browse the projects</a>.</p></main></body></html>')
    output.joinpath('seo-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
    print(f'Built {len(manifest)} crawlable canvas pages and preserved {len(old_routes)} legacy URLs in {output}')

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output',type=Path,default=SOURCE/'site')
    parser.add_argument('--origin',default='https://nandanadileep.com')
    args = parser.parse_args()
    build(args.output.resolve(),args.origin)
