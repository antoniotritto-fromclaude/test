"""
Blog Experiences — Main orchestrator.

Fetches recent Puglia travel/food/tourism news, checks Notion for existing ideas,
generates 10 hyper-specific blog article ideas via Claude, and publishes them to Notion.

Environment variables required:
  NOTION_API_KEY          — Notion integration token
  NOTION_BLOG_DATABASE_ID — ID of the content-ideas database for I Love Apulia
  CLAUDE_API_KEY          — Anthropic API key

Optional:
  GMAIL_APP_PASSWORD      — If set, sends a completion alert email
  GMAIL_SENDER            — From address (default: antoniotritto@gmail.com)
  GMAIL_RECIPIENT         — To address (default: same as GMAIL_SENDER)

Run manually:
    NOTION_API_KEY=... CLAUDE_API_KEY=... NOTION_BLOG_DATABASE_ID=... \\
        python blog_experiences/main.py

Scheduled via GitHub Actions every Tuesday at 08:00 CET.
"""

import logging
import os
import sys

from news_fetcher import fetch_travel_news
from notion_helper import ensure_database_schema, get_recent_ideas, publish_idee
from claude_agent import generate_idee
from email_sender import send_alert

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("blog_experiences")


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
    logger.info("Blog Experiences — avvio")
    logger.info("=" * 60)

    # 1. Verifica variabili d'ambiente
    database_id = _require_env("NOTION_BLOG_DATABASE_ID")
    _require_env("NOTION_API_KEY")
    _require_env("CLAUDE_API_KEY")

    # 2. Fetch notizie travel degli ultimi 14 giorni
    logger.info("Recupero notizie travel/food/tourism su Puglia...")
    notizie = fetch_travel_news()
    if not notizie:
        logger.warning(
            "Nessuna notizia recuperata dai feed RSS. "
            "Claude genererà idee autonomamente senza notizie di spunto."
        )

    # 3. Verifica/aggiorna schema database Notion
    logger.info("Verifica schema database Notion (ID: %s)...", database_id)
    title_prop = ensure_database_schema(database_id)

    # 4. Recupera idee precedenti (ultimi 90 giorni) per evitare ripetizioni
    logger.info("Recupero idee pubblicate negli ultimi 90 giorni...")
    precedenti = get_recent_ideas(database_id, days=90)

    # 5. Genera 10 idee articolo con Claude
    logger.info(
        "Generazione idee con Claude (%d notizie, %d precedenti)...",
        len(notizie),
        len(precedenti),
    )
    idee = generate_idee(notizie, precedenti)

    # 6. Pubblica su Notion
    logger.info("Pubblicazione %d idee su Notion...", len(idee))
    created = publish_idee(database_id, idee, title_prop)

    # 7. Notifica email (solo se GMAIL_APP_PASSWORD è impostato)
    notion_url = f"https://www.notion.so/{database_id.replace('-', '')}"
    send_alert(created, notion_url=notion_url)

    # 8. Riepilogo
    logger.info("=" * 60)
    logger.info(
        "Blog Experiences completato: %d/%d idee pubblicate su Notion.",
        created,
        len(idee),
    )
    logger.info("=" * 60)

    _print_summary(idee)

    if created == 0:
        logger.error("Nessuna idea pubblicata — controlla i log sopra.")
        sys.exit(1)


def _print_summary(idee: list[dict]) -> None:
    print("\n🌿 BLOG EXPERIENCES — IDEE DI QUESTA SETTIMANA\n")
    for i, idea in enumerate(idee, 1):
        print(f"{i:2}. [{idea.get('categoria','?')} | {idea.get('provincia','?')}]")
        print(f"    {idea.get('titolo','')}")
        print(f"    {idea.get('sottotitolo','')}")
        print(f"    → /{idea.get('slug','')}\n")


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        logger.exception("Errore fatale: %s", e)
        sys.exit(1)
