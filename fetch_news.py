"""Fetch recent computer-science and science news from public RSS/Atom feeds into news.json.

Runs in GitHub Actions every few hours (see .github/workflows/news.yml), standard library only.
The website reads news.json from its own domain, so visitors never contact the news sites.
"""
import json
import re
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from html import unescape

FEEDS = {
    "cs": [
        ("Quanta Magazine", "https://www.quantamagazine.org/computer-science/feed/"),
        ("MIT News", "https://news.mit.edu/topic/mitcomputers-rss.xml"),
        ("IEEE Spectrum", "https://spectrum.ieee.org/feeds/topic/computing.rss"),
        ("MIT Technology Review", "https://www.technologyreview.com/topic/artificial-intelligence/feed"),
        ("Ars Technica", "https://feeds.arstechnica.com/arstechnica/technology-lab"),
    ],
    "science": [
        ("Quanta Magazine", "https://www.quantamagazine.org/physics/feed/"),
        ("Quanta Magazine", "https://www.quantamagazine.org/biology/feed/"),
        ("ScienceDaily", "https://www.sciencedaily.com/rss/top/science.xml"),
        ("Quanta Magazine", "https://www.quantamagazine.org/mathematics/feed/"),
        ("Ars Technica", "https://feeds.arstechnica.com/arstechnica/science"),
    ],
}
PER_FEED = 2
TOTAL = 6
ATOM = "{http://www.w3.org/2005/Atom}"


def parse_date(text):
    if not text:
        return None
    text = text.strip()
    try:
        return parsedate_to_datetime(text).astimezone(timezone.utc)
    except (TypeError, ValueError):
        pass
    try:
        return datetime.fromisoformat(text.replace("Z", "+00:00")).astimezone(timezone.utc)
    except ValueError:
        return None


def clean(text, limit=None):
    text = unescape(re.sub(r"<[^>]+>", " ", text or ""))
    text = re.sub(r"[–—]", "-", text)  # site style: no long dashes
    text = re.sub(r"\s+", " ", text).strip()
    if limit and len(text) > limit:
        text = text[:limit].rsplit(" ", 1)[0] + " …"
    return text


def fetch(source, url):
    req = urllib.request.Request(url, headers={"User-Agent": "hidemarkov.com news bot"})
    with urllib.request.urlopen(req, timeout=20) as resp:
        root = ET.fromstring(resp.read())
    items = []
    for it in root.iter("item"):
        items.append({
            "title": clean(it.findtext("title")),
            "link": (it.findtext("link") or "").strip(),
            "summary": clean(it.findtext("description"), 180),
            "date": parse_date(it.findtext("pubDate")),
        })
    for it in root.iter(ATOM + "entry"):
        link = it.find(ATOM + "link")
        items.append({
            "title": clean(it.findtext(ATOM + "title")),
            "link": link.get("href", "") if link is not None else "",
            "summary": clean(it.findtext(ATOM + "summary"), 180),
            "date": parse_date(it.findtext(ATOM + "updated") or it.findtext(ATOM + "published")),
        })
    items = [i for i in items if i["title"] and i["link"].startswith("http") and i["date"]]
    items.sort(key=lambda i: i["date"], reverse=True)
    for i in items:
        i["source"] = source
    return items[:PER_FEED]


def collect(feeds):
    collected = []
    for source, url in feeds:
        try:
            collected += fetch(source, url)
        except Exception as exc:  # one broken feed must not empty the list
            print(f"skip {source}: {exc}")
    collected.sort(key=lambda i: i["date"], reverse=True)
    return [dict(i, date=i["date"].date().isoformat()) for i in collected[:TOTAL]]


def main():
    out = {"updated": datetime.now(timezone.utc).isoformat(timespec="minutes")}
    for key, feeds in FEEDS.items():
        out[key] = collect(feeds)
    with open("news.json", "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=1)
    print({k: len(v) for k, v in out.items() if k != "updated"})


if __name__ == "__main__":
    main()
