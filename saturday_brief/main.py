"""
Saturday Brief — Main orchestrator.

Fetches weekly Italian financial news, checks Notion for recent topics,
generates 10 hyper-specific content ideas via Claude, and publishes them to Notion.

Run manually:
    NOTION_API_KEY=... CLAUDE_API_KEY=... NOTION_DATABASE_ID=... python saturday_brief/main.py

Scheduled via GitHub Actions every Saturday at 07:00 CET.
"""

import logging
import os
import sys

from news_fetcher import fetch_weekly_news
from notion_helper import ensure_database_schema, get_recent_topics, publish_spunti
from claude_agent import generate_spunti
from email_sender import send_alert

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("saturday_brief")


def _require_env(key: str) -> str:
    value = os.environ.get(key)
    if not value:
        raise EnvironmentError(
            f"Variabile d'ambiente mancante: {key}\n"
            f"Configura il secret GitHub corrispondente in Settings → Secrets → Actions."
        )
    return value


def main() -> None:
    logger.info("=" * 60)
    logger.info("Saturday Brief — avvio")
    logger.info("=" * 60)

    # 1. Verifica variabili d'ambiente
    database_id = _require_env("NOTION_DATABASE_ID")
    _require_env("NOTION_API_KEY")   # usata dentro notion_helper
    _require_env("CLAUDE_API_KEY")   # usata dentro claude_agent

    # 2. Fetch notizie settimana
    logger.info("Recupero notizie finanziarie della settimana...")
    notizie = fetch_weekly_news()
    if not notizie:
        logger.warning("Nessuna notizia recuperata dai feed RSS. Controllare le sorgenti.")
        # Procedi comunque: Claude può lavorare con lista vuota (genererà spunti più generici)

    # 3. Verifica/aggiorna schema database Notion
    logger.info("Verifica schema database Notion (ID: %s)...", database_id)
    title_prop = ensure_database_schema(database_id)

    # 4. Recupera spunti precedenti (ultimi 60 giorni) per evitare ripetizioni
    logger.info("Recupero spunti pubblicati negli ultimi 60 giorni...")
    precedenti = get_recent_topics(database_id, days=60)

    # 5. Genera 10 spunti con Claude
    logger.info("Generazione spunti con Claude (%d notizie, %d precedenti)...", len(notizie), len(precedenti))
    spunti = generate_spunti(notizie, precedenti)

    # 6. Pubblica su Notion
    logger.info("Pubblicazione %d spunti su Notion...", len(spunti))
    created = publish_spunti(database_id, spunti, title_prop)

    # 7. Notifica email (solo se GMAIL_APP_PASSWORD è impostato)
    notion_url = f"https://www.notion.so/{database_id.replace('-', '')}"
    send_alert(created, notion_url=notion_url)

    # 8. Riepilogo
    logger.info("=" * 60)
    logger.info("Saturday Brief completato: %d/%d spunti pubblicati su Notion.", created, len(spunti))
    logger.info("=" * 60)

    _print_summary(spunti)

    if created == 0:
        logger.error("Nessuno spunto pubblicato — controlla i log sopra.")
        sys.exit(1)


def _print_summary(spunti: list[dict]) -> None:
    print("\n📰 SATURDAY BRIEF — SPUNTI DI QUESTA SETTIMANA\n")
    for i, s in enumerate(spunti, 1):
        print(f"{i:2}. [{s.get('pubblico','?')} | {s.get('categoria','?')}]")
        print(f"    {s.get('titolo','')}")
        print(f"    → {s.get('articolo_url','')}\n")


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        logger.exception("Errore fatale: %s", e)
        sys.exit(1)
