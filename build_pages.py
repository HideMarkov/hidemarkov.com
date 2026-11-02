"""Build the published pages from src.html.

src.html holds both languages (<span class="de">/<span class="en">). This script writes
  index.html     German page  (https://hidemarkov.com/)
  en/index.html  English page (https://hidemarkov.com/en/)
each with only its own language, its own title/description/preview image, hreflang links and
structured data, plus sitemap.xml and robots.txt.  Run after every edit:  python build_pages.py
"""
import json
import os
import re
from datetime import date

SITE = "https://hidemarkov.com"
ICON_SVG = ("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='421 204 694 384'%3E"
            "%3Cg fill='%232CF97A'%3E%3Cpath d='M441 224H515V355H699.5L760 401V568H685V420H515V568H441Z'/%3E"
            "%3Cpath d='M685 224L890 380L1095 224V568H1020V377L890 476L685 320Z'/%3E%3C/g%3E%3C/svg%3E")

PAGES = {
    "de": {
        "path": "/", "file": "index.html", "locale": "de_CH", "image": "/og.png",
        "title": "HideMarkov - Process Mining, Automatisierung & Anwendungsentwicklung für KMU",
        "description": "Wir machen KMU stark genug, um mit den Grossen mitzuhalten: Process Mining, "
                       "Automatisierung und Anwendungsentwicklung für KMU in der Schweiz und in Deutschland. "
                       "Daten bleiben in der EU.",
    },
    "en": {
        "path": "/en/", "file": "en/index.html", "locale": "en_GB", "image": "/og-en.png",
        "title": "HideMarkov - Process mining, automation & application development for SMEs",
        "description": "We lift small and mid-sized companies to keep up with the big players: process mining, "
                       "automation and application development for SMEs in Switzerland and Germany. "
                       "Data stays in the EU.",
    },
}

SAME_AS = [
    "https://www.youtube.com/@HideMarkov",
    "https://www.tiktok.com/@markovclips",
    "https://www.instagram.com/markovclips",
    "https://www.facebook.com/profile.php?id=61595314524714",
    "https://x.com/MarkovClips",
]


def strip_lang(html, cls):
    """Remove every <span class="cls">...</span> including nested spans."""
    opener = f'<span class="{cls}">'
    out, i = [], 0
    while True:
        j = html.find(opener, i)
        if j < 0:
            out.append(html[i:])
            return "".join(out)
        out.append(html[i:j])
        depth, k = 0, j
        for m in re.compile(r"<span\b|</span>").finditer(html, j):
            depth += 1 if m.group() == "<span" else -1
            if depth == 0:
                k = m.end()
                break
        i = k


def unwrap_lang(html, cls):
    """Turn <span class="cls">X</span> into X (keeps nested markup)."""
    opener = f'<span class="{cls}">'
    while opener in html:
        j = html.index(opener)
        depth = 0
        for m in re.compile(r"<span\b|</span>").finditer(html, j):
            depth += 1 if m.group() == "<span" else -1
            if depth == 0:
                html = html[:j] + html[j + len(opener):m.start()] + html[m.end():]
                break
    return html


def meta(lang):
    p = PAGES[lang]
    url = SITE + p["path"]
    org = {
        "@context": "https://schema.org",
        "@type": "ProfessionalService",
        "name": "HideMarkov",
        "url": SITE + "/",
        "logo": SITE + "/icon-512.png",
        "image": SITE + p["image"],
        "description": p["description"],
        "email": "info@hidemarkov.com",
        "address": {
            "@type": "PostalAddress",
            "streetAddress": "Charlottenweg 3a",
            "postalCode": "8212",
            "addressLocality": "Neuhausen am Rheinfall",
            "addressCountry": "CH",
        },
        "areaServed": ["CH", "DE"],
        "knowsAbout": ["Process Mining", "Automation", "Application development"],
        "sameAs": SAME_AS,
    }
    lines = [
        f'<title>{p["title"]}</title>',
        f'<meta name="description" content="{p["description"]}">',
        '<meta name="robots" content="index, follow">',
        '<meta name="theme-color" content="#000000">',
        f'<link rel="canonical" href="{url}">',
        f'<link rel="alternate" hreflang="de" href="{SITE}/">',
        f'<link rel="alternate" hreflang="en" href="{SITE}/en/">',
        f'<link rel="alternate" hreflang="x-default" href="{SITE}/">',
        f'<link rel="icon" href="{ICON_SVG}">',
        '<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png">',
        '<link rel="apple-touch-icon" href="/apple-touch-icon.png">',
        '<meta property="og:type" content="website">',
        '<meta property="og:site_name" content="HideMarkov">',
        f'<meta property="og:url" content="{url}">',
        f'<meta property="og:title" content="{p["title"]}">',
        f'<meta property="og:description" content="{p["description"]}">',
        f'<meta property="og:image" content="{SITE}{p["image"]}">',
        '<meta property="og:image:width" content="1200">',
        '<meta property="og:image:height" content="630">',
        f'<meta property="og:locale" content="{p["locale"]}">',
        '<meta name="twitter:card" content="summary_large_image">',
        f'<meta name="twitter:title" content="{p["title"]}">',
        f'<meta name="twitter:description" content="{p["description"]}">',
        f'<meta name="twitter:image" content="{SITE}{p["image"]}">',
        '<script type="application/ld+json">' + json.dumps(org, ensure_ascii=False) + '</script>',
    ]
    return "\n".join(lines)


def build(src, lang):
    other = "en" if lang == "de" else "de"
    html = strip_lang(src, other)
    html = unwrap_lang(html, lang)
    html = html.replace('<html lang="de">', f'<html lang="{lang}">', 1)
    html = html.replace('<body data-lang="de">', f'<body data-lang="{lang}">', 1)
    html = re.sub(r"<!-- META.*?<!-- /META -->", lambda m: meta(lang), html, count=1, flags=re.S)
    if "–" in html or "—" in html:
        raise SystemExit(f"long dash found in {lang} page - site style forbids it")
    return html


def main():
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    src = open("src.html", encoding="utf-8").read()
    for lang, p in PAGES.items():
        os.makedirs(os.path.dirname(p["file"]) or ".", exist_ok=True)
        with open(p["file"], "w", encoding="utf-8") as f:
            f.write(build(src, lang))
    today = date.today().isoformat()
    urls = "".join(
        f"""  <url>
    <loc>{SITE}{p["path"]}</loc>
    <lastmod>{today}</lastmod>
    <xhtml:link rel="alternate" hreflang="de" href="{SITE}/"/>
    <xhtml:link rel="alternate" hreflang="en" href="{SITE}/en/"/>
  </url>
""" for p in PAGES.values())
    with open("sitemap.xml", "w", encoding="utf-8") as f:
        f.write('<?xml version="1.0" encoding="UTF-8"?>\n'
                '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" '
                'xmlns:xhtml="http://www.w3.org/1999/xhtml">\n' + urls + "</urlset>\n")
    with open("robots.txt", "w", encoding="utf-8") as f:
        f.write(f"User-agent: *\nAllow: /\n\nSitemap: {SITE}/sitemap.xml\n")
    print("built index.html, en/index.html, sitemap.xml, robots.txt")


if __name__ == "__main__":
    main()
