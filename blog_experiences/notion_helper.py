"""
Notion API wrapper for Blog Experiences.
Reads existing blog ideas (last 90 days) and publishes new ones.

Target database: content planning database for "I Love Apulia" blog.
Properties mirror the blog's article schema plus editorial tracking fields.
"""

import logging
import os
from datetime import datetime, timezone, timedelta

from notion_client import Client
from notion_client.errors import APIResponseError

logger = logging.getLogger(__name__)

# Properties expected in the content-ideas database.
# Added automatically if missing.
REQUIRED_PROPERTIES = {
    "Sottotitolo": {"rich_text": {}},
    "Categoria": {
        "select": {
            "options": [
                {"name": "dove-mangiare"},
                {"name": "dove-dormire"},
                {"name": "altri-servizi"},
            ]
        }
    },
    "Provincia": {
        "select": {
            "options": [
                {"name": "Bari"},
                {"name": "Brindisi"},
                {"name": "Foggia"},
                {"name": "Lecce"},
                {"name": "Taranto"},
                {"name": "BAT"},
            ]
        }
    },
    "Idea Contenuto": {"rich_text": {}},
    "Slug Suggerito": {"rich_text": {}},
    "Fonte": {"url": {}},
    "Data Generazione": {"date": {}},
    "Status": {
        "select": {
            "options": [
                {"name": "Da valutare"},
                {"name": "Approvato"},
                {"name": "In scrittura"},
                {"name": "Pubblicato"},
                {"name": "Scartato"},
            ]
        }
    },
}


def _get_client() -> Client:
    api_key = os.environ["NOTION_API_KEY"]
    return Client(auth=api_key)


def ensure_database_schema(database_id: str) -> str:
    """
    Verifies the database exists, adds missing properties, and returns
    the name of the title property (renaming it to 'Titolo' if needed).
    """
    client = _get_client()
    try:
        db = client.databases.retrieve(database_id=database_id)
    except APIResponseError as e:
        raise RuntimeError(
            f"Database Notion non trovato (ID: {database_id}). "
            f"Verifica il secret NOTION_BLOG_DATABASE_ID e che l'integration abbia accesso. "
            f"Errore: {e}"
        )

    existing = db.get("properties", {})

    # Find and normalise the title property
    title_prop_name = "Titolo"
    for name, prop in existing.items():
        if prop.get("type") == "title":
            title_prop_name = name
            break

    if title_prop_name != "Titolo":
        logger.info("Rinomino proprietà title da '%s' a 'Titolo'", title_prop_name)
        try:
            client.databases.update(
                database_id=database_id,
                properties={title_prop_name: {"name": "Titolo"}},
            )
            title_prop_name = "Titolo"
        except Exception as e:
            logger.warning(
                "Impossibile rinominare title property: %s. Uso '%s'.", e, title_prop_name
            )

    missing = {k: v for k, v in REQUIRED_PROPERTIES.items() if k not in existing}
    if missing:
        logger.info(
            "Aggiungo %d proprietà mancanti al database: %s",
            len(missing),
            list(missing.keys()),
        )
        client.databases.update(database_id=database_id, properties=missing)
        logger.info("Schema database aggiornato.")
    else:
        logger.info("Schema database già completo.")

    return title_prop_name


def get_recent_ideas(database_id: str, days: int = 90) -> list[str]:
    """
    Returns titles + categories of ideas published in the last `days` days.
    Used to avoid topic repetition in the Claude prompt.
    """
    client = _get_client()
    cutoff = (datetime.now(timezone.utc) - timedelta(days=days)).strftime("%Y-%m-%d")

    results = []
    cursor = None

    while True:
        kwargs = {
            "database_id": database_id,
            "filter": {
                "property": "Data Generazione",
                "date": {"on_or_after": cutoff},
            },
            "page_size": 100,
        }
        if cursor:
            kwargs["start_cursor"] = cursor

        response = client.databases.query(**kwargs)

        for page in response.get("results", []):
            props = page.get("properties", {})
            title = _get_title(props)
            categoria = _get_select(props, "Categoria")
            provincia = _get_select(props, "Provincia")
            if title:
                results.append(f"{title} — {categoria} — {provincia}")

        if not response.get("has_more"):
            break
        cursor = response.get("next_cursor")

    logger.info("Idee precedenti trovate (ultimi %d giorni): %d", days, len(results))
    return results


def publish_idee(database_id: str, idee: list[dict], title_prop: str = "Titolo") -> int:
    """
    Creates one Notion page per idea articolo.
    Returns the number of pages successfully created.
    """
    client = _get_client()
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    created = 0

    for i, idea in enumerate(idee):
        try:
            client.pages.create(
                parent={"database_id": database_id},
                properties=_build_page_properties(idea, today, title_prop),
            )
            logger.info(
                "Idea %d/%d creata: [%s | %s] %s",
                i + 1,
                len(idee),
                idea.get("categoria", "?"),
                idea.get("provincia", "?"),
                idea.get("titolo", ""),
            )
            created += 1
        except Exception as e:
            logger.error(
                "Errore creazione idea %d (%s): %s", i + 1, idea.get("titolo", ""), e
            )

    return created


# ── helpers ───────────────────────────────────────────────────────────────────

def _build_page_properties(idea: dict, today: str, title_prop: str = "Titolo") -> dict:
    fonte_url = idea.get("fonte_url") or None
    # Notion rejects empty strings for URL properties
    if fonte_url == "":
        fonte_url = None

    return {
        title_prop: {
            "title": [{"text": {"content": idea.get("titolo", "")}}]
        },
        "Sottotitolo": {
            "rich_text": [{"text": {"content": idea.get("sottotitolo", "")}}]
        },
        "Categoria": {
            "select": {"name": idea.get("categoria", "altri-servizi")}
        },
        "Provincia": {
            "select": {"name": idea.get("provincia", "Bari")}
        },
        "Idea Contenuto": {
            "rich_text": [{"text": {"content": idea.get("idea_contenuto", "")}}]
        },
        "Slug Suggerito": {
            "rich_text": [{"text": {"content": idea.get("slug", "")}}]
        },
        "Fonte": {
            "url": fonte_url
        },
        "Data Generazione": {
            "date": {"start": today}
        },
        "Status": {
            "select": {"name": "Da valutare"}
        },
    }


def _get_title(props: dict) -> str:
    for key in ("Titolo", "Name", "title"):
        prop = props.get(key, {})
        title_list = prop.get("title", [])
        if title_list:
            return title_list[0].get("plain_text", "")
    return ""


def _get_select(props: dict, key: str) -> str:
    prop = props.get(key, {})
    sel = prop.get("select") or {}
    return sel.get("name", "")
