#!/usr/bin/env python3
"""Builds search-engine-readable blog pages (frontend/blog/*.html) and updates
frontend/sitemap.xml from the live Realty Hub API."""
import html
import json
import re
import unicodedata
import urllib.request
from pathlib import Path

from bs4 import BeautifulSoup

SITE = "https://realtyhub.co.in"
API_BLOG = "https://api.realtyhub.co.in/api/blog/"
ROOT = Path(__file__).resolve().parent.parent
FRONTEND = ROOT / "frontend"
OUT_DIR = FRONTEND / "blog"
TEMPLATE = FRONTEND / "blog-post.html"
SITEMAP = FRONTEND / "sitemap.xml"
BLOCK = re.compile(r"^<(h[1-6]|ul|ol|details|div|table|blockquote|p|figure|hr)\b", re.I)


def e(text):
    return html.escape(text or "", quote=True)


def fetch(url):
    last = None
    for _ in range(4):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "RealtyHub-static-builder"})
            with urllib.request.urlopen(req, timeout=90) as r:
                return json.loads(r.read().decode("utf-8"))
        except Exception as exc:  # server may be waking up, so retry
            last = exc
    raise SystemExit("Could not read %s: %s" % (url, last))


def slugify(text):
    text = unicodedata.normalize("NFKD", text or "").encode("ascii", "ignore").decode()
    text = re.sub(r"[^a-zA-Z0-9]+", "-", text.lower()).strip("-")
    if len(text) > 70:
        text = text[:70].rsplit("-", 1)[0]
    return text or "post"


def plain(text, limit=155):
    t = re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", text or "")).strip()
    return t if len(t) <= limit else t[:limit].rsplit(" ", 1)[0] + "..."


def render_body(raw):
    """Same rules as the website: one block per line, plain lines become paragraphs."""
    out = []
    for line in str(raw or "").splitlines():
        t = line.strip()
        if not t:
            continue
        if not BLOCK.match(t):
            t = "<p>" + t + "</p>"
        out.append(str(BeautifulSoup(t, "html.parser")))  # closes any unclosed tags
    return "".join(out)


def fill(page, attr, inner):
    pattern = re.compile(r"(<(\w+)\b[^>]*\b%s\b[^>]*>)(.*?)(</\2>)" % re.escape(attr), re.S)
    return pattern.sub(lambda m: m.group(1) + inner + m.group(4), page, count=1)


def set_img(page, src, alt):
    def repl(m):
        tag = re.sub(r'\s(src|alt)="[^"]*"', "", m.group(0))
        tag = tag[:-1].rstrip().rstrip("/").rstrip()
        return '%s src="%s" alt="%s">' % (tag, e(src), e(alt))
    return re.sub(r"<img\b[^>]*data-post-image[^>]*>", repl, page, count=1)


def build_page(template, post, slug):
    url = "%s/blog/%s.html" % (SITE, slug)
    title = "%s | Realty Hub Journal" % post["title"]
    desc = post.get("metaDescription") or post.get("excerpt") or plain(post.get("content"))
    image = post.get("image") or ""
    meta_line = "%s \u00b7 %s" % (post.get("author") or "Realty Hub", post.get("date") or "")
    ld = {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "headline": post["title"],
        "description": desc,
        "image": image,
        "datePublished": post.get("created_at"),
        "dateModified": post.get("updated_at"),
        "author": {"@type": "Person", "name": post.get("author") or "Realty Hub"},
        "publisher": {"@type": "Organization", "name": "Realty Hub", "url": SITE},
        "mainEntityOfPage": url,
    }
    ld = {k: v for k, v in ld.items() if v}
    head = "".join([
        '<meta name="description" content="%s">' % e(desc),
        '<link rel="canonical" href="%s">' % e(url),
        '<meta property="og:type" content="article">',
        '<meta property="og:site_name" content="Realty Hub">',
        '<meta property="og:title" content="%s">' % e(post["title"]),
        '<meta property="og:description" content="%s">' % e(desc),
        '<meta property="og:url" content="%s">' % e(url),
        ('<meta property="og:image" content="%s">' % e(image)) if image else "",
        '<meta name="twitter:card" content="summary_large_image">',
        '<meta name="twitter:title" content="%s">' % e(post["title"]),
        '<meta name="twitter:description" content="%s">' % e(desc),
        ('<meta name="twitter:image" content="%s">' % e(image)) if image else "",
        '<script type="application/ld+json">%s</script>'
        % json.dumps(ld, ensure_ascii=False).replace("</", "<\\/"),
        "<script>if(!location.search){history.replaceState(null,'',location.pathname+'?id=%s');}</script>"
        % post["id"],
    ])

    page = template
    page = re.sub(r"<title>.*?</title>", lambda m: "<title>%s</title>" % e(title), page, count=1, flags=re.S)
    for pat in (r'<meta\s+name="description"[^>]*>', r'<link\s+rel="canonical"[^>]*>',
                r'<meta\s+property="og:[^"]*"[^>]*>', r'<meta\s+name="twitter:[^"]*"[^>]*>'):
        page = re.sub(pat, "", page, flags=re.I)
    page = re.sub(r"<head(\s[^>]*)?>", lambda m: "<head%s><base href=\"/\">" % (m.group(1) or ""),
                  page, count=1, flags=re.I)
    page = page.replace("</head>", head + "</head>", 1)
    page = fill(page, "data-post-category", e(post.get("category")))
    page = fill(page, "data-post-title", e(post["title"]))
    page = fill(page, "data-post-meta", e(meta_line))
    page = set_img(page, image, post["title"])
    page = fill(page, "data-post-body", render_body(post.get("content")))
    return page


def update_sitemap(entries):
    existing = SITEMAP.read_text(encoding="utf-8") if SITEMAP.exists() else ""
    blocks = re.findall(r"<url>.*?</url>", existing, re.S)
    keep = [b for b in blocks if "/blog/" not in b and "blog-post.html" not in b]
    if not keep:
        keep = ["<url><loc>%s/</loc></url>" % SITE]
    new = ["<url><loc>%s</loc><lastmod>%s</lastmod></url>" % (u, d) for u, d in entries]
    xml = ('<?xml version="1.0" encoding="UTF-8"?>\n'
           '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
           + "\n".join(keep + new) + "\n</urlset>\n")
    SITEMAP.write_text(xml, encoding="utf-8")


def main():
    data = fetch(API_BLOG)
    posts = data.get("results", []) if isinstance(data, dict) else data
    posts = [p for p in posts if p.get("status") == "Published"]
    if not posts:
        raise SystemExit("No published posts returned. Leaving files unchanged.")

    template = TEMPLATE.read_text(encoding="utf-8")
    OUT_DIR.mkdir(exist_ok=True)
    used, keep_files, entries = set(), set(), []
    for post in sorted(posts, key=lambda p: p["id"]):
        slug = slugify(post.get("title"))
        if slug in used:
            slug = "%s-%s" % (slug, post["id"])
        used.add(slug)
        (OUT_DIR / (slug + ".html")).write_text(build_page(template, post, slug), encoding="utf-8")
        keep_files.add(slug + ".html")
        url = "%s/blog/%s.html" % (SITE, slug)
        entries.append((url, (post.get("updated_at") or post.get("created_at") or "")[:10]))
        print("Built", url)

    for old in OUT_DIR.glob("*.html"):
        if old.name not in keep_files:
            old.unlink()
            print("Removed", old.name)

    update_sitemap(entries)
    print("Done: %d blog pages and sitemap updated." % len(entries))


if __name__ == "__main__":
    main()