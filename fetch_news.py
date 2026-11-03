"""Fetch recent news, computer-science and science items from public RSS/Atom feeds into news.json.

Runs in GitHub Actions every few hours (see .github/workflows/news.yml), standard library only.
The website reads news.json from its own domain, so visitors never contact the news sites.
"""
import json
import re
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from html import unescape

FEEDS = {
    "news": [
        ("SRF", "https://www.srf.ch/news/bnf/rss/1926"),
        ("NZZ", "https://www.nzz.ch/wirtschaft.rss"),
        ("NZZ", "https://www.nzz.ch/technologie.rss"),
        ("tagesschau", "https://www.tagesschau.de/wirtschaft/index~rss2.xml"),
        ("BBC", "https://feeds.bbci.co.uk/news/business/rss.xml"),
        ("DW", "https://rss.dw.com/xml/rss-en-bus"),
    ],
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

# Reddit: top posts of the day from a few subreddits (one request), only links to known news outlets.
REDDIT_URL = "https://www.reddit.com/r/Economics+technology+Switzerland/top/.rss?t=day&limit=50"
REDDIT_SLOTS = 2
REDDIT_TAG = re.compile(r"\s*[(\[](gift (article|link)|paywall[^)\]]*)[)\]]", re.I)  # "(Gift Article)" etc.
NEWS_DOMAINS = {
    "reuters.com", "apnews.com", "bbc.com", "bbc.co.uk", "ft.com", "bloomberg.com", "economist.com",
    "wsj.com", "nytimes.com", "washingtonpost.com", "theguardian.com", "cnbc.com", "npr.org", "axios.com",
    "politico.eu", "euronews.com", "dw.com", "srf.ch", "nzz.ch", "swissinfo.ch", "tagesanzeiger.ch",
    "admin.ch", "tagesschau.de", "spiegel.de", "zeit.de", "faz.net", "handelsblatt.com", "heise.de",
    "arstechnica.com", "theverge.com", "wired.com", "techcrunch.com", "technologyreview.com",
}
ATOM = "{http://www.w3.org/2005/Atom}"
SHOW_TITLE = re.compile(r"vom \d{2}\.\d{2}\.\d{4}")  # broadcast episodes like "Wirtschaft vor acht vom 03.11.2026"


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


def fetch(source, url, per_feed=PER_FEED):
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
    items = [i for i in items if i["title"] and i["link"].startswith("http") and i["date"]
             and not SHOW_TITLE.search(i["title"])]
    items.sort(key=lambda i: i["date"], reverse=True)
    for i in items:
        i["source"] = source
    return items[:per_feed]


def domain(url):
    host = urllib.parse.urlparse(url).hostname or ""
    return host[4:] if host.startswith("www.") else host


def is_news_outlet(url):
    host = domain(url)
    return any(host == d or host.endswith("." + d) for d in NEWS_DOMAINS)


def fetch_reddit():
    req = urllib.request.Request(REDDIT_URL, headers={"User-Agent": "hidemarkov.com news bot (+https://hidemarkov.com)"})
    with urllib.request.urlopen(req, timeout=20) as resp:
        root = ET.fromstring(resp.read())
    items = []
    for it in root.iter(ATOM + "entry"):
        # the entry content is HTML with a "[link]" anchor pointing at the shared article
        found = re.search(r'<a href="([^"]+)">\[link\]</a>', it.findtext(ATOM + "content") or "")
        cat = it.find(ATOM + "category")
        date = parse_date(it.findtext(ATOM + "published") or it.findtext(ATOM + "updated"))
        if not found or not date:
            continue
        link = unescape(found.group(1))
        if not is_news_outlet(link):
            continue
        sub = cat.get("label") if cat is not None else "Reddit"
        items.append({
            "title": REDDIT_TAG.sub("", clean(it.findtext(ATOM + "title"))),
            "link": link,
            "summary": "",
            "date": date,
            "source": f"{domain(link)} via Reddit {sub}",
        })
    return items[:REDDIT_SLOTS]


def collect(feeds, extra=(), per_feed=PER_FEED):
    collected = []
    for source, url in feeds:
        try:
            collected += fetch(source, url, per_feed)
        except Exception as exc:  # one broken feed must not empty the list
            print(f"skip {source}: {exc}")
    collected.sort(key=lambda i: i["date"], reverse=True)
    picked = list(extra) + collected[:TOTAL - len(extra)]
    picked.sort(key=lambda i: i["date"], reverse=True)
    return [dict(i, date=i["date"].date().isoformat()) for i in picked]


def main():
    out = {"updated": datetime.now(timezone.utc).isoformat(timespec="minutes")}
    reddit = []
    try:
        reddit = fetch_reddit()
    except Exception as exc:  # Reddit often rate-limits; the outlets then fill all slots
        print(f"skip Reddit: {exc}")
    for key, feeds in FEEDS.items():
        if key == "news":
            out[key] = collect(feeds, reddit, per_feed=1)  # one article per outlet for variety
        else:
            out[key] = collect(feeds)
    with open("news.json", "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=1)
    print({k: len(v) for k, v in out.items() if k != "updated"})


if __name__ == "__main__":
    main()
