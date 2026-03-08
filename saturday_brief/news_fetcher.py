"""
Fetches and parses Italian financial/economic news from RSS feeds.
Returns articles published in the last 7 days.
"""

import feedparser
import logging
from datetime import datetime, timezone, timedelta
from dateutil import parser as dateparser

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


def _parse_date(entry) -> datetime | None:
    """Extract and parse publication date from a feedparser entry."""
    raw = (
        getattr(entry, "published", None)
        or getattr(entry, "updated", None)
        or getattr(entry, "created", None)
    )
    if not raw:
        return None
    try:
        dt = dateparser.parse(raw)
        if dt and dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt
    except Exception:
        return None


def _extract_summary(entry) -> str:
    """Extract a clean text summary (max 300 chars) from a feedparser entry."""
    raw = (
        getattr(entry, "summary", None)
        or getattr(entry, "description", None)
        or ""
    )
    # Strip HTML tags roughly
    import re
    clean = re.sub(r"<[^>]+>", " ", raw).strip()
    clean = " ".join(clean.split())
    return clean[:300]


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
            feed = feedparser.parse(source["url"])
            if feed.bozo and not feed.entries:
                logger.warning("Feed non raggiungibile o malformato: %s", source["url"])
                continue

            count = 0
            for entry in feed.entries:
                if count >= MAX_PER_SOURCE:
                    break

                pub_date = _parse_date(entry)
                if pub_date and pub_date < cutoff:
                    continue  # troppo vecchio

                link = getattr(entry, "link", None) or getattr(entry, "id", "")
                titolo = getattr(entry, "title", "").strip()
                if not titolo or not link:
                    continue

                all_articles.append({
                    "titolo": titolo,
                    "url": link,
                    "fonte": source["fonte"],
                    "data": pub_date.strftime("%Y-%m-%d") if pub_date else "n/d",
                    "sommario": _extract_summary(entry),
                })
                count += 1

            logger.info("Feed %s: %d articoli recuperati", source["fonte"], count)

        except Exception as e:
            logger.warning("Errore fetch %s: %s", source["url"], e)
            continue

    logger.info("Totale notizie recuperate: %d", len(all_articles))
    return all_articles
