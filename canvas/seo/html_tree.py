"""Small lossless HTML tree for the static exporter; preserves SVG attribute case."""
from html import escape, unescape
from html.parser import HTMLParser
import re

VOID = set('area base br col embed hr img input link meta param source track wbr'.split())

class Node:
    def __init__(self, tag='', attrs=None, raw=''):
        self.tag, self.attrs, self.raw = tag, dict(attrs or []), raw
        self.children = []
        self.parent = None
        self.changed = False

    def append(self, child):
        self.children.append(child)
        if isinstance(child, Node):
            child.parent = self
        return child

    def set(self, key, value):
        self.attrs[key] = value
        self.changed = True

    def remove_attr(self, key):
        self.attrs.pop(key, None)
        self.changed = True

    def remove(self):
        self.parent.children.remove(self)

    def nodes(self):
        for child in self.children:
            if isinstance(child, Node):
                yield child
                yield from child.nodes()

    def find(self, *, id=None, cls=None, tag=None):
        return next((n for n in self.nodes() if
                     (id is None or n.attrs.get('id') == id) and
                     (cls is None or cls in n.attrs.get('class', '').split()) and
                     (tag is None or n.tag == tag)), None)

    def text(self):
        return unescape(re.sub(r'\s+', ' ', ''.join(
            c.text() if isinstance(c, Node) else c for c in self.children))).strip()

    def html(self):
        content = ''.join(c.html() if isinstance(c, Node) else c for c in self.children)
        if not self.tag:
            return content
        start = self.raw
        if self.changed or not start:
            attrs = ''.join(' ' + k + ('' if v is None else '="' + escape(str(v), quote=True) + '"') for k, v in self.attrs.items())
            start = '<' + self.tag + attrs + '>'
        if self.tag in VOID or start.endswith('/>'):
            return start
        # SVG tag names, like linearGradient, are case sensitive.
        original_tag = re.match(r'<([^\s/>]+)', start).group(1)
        return start + content + '</' + original_tag + '>'

class Parser(HTMLParser):
    def __init__(self, source):
        super().__init__(convert_charrefs=False)
        self.root = Node()
        self.stack = [self.root]
        self.feed(source)

    def handle_starttag(self, tag, attrs):
        n = self.stack[-1].append(Node(tag, attrs, self.get_starttag_text()))
        if tag not in VOID:
            self.stack.append(n)

    def handle_startendtag(self, tag, attrs):
        self.stack[-1].append(Node(tag, attrs, self.get_starttag_text()))

    def handle_endtag(self, tag):
        for i in range(len(self.stack)-1, 0, -1):
            if self.stack[i].tag == tag:
                del self.stack[i:]
                break

    def handle_data(self, data):
        self.stack[-1].append(data)

    def handle_entityref(self, name):
        self.handle_data('&' + name + ';')

    def handle_charref(self, name):
        self.handle_data('&#' + name + ';')

    def handle_comment(self, data):
        self.handle_data('<!--' + data + '-->')

    def handle_decl(self, data):
        self.handle_data('<!' + data + '>')

def parse(source):
    return Parser(source).root

def fragment(source):
    return parse(source).children

def replace_contents(node, source):
    node.children = []
    for child in fragment(source):
        node.append(child)
