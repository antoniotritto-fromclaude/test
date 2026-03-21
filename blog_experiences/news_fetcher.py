"""
Fetches Italian travel, food, and tourism news about Puglia from RSS/Google News feeds.
Returns articles published in the last 14 days relevant to the I Love Apulia blog.
Uses only stdlib (urllib + xml.etree) — no feedparser dependency.
"""

import logging
import re
import xml.etree.ElementTree as ET
from datetime import datetime, timezone, timedelta
from email.utils import parsedate_to_datetime
from urllib.request import Request, urlopen
from urllib.error import URLError
from urllib.parse import quote_plus

logger = logging.getLogger(__name__)

# Curated RSS sources for Puglia travel/food/tourism content
RSS_SOURCES = [
    # Puglia-specific tourism and lifestyle
    {
        "url": "https://www.viaggiareinpuglia.it/feed",
        "fonte": "ViaggiareInPuglia",
    },
    {
        "url": "https://www.puglialive.net/feed/",
        "fonte": "PugliaLive",
    },
    {
        "url": "https://lagazzettadelmezzogiorno.it/rss/tuttenews.xml",
        "fonte": "GazzettaMezzogiorno",
    },
    # Italian food & travel magazines
    {
        "url": "https://www.gamberorosso.it/feed/",
        "fonte": "GamberoRosso",
    },
    {
        "url": "https://www.dissapore.com/feed/",
        "fonte": "Dissapore",
    },
    # Google News RSS — Puglia tourism queries (reliable fallback)
    {
        "url": (
            "https://news.google.com/rss/search"
            "?q=Puglia+turismo+ristorante+hotel&hl=it&gl=IT&ceid=IT:it"
        ),
        "fonte": "GoogleNews-Turismo",
    },
    {
        "url": (
            "https://news.google.com/rss/search"
            "?q=Puglia+esperienza+gastronomia+masseria&hl=it&gl=IT&ceid=IT:it"
        ),
        "fonte": "GoogleNews-Food",
    },
    {
        "url": (
            "https://news.google.com/rss/search"
            "?q=Salento+Bari+Lecce+cosa+fare+visitare&hl=it&gl=IT&ceid=IT:it"
        ),
        "fonte": "GoogleNews-Guide",
    },
]

MAX_PER_SOURCE = 8
LOOKBACK_DAYS = 14  # wider window than Saturday Brief — travel content ages slower

NS = {
    "atom": "http://www.w3.org/2005/Atom",
    "dc":   "http://purl.org/dc/elements/1.1/",
    "media": "http://search.yahoo.com/mrss/",
}

_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (X11; Linux x86_64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/122.0.0.0 Safari/537.36"
    ),
    "Accept": "application/rss+xml, application/xml, text/xml, */*",
    "Accept-Language": "it-IT,it;q=0.9,en;q=0.8",
}


def _get_text(el, *tags) -> str:
    for tag in tags:
        child = el.find(tag)
        if child is not None and child.text:
            return child.text.strip()
        for prefix, uri in NS.items():
            child = el.find(f"{{{uri}}}{tag}")
            if child is not None and child.text:
                return child.text.strip()
    return ""


def _clean_html(text: str) -> str:
    clean = re.sub(r"<[^>]+>", " ", text or "")
    return " ".join(clean.split())[:400]


def _parse_date(raw: str) -> datetime | None:
    if not raw:
        return None
    raw = raw.strip()
    try:
        dt = parsedate_to_datetime(raw)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt
    except Exception:
        pass
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
    req = Request(url, headers=_HEADERS)
    try:
        with urlopen(req, timeout=15) as resp:
            return resp.read().decode("utf-8", errors="replace")
    except URLError as e:
        logger.warning("HTTP error fetching %s: %s", url, e)
        return None


def _parse_feed(xml_text: str, fonte: str, cutoff: datetime, max_items: int) -> list[dict]:
    articles = []
    try:
        root = ET.fromstring(xml_text)
    except ET.ParseError as e:
        logger.warning("XML parse error for %s: %s", fonte, e)
        return articles

    tag = root.tag.lower().strip("{}")
    if "rss" in tag or root.find("channel") is not None:
        items = root.findall(".//item")
    else:
        items = (
            root.findall("atom:entry", NS)
            or root.findall("{http://www.w3.org/2005/Atom}entry")
            or root.findall(".//entry")
        )

    for item in items:
        if len(articles) >= max_items:
            break

        titolo = _get_text(item, "title")
        if not titolo:
            continue

        link = _get_text(item, "link")
        if not link:
            link_el = item.find("{http://www.w3.org/2005/Atom}link") or item.find("link")
            if link_el is not None:
                link = link_el.get("href", "")
        if not link:
            continue

        raw_date = _get_text(item, "pubDate", "published", "updated", "dc:date")
        pub_date = _parse_date(raw_date)
        if pub_date and pub_date < cutoff:
            continue

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


def fetch_travel_news() -> list[dict]:
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

            articles = _parse_feed(xml_text, source["fonte"], cutoff, MAX_PER_SOURCE)
            all_articles.extend(articles)
            logger.info("Feed %s: %d articoli recuperati", source["fonte"], len(articles))

        except Exception as e:
            logger.warning("Errore fetch %s: %s", source["url"], e)
            continue

    logger.info("Totale notizie travel recuperate: %d", len(all_articles))
    return all_articles
