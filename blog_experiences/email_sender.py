"""
Sends a minimal one-line alert email when Blog Experiences completes.
Requires GMAIL_APP_PASSWORD env var; skips silently if not set.
"""
import logging
import os
import smtplib
from email.mime.text import MIMEText

logger = logging.getLogger(__name__)

_SENDER_DEFAULT = "antoniotritto@gmail.com"


def send_alert(idee_count: int, notion_url: str = "") -> None:
    """Sends a one-line completion alert. Skips if GMAIL_APP_PASSWORD is missing."""
    app_password = os.environ.get("GMAIL_APP_PASSWORD", "")
    if not app_password:
        logger.info("GMAIL_APP_PASSWORD non impostato — notifica email saltata.")
        return

    sender = os.environ.get("GMAIL_SENDER", _SENDER_DEFAULT)
    recipient = os.environ.get("GMAIL_RECIPIENT", sender)

    body = f"Blog Experiences completato: {idee_count} idee articolo caricate su Notion."
    if notion_url:
        body += f"\n{notion_url}"

    msg = MIMEText(body, "plain", "utf-8")
    msg["Subject"] = f"🌿 Blog Experiences — {idee_count} idee caricate"
    msg["From"] = sender
    msg["To"] = recipient

    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as smtp:
        smtp.login(sender, app_password)
        smtp.sendmail(sender, [recipient], msg.as_string())
    logger.info("Alert email inviata a %s.", recipient)
