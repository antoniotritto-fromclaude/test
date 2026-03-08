"""
Fetches and parses Italian financial/economic news from RSS feeds.
Returns articles published in the last 7 days.
Uses only stdlib (urllib + xml.etree) — no feedparser dependency.
"""

import logging
import re
import xml.etree.ElementTree as ET
from datetime import datetime, timezone, timedelta
from email.utils import parsedate_to_datetime
from urllib.request import Request, urlopen
from urllib.error import URLError

logger = logging.getLogger(__name__)

RSS_SOURCES = [
    {"url": "https://www.ilsole24ore.com/rss/economia.xml",            "fonte": "Sole24Ore"},
    {"url": "https://www.ansa.it/sito/notizie/economia/economia.rss",  "fonte": "ANSA"},
    {"url": "https://www.mef.gov.it/it/media/news/index.html?rss",    "fonte": "MEF"},
    {"url": "https://www.bancaditalia.it/media/notizie/index.html?rss","fonte": "BancaItalia"},
    {"url": "https://it.reuters.com/rss/economia",                     "fonte": "Reuters"},
]

MAX_PER_SOURCE = 6
LOOKBACK_DAYS = 7

# Common RSS/Atom namespaces
NS = {
    "atom": "http://www.w3.org/2005/Atom",
    "dc":   "http://purl.org/dc/elements/1.1/",
    "media":"http://search.yahoo.com/mrss/",
}


def _get_text(el, *tags) -> str:
    """Try multiple tag names (with/without namespace), return first non-empty text."""
    for tag in tags:
        child = el.find(tag)
        if child is not None and child.text:
            return child.text.strip()
        # Try with common namespaces
        for prefix, uri in NS.items():
            child = el.find(f"{{{uri}}}{tag}")
            if child is not None and child.text:
                return child.text.strip()
    return ""


def _clean_html(text: str) -> str:
    """Strip HTML tags and collapse whitespace."""
    clean = re.sub(r"<[^>]+>", " ", text or "")
    return " ".join(clean.split())[:300]


def _parse_date(raw: str) -> datetime | None:
    """Parse RFC 2822 (RSS) or ISO 8601 (Atom) date strings."""
    if not raw:
        return None
    raw = raw.strip()
    # Try RFC 2822 (pubDate in RSS)
    try:
        dt = parsedate_to_datetime(raw)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt
    except Exception:
        pass
    # Try ISO 8601 (Atom published/updated)
    for fmt in ("%Y-%m-%dT%H:%M:%S%z", "%Y-%m-%dT%H:%M:%SZ", "%Y-%m-%d"):
        try:
            dt = datetime.strptime(raw[:25], fmt)
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            return dt
        except Exception:
            continue
    return None


def _fetch_url(url: str) -> str | None:
    """Fetch URL content as UTF-8 string with a browser User-Agent."""
    req = Request(url, headers={
        "User-Agent": "Mozilla/5.0 (compatible; SaturdayBrief/1.0; +https://github.com)"
    })
    try:
        with urlopen(req, timeout=15) as resp:
            return resp.read().decode("utf-8", errors="replace")
    except URLError as e:
        logger.warning("HTTP error fetching %s: %s", url, e)
        return None


def _parse_rss_feed(xml_text: str, fonte: str, cutoff: datetime, max_items: int) -> list[dict]:
    """Parse RSS 2.0 or Atom feed XML, return filtered article dicts."""
    articles = []
    try:
        root = ET.fromstring(xml_text)
    except ET.ParseError as e:
        logger.warning("XML parse error for %s: %s", fonte, e)
        return articles

    tag = root.tag.lower().strip("{}")
    # Detect feed type: RSS wraps items in <channel>, Atom uses <entry> directly
    if "rss" in tag or root.find("channel") is not None:
        items = root.findall(".//item")
    else:
        # Atom feed
        items = (
            root.findall("atom:entry", NS)
            or root.findall("{http://www.w3.org/2005/Atom}entry")
            or root.findall(".//entry")
        )

    for item in items:
        if len(articles) >= max_items:
            break

        # Title
        titolo = _get_text(item, "title")
        if not titolo:
            continue

        # Link — RSS uses <link> text, Atom uses <link href="...">
        link = _get_text(item, "link")
        if not link:
            # Atom <link> element with href attribute
            link_el = item.find("{http://www.w3.org/2005/Atom}link") or item.find("link")
            if link_el is not None:
                link = link_el.get("href", "")
        if not link:
            continue

        # Date
        raw_date = _get_text(item, "pubDate", "published", "updated", "dc:date")
        pub_date = _parse_date(raw_date)
        if pub_date and pub_date < cutoff:
            continue  # too old

        # Summary
        raw_summary = _get_text(item, "description", "summary", "content")
        sommario = _clean_html(raw_summary)

        articles.append({
            "titolo": titolo,
            "url": link,
            "fonte": fonte,
            "data": pub_date.strftime("%Y-%m-%d") if pub_date else "n/d",
            "sommario": sommario,
        })

    return articles


def fetch_weekly_news() -> list[dict]:
    """
    Fetch articles from all RSS sources published in the last LOOKBACK_DAYS days.

    Returns:
        List of dicts with keys: titolo, url, fonte, data (ISO string), sommario
    """
    cutoff = datetime.now(timezone.utc) - timedelta(days=LOOKBACK_DAYS)
    all_articles = []

    for source in RSS_SOURCES:
        try:
            xml_text = _fetch_url(source["url"])
            if not xml_text:
                logger.warning("Nessun contenuto da: %s", source["url"])
                continue

            articles = _parse_rss_feed(xml_text, source["fonte"], cutoff, MAX_PER_SOURCE)
            all_articles.extend(articles)
            logger.info("Feed %s: %d articoli recuperati", source["fonte"], len(articles))

        except Exception as e:
            logger.warning("Errore fetch %s: %s", source["url"], e)
            continue

    logger.info("Totale notizie recuperate: %d", len(all_articles))
    return all_articles
