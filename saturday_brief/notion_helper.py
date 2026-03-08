"""
Notion API wrapper for Saturday Brief.
Reads existing spunti (last 60 days) and publishes new ones.
"""

import logging
import os
from datetime import datetime, timezone, timedelta

from notion_client import Client
from notion_client.errors import APIResponseError

logger = logging.getLogger(__name__)

# Properties we expect in the target database.
# If missing, we add them automatically.
REQUIRED_PROPERTIES = {
    "Pubblico": {
        "select": {
            "options": [
                {"name": "Dentista"},
                {"name": "Avvocato"},
                {"name": "PMI"},
                {"name": "Imprenditore"},
                {"name": "Professionista generico"},
            ]
        }
    },
    "Categoria": {
        "select": {
            "options": [
                {"name": "Fiscale"},
                {"name": "Mercati"},
                {"name": "Previdenza"},
                {"name": "Immobiliare"},
                {"name": "Credito"},
                {"name": "Normativa"},
                {"name": "Economia"},
            ]
        }
    },
    "Contesto": {"rich_text": {}},
    "Apertura Narrativa": {"rich_text": {}},
    "Articolo di Riferimento": {"url": {}},
    "Fonte": {
        "select": {
            "options": [
                {"name": "Sole24Ore"},
                {"name": "ANSA"},
                {"name": "Reuters"},
                {"name": "MEF"},
                {"name": "BancaItalia"},
            ]
        }
    },
    "Data Settimana": {"date": {}},
    "Status": {
        "select": {
            "options": [
                {"name": "Da usare"},
                {"name": "Usato"},
                {"name": "Scartato"},
            ]
        }
    },
}


def _get_client() -> Client:
    api_key = os.environ["NOTION_API_KEY"]
    return Client(auth=api_key)


def ensure_database_schema(database_id: str) -> None:
    """
    Verifies the database exists and adds any missing properties.
    """
    client = _get_client()
    try:
        db = client.databases.retrieve(database_id=database_id)
    except APIResponseError as e:
        raise RuntimeError(
            f"Database Notion non trovato (ID: {database_id}). "
            f"Verifica il secret NOTION_DATABASE_ID e che l'integration abbia accesso. Errore: {e}"
        )

    existing = db.get("properties", {})
    missing = {k: v for k, v in REQUIRED_PROPERTIES.items() if k not in existing}

    if missing:
        logger.info("Aggiungo %d proprietà mancanti al database: %s", len(missing), list(missing.keys()))
        client.databases.update(
            database_id=database_id,
            properties=missing,
        )
        logger.info("Schema database aggiornato.")
    else:
        logger.info("Schema database già completo.")


def get_recent_topics(database_id: str, days: int = 60) -> list[str]:
    """
    Returns a list of strings describing spunti published in the last `days` days.
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
                "property": "Data Settimana",
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
            pubblico = _get_select(props, "Pubblico")
            categoria = _get_select(props, "Categoria")
            if title:
                results.append(f"{title} — {pubblico} — {categoria}")

        if not response.get("has_more"):
            break
        cursor = response.get("next_cursor")

    logger.info("Spunti precedenti trovati (ultimi %d giorni): %d", days, len(results))
    return results


def publish_spunti(database_id: str, spunti: list[dict]) -> int:
    """
    Creates one Notion page per spunto.
    Returns the number of pages successfully created.
    """
    client = _get_client()
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    created = 0

    for i, spunto in enumerate(spunti):
        try:
            client.pages.create(
                parent={"database_id": database_id},
                properties=_build_page_properties(spunto, today),
            )
            logger.info("Spunto %d/%d creato: %s", i + 1, len(spunti), spunto.get("titolo", ""))
            created += 1
        except Exception as e:
            logger.error("Errore creazione spunto %d (%s): %s", i + 1, spunto.get("titolo", ""), e)

    return created


# ── helpers ───────────────────────────────────────────────────────────────────

def _build_page_properties(spunto: dict, today: str) -> dict:
    return {
        "Titolo": {
            "title": [{"text": {"content": spunto.get("titolo", "")}}]
        },
        "Pubblico": {
            "select": {"name": spunto.get("pubblico", "Professionista generico")}
        },
        "Categoria": {
            "select": {"name": spunto.get("categoria", "Economia")}
        },
        "Contesto": {
            "rich_text": [{"text": {"content": spunto.get("contesto", "")}}]
        },
        "Apertura Narrativa": {
            "rich_text": [{"text": {"content": spunto.get("apertura_narrativa", "")}}]
        },
        "Articolo di Riferimento": {
            "url": spunto.get("articolo_url") or None
        },
        "Fonte": {
            "select": {"name": spunto.get("fonte", "Sole24Ore")}
        },
        "Data Settimana": {
            "date": {"start": today}
        },
        "Status": {
            "select": {"name": "Da usare"}
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
