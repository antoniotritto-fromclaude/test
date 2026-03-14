"""
Sends the Saturday Brief summary as an HTML email via Gmail SMTP.

Requires environment variables:
    GMAIL_APP_PASSWORD  — Gmail app-specific password (not the account password).
                          Create one at: Google Account → Security → App passwords.
    GMAIL_RECIPIENT     — Destination address (defaults to GMAIL_SENDER if omitted).
    GMAIL_SENDER        — Sender address (defaults to antoniotritto@gmail.com).
"""

import logging
import os
import smtplib
from datetime import datetime, timezone
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

logger = logging.getLogger(__name__)

_SENDER_DEFAULT = "antoniotritto@gmail.com"


def send_brief(spunti: list[dict], notion_db_url: str = "") -> None:
    """
    Sends an HTML email with the generated spunti.
    Skips silently if GMAIL_APP_PASSWORD is not set.
    """
    app_password = os.environ.get("GMAIL_APP_PASSWORD", "")
    if not app_password:
        logger.warning("GMAIL_APP_PASSWORD non impostato — invio email saltato.")
        return

    sender = os.environ.get("GMAIL_SENDER", _SENDER_DEFAULT)
    recipient = os.environ.get("GMAIL_RECIPIENT", sender)

    today = datetime.now(timezone.utc).strftime("%-d %B %Y")
    subject = f"📰 Saturday Brief — Spunti settimana del {today}"

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = sender
    msg["To"] = recipient

    msg.attach(MIMEText(_build_plain(spunti), "plain", "utf-8"))
    msg.attach(MIMEText(_build_html(spunti, today, notion_db_url), "html", "utf-8"))

    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as smtp:
            smtp.login(sender, app_password)
            smtp.sendmail(sender, [recipient], msg.as_string())
        logger.info("Email inviata a %s (%d spunti).", recipient, len(spunti))
    except Exception as e:
        logger.error("Errore invio email: %s", e)
        raise


# ── helpers ───────────────────────────────────────────────────────────────────

def _build_plain(spunti: list[dict]) -> str:
    lines = ["SATURDAY BRIEF — SPUNTI DI QUESTA SETTIMANA", ""]
    for i, s in enumerate(spunti, 1):
        lines.append(f"{i}. [{s.get('pubblico','?')} | {s.get('categoria','?')}]")
        lines.append(f"   {s.get('titolo','')}")
        url = s.get("articolo_url", "")
        if url:
            lines.append(f"   {url}")
        lines.append("")
    return "\n".join(lines)


def _build_html(spunti: list[dict], today: str, notion_url: str) -> str:
    cards = ""
    for s in spunti:
        url = s.get("articolo_url") or ""
        fonte = s.get("fonte", "")
        link_html = (
            f'<div class="link"><a href="{url}">{fonte} →</a></div>' if url else ""
        )
        cards += f"""
        <div class="spunto">
          <span class="badge pubblico">{s.get('pubblico','')}</span>
          <span class="badge categoria">{s.get('categoria','')}</span>
          <div class="titolo">{s.get('titolo','')}</div>
          {link_html}
        </div>"""

    notion_link = (
        f'· <a href="{notion_url}" style="color:#4f46e5">Apri in Notion</a>'
        if notion_url
        else ""
    )

    return f"""<!DOCTYPE html>
<html lang="it">
<head><meta charset="UTF-8"><style>
  body{{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f5f5f5;margin:0;padding:20px;color:#1a1a1a}}
  .container{{max-width:640px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08)}}
  .header{{background:#1a1a2e;color:#fff;padding:28px 32px}}
  .header h1{{margin:0 0 4px;font-size:22px;letter-spacing:-.3px}}
  .header p{{margin:0;font-size:13px;color:#a0a8c0}}
  .body{{padding:24px 32px}}
  .spunto{{border-left:3px solid #e8e8e8;padding:12px 16px;margin-bottom:16px;border-radius:0 8px 8px 0;background:#fafafa}}
  .badge{{display:inline-block;font-size:11px;font-weight:600;padding:2px 8px;border-radius:20px;margin-right:4px;background:#f0f0f0;color:#555}}
  .badge.pubblico{{background:#ede9fe;color:#5b21b6}}
  .badge.categoria{{background:#dbeafe;color:#1d4ed8}}
  .titolo{{font-size:14px;font-weight:600;margin:8px 0 4px;line-height:1.4}}
  .link{{font-size:12px;color:#6b7280}}
  .link a{{color:#4f46e5;text-decoration:none}}
  .footer{{background:#f9f9f9;border-top:1px solid #eee;padding:16px 32px;font-size:12px;color:#999}}
</style></head>
<body>
<div class="container">
  <div class="header">
    <h1>📰 Saturday Brief</h1>
    <p>Settimana del {today} · {len(spunti)} spunti generati da Claude</p>
  </div>
  <div class="body">{cards}</div>
  <div class="footer">Generato automaticamente da Saturday Brief {notion_link}</div>
</div>
</body></html>"""
