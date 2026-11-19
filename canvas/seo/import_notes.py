#!/usr/bin/env python3
"""Import Medium RSS posts into canvas/notes for the technical-notes build."""
from email.utils import parsedate_to_datetime
from html import unescape
from pathlib import Path
from urllib.parse import urlparse, unquote
from urllib.request import Request, urlopen
from xml.etree import ElementTree as ET
import json
import re
import ssl

HERE = Path(__file__).resolve().parent
NOTES = HERE.parent / 'notes'
FEED = 'https://medium.com/feed/@nandanadileep29'
NS = {
    'content': 'http://purl.org/rss/1.0/modules/content/',
    'atom': 'http://www.w3.org/2005/Atom',
}
CATALOG = [
    {
        'slug': 'profiling-vllm-a100',
        'post_id': 'eb69a9c7da74',
        'category': 'INFERENCE & PERFORMANCE',
        'description': 'Profiling vLLM on an NVIDIA A100: when KV-cache reuse helps, when attention-layout copies cost latency, and where a routing change only speeds low concurrency.',
    },
    {
        'slug': 'reranker-performance-experiments',
        'post_id': '94670171711f',
        'category': 'INFERENCE & PERFORMANCE',
        'description': '13 reranker experiments on Apple M5 and NVIDIA L40S: compilation, custom Metal, CUDA and Triton kernels, batching, and why faster GPU ops often miss HTTP latency.',
    },
    {
        'slug': 'llm-memory-dreaming-v3-usermemories',
        'post_id': 'c2bd66134d43',
        'category': 'LLM MEMORY',
        'description': 'A technical comparison of ChatGPT Dreaming V3 and Claude userMemories: how two LLM memory architectures inject state, compress history, and change trust boundaries.',
    },
    {
        'slug': 'mlx-llm-serving',
        'post_id': '65b0576ebd05',
        'category': 'INFERENCE SYSTEMS',
        'description': 'Building a vLLM-inspired LLM serving engine on Apple Silicon with MLX: continuous batching, paged KV cache, prefix reuse, and benchmarks against real vLLM.',
    },
    {
        'slug': 'langchain-multi-agent-orchestration',
        'post_id': 'ad6b46ed1058',
        'category': 'MULTI-AGENT SYSTEMS',
        'description': 'How LangChain coordinates multi-agent systems: orchestration patterns, serialized messages, schema contracts, and where communication actually fails.',
    },
    {
        'slug': 'llamaindex-memory-architecture',
        'post_id': 'eef91e01bc2c',
        'category': 'MEMORY ARCHITECTURE',
        'description': "LlamaIndex's four-tier memory architecture: short-term, long-term, episodic, and procedural memory, plus the failure modes each tier still leaves open.",
    },
    {
        'slug': 'agent-failure-modes',
        'post_id': 'f4dfdc7597e1',
        'category': 'AGENT RELIABILITY',
        'description': 'A practical checklist for agent failure modes: hallucination cascades, tool misuse, loops, task drift, and the runtime checks that make those failures harder.',
    },
    {
        'slug': 'claude-code-takeaways',
        'post_id': '3ec2f42b7545',
        'category': 'SYSTEM ARCHITECTURE',
        'description': 'Notes from the leaked Claude Code codebase: the five-layer architecture, query loop, compaction, autoDream memory, and what a systems leak actually exposes.',
    },
    {
        'slug': 'prompt-rag-or-finetune',
        'post_id': 'efdb4ba67a84',
        'category': 'APPLIED AI',
        'description': 'When to prompt, retrieve, or fine-tune: three projects that show which LLM approach is the minimum viable one, and how each fails in production.',
    },
    {
        'slug': 'nanogpt-modern-alternatives',
        'post_id': '718d3e04cfb6',
        'category': 'MODEL ARCHITECTURE',
        'description': 'Swapping nanoGPT components for RMSNorm, SwiGLU, RoPE, GQA, MLA, MoE, and multi-token prediction, with measured validation-loss results on a tiny Shakespeare model.',
    },
]
MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']


def fetch(url):
    request = Request(url, headers={'User-Agent': 'nandanadileep.com technical-notes importer'})
    with urlopen(request, context=ssl.create_default_context(), timeout=60) as response:
        return response.read()


def clean_text(value):
    value = unescape(value or '')
    return re.sub(r'[\xa0\u2009\u202f]', ' ', value).strip()


def slug_filename(url, index):
    name = Path(unquote(urlparse(url).path)).name or f'image-{index}'
    stem, suffix = Path(name).stem, Path(name).suffix.lower() or '.png'
    stem = re.sub(r'[^A-Za-z0-9._-]+', '-', stem).strip('-') or f'image-{index}'
    if suffix not in {'.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'}:
        suffix = '.png'
    return stem[:80] + suffix


def rewrite_pre(match):
    inner = match.group(1).replace('<br>', '\n').replace('<br/>', '\n').replace('<br />', '\n')
    inner = re.sub(r'</?code>', '', inner)
    return '<pre><code>' + inner.strip('\n') + '</code></pre>'


def first_dek(html):
    html = html.lstrip()
    match = re.match(r'<p>\s*<em>(.*?)</em>\s*</p>', html, re.S)
    if match:
        dek = clean_text(re.sub(r'<br\s*/?>', ' ', match.group(1)))
        dek = re.sub(r'<[^>]+>', '', dek)
        dek = re.sub(r'\s+', ' ', dek).strip()
        return dek, html[match.end():].lstrip()
    match = re.match(r'<h2>(.*?)</h2>', html, re.S)
    if match:
        dek = clean_text(re.sub(r'<[^>]+>', '', match.group(1)))
        if 20 < len(dek) < 180:
            return dek, html[match.end():].lstrip()
    return '', html


def clean_body(html, images):
    html = clean_text(html)
    html = re.sub(r'<img[^>]*medium\.com/_/stat[^>]*>', '', html, flags=re.I)
    html = re.sub(r'\?source=rss[^"\']*', '', html)

    def swap_image(match):
        src = match.group(1)
        return f'<img src="{images.get(src, src)}" alt="" loading="lazy">'

    html = re.sub(r'<img[^>]*src="([^"]+)"[^>]*>', swap_image, html)
    html = re.sub(r'<h3(\s[^>]*)?>', r'<h2\1>', html)
    html = re.sub(r'</h3>', '</h2>', html)
    html = re.sub(r'<h4(\s[^>]*)?>', r'<h3\1>', html)
    html = re.sub(r'</h4>', '</h3>', html)
    html = re.sub(r'<pre>(.*?)</pre>', rewrite_pre, html, flags=re.S)
    html = re.sub(r'<strong>(.*?)</strong>', r'<strong>\1</strong>', html)
    html = re.sub(r'\s+\n', '\n', html)
    html = re.sub(r'\n{3,}', '\n\n', html)
    return html.strip()


def download_images(html, slug):
    folder = NOTES / 'images' / slug
    folder.mkdir(parents=True, exist_ok=True)
    mapping = {}
    for index, src in enumerate(re.findall(r'<img[^>]*src="([^"]+)"', html), 1):
        if 'medium.com/_/stat' in src:
            continue
        name = slug_filename(src, index)
        dest = folder / name
        if not dest.exists():
            dest.write_bytes(fetch(src))
        mapping[src] = f'/technical-notes/{slug}/{name}'
    return mapping


def parse_feed():
    root = ET.fromstring(fetch(FEED))
    items = {}
    for item in root.findall('./channel/item'):
        link = (item.findtext('link') or '').split('?')[0]
        guid = item.findtext('guid') or ''
        post_id = guid.rsplit('/', 1)[-1]
        pub = item.findtext('pubDate') or ''
        date = parsedate_to_datetime(pub).date().isoformat() if pub else item.findtext('atom:updated', namespaces=NS)[:10]
        items[post_id] = {
            'title': clean_text(item.findtext('title')),
            'link': link,
            'date': date,
            'html': item.findtext('content:encoded', namespaces=NS) or '',
        }
    return items


def main():
    NOTES.mkdir(exist_ok=True)
    (NOTES / 'bodies').mkdir(exist_ok=True)
    feed = parse_feed()
    manifest = []
    for entry in CATALOG:
        item = feed[entry['post_id']]
        images = download_images(item['html'], entry['slug'])
        body = clean_body(item['html'], images)
        dek, body = first_dek(body)
        (NOTES / 'bodies' / f"{entry['slug']}.html").write_text(body + '\n')
        year, month, day = item['date'].split('-')
        display = f'{int(day):02d} {MONTHS[int(month)-1]} {year}'
        record = {key: value for key, value in entry.items() if key != 'post_id'}
        record.update({
            'title': item['title'],
            'medium': item['link'],
            'date': item['date'],
            'displayDate': display,
            'dek': dek,
            'path': f"/technical-notes/{entry['slug']}/",
            'hosted': True,
        })
        manifest.append(record)
    mycelium = {
        'slug': 'mycelium',
        'title': 'Mycelium: Turning AI Agents into Reliable Systems',
        'category': 'AGENT RELIABILITY',
        'description': 'How Mycelium gives consequential AI-agent actions stable identity, durable state, guardrails, reconciliation, and evidence-based recovery.',
        'medium': '',
        'date': '2026-08-30',
        'displayDate': '30 Aug 2026',
        'dek': 'A technical essay on stable action identity, durable claims, and recovery classification.',
        'path': '/read-about-mycelium/',
        'hosted': False,
    }
    manifest.append(mycelium)
    for note in manifest:
        note['hosted'] = note.get('hosted', True)
    manifest.sort(key=lambda note: note['date'], reverse=True)
    (NOTES / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
    print(f'Imported {len(manifest)} technical notes into {NOTES}')


if __name__ == '__main__':
    main()
