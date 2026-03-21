"""
Notion API wrapper for Blog Experiences.
Reads existing blog ideas (last 90 days) and publishes new ones
directly into the I Love Apulia blog CMS database.

Existing schema (already in the database — do NOT modify):
  Titolo (title), Sottotitolo (text), Slug (text),
  Categoria (text), Provincia (text), Cover (text), Immagini (text)

Added automatically if missing:
  Idea Contenuto (rich_text), Fonte (url), Data Generazione (date), Status (select)
"""

import logging
import os
from datetime import datetime, timezone, timedelta

from notion_client import Client
from notion_client.errors import APIResponseError

logger = logging.getLogger(__name__)

# Only properties NOT already present in the blog CMS database.
# Existing properties (Titolo, Sottotitolo, Slug, Categoria, Provincia, Cover, Immagini)
# are left untouched.
EXTRA_PROPERTIES = {
    "Idea Contenuto": {"rich_text": {}},
    "Fonte": {"url": {}},
    "Data Generazione": {"date": {}},
    "Status Idea": {
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
    Verifies the database exists, adds the extra editorial-tracking properties
    if missing, and returns the name of the title property.
    Does NOT rename or modify existing properties.
    """
    client = _get_client()
    try:
        db = client.databases.retrieve(database_id=database_id)
    except APIResponseError as e:
        raise RuntimeError(
            f"Database Notion non trovato (ID: {database_id}). "
            f"Verifica il secret NOTION_BLOG_DATABASE_ID. Errore: {e}"
        )

    existing = db.get("properties", {})

    # Find the title property name
    title_prop_name = "Titolo"
    for name, prop in existing.items():
        if prop.get("type") == "title":
            title_prop_name = name
            break

    missing = {k: v for k, v in EXTRA_PROPERTIES.items() if k not in existing}
    if missing:
        logger.info(
            "Aggiungo %d proprietà editoriali al database: %s",
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
    Returns titles + categories of ideas added in the last `days` days.
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

        try:
            response = client.databases.query(**kwargs)
        except APIResponseError:
            # Property may not exist yet on first run — skip dedup
            logger.warning("Impossibile leggere idee precedenti (property assente?). Procedo senza dedup.")
            return []

        for page in response.get("results", []):
            props = page.get("properties", {})
            title = _get_title(props)
            categoria = _get_text_prop(props, "Categoria")
            provincia = _get_text_prop(props, "Provincia")
            if title:
                results.append(f"{title} — {categoria} — {provincia}")

        if not response.get("has_more"):
            break
        cursor = response.get("next_cursor")

    logger.info("Idee precedenti trovate (ultimi %d giorni): %d", days, len(results))
    return results


def publish_idee(database_id: str, idee: list[dict], title_prop: str = "Titolo") -> int:
    """
    Creates one Notion page per idea articolo in the blog CMS database.
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
                children=_build_page_body(idea),
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
    if fonte_url == "":
        fonte_url = None

    return {
        title_prop: {
            "title": [{"text": {"content": idea.get("titolo", "")}}]
        },
        "Sottotitolo": {
            "rich_text": [{"text": {"content": idea.get("sottotitolo", "")}}]
        },
        "Slug": {
            "rich_text": [{"text": {"content": idea.get("slug", "")}}]
        },
        "Categoria": {
            "rich_text": [{"text": {"content": idea.get("categoria", "")}}]
        },
        "Provincia": {
            "rich_text": [{"text": {"content": idea.get("provincia", "")}}]
        },
        "Idea Contenuto": {
            "rich_text": [{"text": {"content": idea.get("idea_contenuto", "")}}]
        },
        "Fonte": {
            "url": fonte_url
        },
        "Data Generazione": {
            "date": {"start": today}
        },
        "Status Idea": {
            "select": {"name": "Da valutare"}
        },
    }


def _build_page_body(idea: dict) -> list[dict]:
    """Creates Notion blocks for the page body with the full idea breakdown."""
    blocks = []

    idea_contenuto = idea.get("idea_contenuto", "")
    if idea_contenuto:
        blocks.append({
            "object": "block",
            "type": "heading_2",
            "heading_2": {
                "rich_text": [{"type": "text", "text": {"content": "💡 Idea Contenuto"}}]
            },
        })
        blocks.append({
            "object": "block",
            "type": "paragraph",
            "paragraph": {
                "rich_text": [{"type": "text", "text": {"content": idea_contenuto}}]
            },
        })

    fonte_url = idea.get("fonte_url", "")
    if fonte_url:
        blocks.append({
            "object": "block",
            "type": "heading_2",
            "heading_2": {
                "rich_text": [{"type": "text", "text": {"content": "🔗 Fonte"}}]
            },
        })
        blocks.append({
            "object": "block",
            "type": "bookmark",
            "bookmark": {"url": fonte_url},
        })

    return blocks


def _get_title(props: dict) -> str:
    for key in ("Titolo", "Name", "title"):
        prop = props.get(key, {})
        title_list = prop.get("title", [])
        if title_list:
            return title_list[0].get("plain_text", "")
    return ""


def _get_text_prop(props: dict, key: str) -> str:
    prop = props.get(key, {})
    # Works for both rich_text and text property types
    items = prop.get("rich_text", [])
    if items:
        return items[0].get("plain_text", "")
    return ""
