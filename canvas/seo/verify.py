#!/usr/bin/env python3
"""Check search metadata, visible content, links and crawl reachability offline."""
from collections import deque
import json
from pathlib import Path
import sys
from urllib.parse import urlparse, unquote
from xml.etree import ElementTree as ET
from html_tree import parse

root = Path(sys.argv[1]) if len(sys.argv)>1 else Path(__file__).resolve().parent.parent/'site'
manifest = json.loads((root/'seo-manifest.json').read_text())
source = parse((Path(__file__).resolve().parent.parent/'index.html').read_text())
routes = {p['path'] for p in manifest}
titles, descriptions, edges = set(), set(), {}
errors = []

def check(ok, message):
    if not ok: errors.append(message)

def resolve(path):
    f = root/path.lstrip('/')
    return f/'index.html' if path.endswith('/') else f

for p in manifest:
    route = p['path']
    doc = parse(resolve(route).read_text())
    nodes = list(doc.nodes())
    title = doc.find(tag='title').text()
    meta = {n.attrs.get('name',n.attrs.get('property')):n.attrs.get('content') for n in nodes if n.tag=='meta'}
    canonicals = [n for n in nodes if n.tag=='link' and n.attrs.get('rel')=='canonical']
    check(len(canonicals)==1, route+': one canonical required')
    check(canonicals[0].attrs['href']=='https://nandanadileep.com'+route, route+': wrong canonical')
    check('noindex' not in meta.get('robots',''), route+': blocked indexing')
    check(title not in titles, route+': duplicate title')
    check(meta['description'] not in descriptions, route+': duplicate description')
    titles.add(title); descriptions.add(meta['description'])
    check(meta.get('og:url')==canonicals[0].attrs['href'], route+': OG URL mismatch')
    check(meta.get('twitter:title')==title, route+': Twitter title mismatch')
    headings = [n for n in nodes if n.tag=='h1']
    check(len(headings)==1, route+': must have one H1')
    main = doc.find(tag='main')
    check(main is not None and len(main.text())>80, route+': missing server-rendered content')
    ids = [n.attrs['id'] for n in nodes if 'id' in n.attrs]
    check(len(ids)==len(set(ids)),route+': duplicate IDs')
    for n in nodes:
        for attr in ['aria-labelledby','aria-controls']:
            for id in n.attrs.get(attr,'').split():
                check(id in ids, route+': missing ARIA target '+id)
    graphs = [json.loads(''.join(n.children)) for n in nodes if n.tag=='script' and n.attrs.get('type')=='application/ld+json']
    check(len(graphs)==1,route+': JSON-LD graph missing')
    if graphs:
        check(any(n.get('@type')=='Person' and n.get('name')=='Nandana Dileep' for n in graphs[0]['@graph']),route+': person missing')
    edges[route] = []
    for n in nodes:
        for attr in ['href','src']:
            value = n.attrs.get(attr,'')
            if not value or value.startswith(('#','mailto:','https:','http:','data:')): continue
            url = urlparse(value)
            path = unquote(url.path)
            check(path.startswith('/'),route+': unexpected relative path '+value)
            check(resolve(path).exists(),route+': broken local resource '+value)
            if n.tag=='a' and path in routes: edges[route].append(path)
    if p['project']:
        article = doc.find(id=p['project'])
        check(article is not None,route+': missing project')
        check(article.text()==source.find(id=p['project']).text(),route+': project write-up was truncated or changed')
        for n in [article,*article.nodes()]:
            check('hidden' not in n.attrs,route+': project text hidden before JavaScript')
        if p['project'].startswith('jlr-'):
            check(not doc.find(id='work-project-links').find(tag='a'),route+': JLR resources must stay empty')

seen, queue = set(), deque(['/'])
while queue:
    route = queue.popleft()
    if route in seen: continue
    seen.add(route)
    queue.extend(edges.get(route,[]))
check(seen==routes,'Unreachable routes: '+str(routes-seen))
sitemap = ET.parse(root/'sitemap.xml')
sitemap_paths = {urlparse(n.text).path for n in sitemap.findall('.//{*}loc')}
check(routes<=sitemap_paths,'New routes missing from sitemap')
for route in sitemap_paths: check(resolve(route).exists(),'Sitemap points to missing file: '+route)
check('noindex' in (root/'404.html').read_text(),'404 needs noindex')
check('Sitemap: https://nandanadileep.com/sitemap.xml' in (root/'robots.txt').read_text(),'robots sitemap missing')
if errors:
    print('\n'.join(errors)); raise SystemExit(1)
print(f'PASS: {len(routes)} unique, reachable pages; HTML content, metadata, schema JSON, ARIA, internal links and {len(sitemap_paths)} sitemap URLs checked.')
