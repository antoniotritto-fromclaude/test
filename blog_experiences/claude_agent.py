"""
Calls Claude API to generate 10 hyper-specific blog article ideas
for the "I Love Apulia" travel blog — targeting tourists and travelers
planning trips to Puglia, Italy.

Output ideas are structured to match the blog's Notion CMS schema:
  title, subtitle, category (dove-mangiare | dove-dormire | altri-servizi),
  province, content_idea, slug_suggestion, source_url.
"""

import json
import logging
import os
from datetime import datetime

import anthropic

logger = logging.getLogger(__name__)

MODEL = "claude-sonnet-4-6"
MAX_TOKENS = 6144
TOP_ARTICLES = 10

SYSTEM_PROMPT = """Sei l'editor del blog di viaggio "I Love Apulia" — una guida esperienziale
sulla Puglia per turisti italiani e stranieri che vogliono scoprire la regione in profondità.

Il blog copre tre categorie principali:
- "dove-mangiare": ristoranti, osterie, trattorie, street food, esperienze gastronomiche
- "dove-dormire": masserie, B&B, boutique hotel, agriturismi, dimore storiche
- "altri-servizi": esperienze, attività, tour, musei, spiagge, borghi, artigianato

Le province di Puglia coperte: Bari, Brindisi, Foggia, Lecce, Taranto, BAT (Barletta-Andria-Trani).

REGOLE FONDAMENTALI:
1. Ogni idea articolo deve essere IPERSPECIFICA: cita un luogo reale, un'esperienza concreta,
   una stagione, un prodotto tipico, un evento — non articoli generici come "i migliori ristoranti".
2. Il titolo deve catturare subito l'essenza: usa nomi di luoghi, prodotti, esperienze concrete.
3. Il sottotitolo espande con 1-2 dettagli aggiuntivi che arricchiscono la promessa del titolo.
4. Il contesto dell'idea spiega in 3-4 righe l'angolo narrativo: cosa rende questo posto/esperienza
   unico, quale emozione vuole evocare nell'articolo, quale "storia" si può raccontare.
5. Varia le province: non concentrare tutto su Bari o Lecce. Distribuisci tra tutta la Puglia.
6. Varia le categorie: mix di dove mangiare, dormire e altri servizi.
7. Lo slug suggerito deve essere URL-friendly (lowercase, trattini, no accenti, no spazi).

OUTPUT: Rispondi UNICAMENTE con un JSON array valido. Zero testo aggiuntivo prima o dopo il JSON."""


def _build_user_prompt(notizie: list[dict], precedenti: list[str]) -> str:
    today = datetime.now().strftime("%d/%m/%Y")

    if notizie:
        news_block = "\n".join(
            f"[{i+1}] {n['titolo']}\n"
            f"    Fonte: {n['fonte']} | Data: {n['data']}\n"
            f"    Sommario: {n['sommario']}\n"
            f"    URL: {n['url']}"
            for i, n in enumerate(notizie)
        )
    else:
        news_block = "(Nessuna notizia recuperata questa settimana — genera idee autonomamente.)"

    if precedenti:
        prev_block = "\n".join(f"- {p}" for p in precedenti[:40])
    else:
        prev_block = "(nessuno — è la prima esecuzione)"

    return f"""NOTIZIE E SPUNTI DI VIAGGIO RECENTI (recuperati il {today}):
{news_block}

ARTICOLI GIÀ PUBBLICATI O PIANIFICATI (NON ripetere argomenti simili):
{prev_block}

---

Genera esattamente 10 idee articolo per il blog "I Love Apulia" come JSON array.
Ogni elemento deve avere questa struttura:
{{
  "titolo": "Titolo specifico e accattivante con nome del luogo o esperienza concreta",
  "sottotitolo": "Una riga che espande il titolo con un dettaglio unico o promessa narrativa",
  "categoria": "dove-mangiare|dove-dormire|altri-servizi",
  "provincia": "Bari|Brindisi|Foggia|Lecce|Taranto|BAT",
  "idea_contenuto": "3-4 righe che descrivono l'angolo narrativo, cosa lo rende speciale, che storia raccontare",
  "slug": "slug-url-friendly-senza-accenti",
  "fonte_url": "URL dalla lista notizie sopra (se applicabile, altrimenti stringa vuota)"
}}

Ricorda: varia province e categorie. Zero articoli generici. Rispondi SOLO con il JSON array."""


def _score_and_select(client, notizie: list[dict]) -> list[dict]:
    """
    Asks Claude to score each article 0-100 for relevance to Puglia travel/food/tourism,
    then returns the top TOP_ARTICLES sorted by score.
    Falls back to original order if scoring fails.
    """
    if not notizie:
        return []

    news_block = "\n".join(
        f"[{i}] {n['titolo']} ({n['fonte']}, {n['data']})"
        for i, n in enumerate(notizie)
    )

    prompt = f"""Assegna un punteggio da 0 a 100 a ogni articolo in base alla RILEVANZA per
un blog di viaggio sulla Puglia (ristoranti, hotel, esperienze, borghi, spiagge, cultura).

Criteri:
- 80-100: Riguarda direttamente Puglia — ristoranti, masserie, eventi, luoghi, esperienze
- 60-79: Turismo o gastronomia italiana con angolo applicabile alla Puglia
- 40-59: Tendenze travel/food con connessione indiretta alla Puglia
- 0-39: Non rilevante (politica, finanza, notizie generali senza connessione travel)

ARTICOLI:
{news_block}

Rispondi SOLO con un JSON array: [{{"id": 0, "score": 85}}, {{"id": 1, "score": 42}}, ...]"""

    try:
        response = client.messages.create(
            model=MODEL,
            max_tokens=1024,
            messages=[{"role": "user", "content": prompt}],
        )
        scores = _parse_json(response.content[0].text.strip())
        if scores and isinstance(scores, list):
            score_map = {item["id"]: item["score"] for item in scores if "id" in item and "score" in item}
            for i, article in enumerate(notizie):
                article["score"] = score_map.get(i, 0)
            ranked = sorted(notizie, key=lambda x: x.get("score", 0), reverse=True)
            top = ranked[:TOP_ARTICLES]
            logger.info(
                "Scoring completato. Top %d articoli (score min %d, max %d): %s",
                len(top),
                min(a.get("score", 0) for a in top) if top else 0,
                max(a.get("score", 0) for a in top) if top else 0,
                ", ".join(f"{a['fonte']}({a.get('score',0)})" for a in top),
            )
            return top
    except Exception as e:
        logger.warning("Scoring fallito (%s) — uso ordine originale.", e)

    return notizie[:TOP_ARTICLES]


def generate_idee(notizie: list[dict], precedenti: list[str]) -> list[dict]:
    """
    Scores all articles for travel relevance, selects the top TOP_ARTICLES,
    then calls Claude to generate 10 blog post ideas.
    Retries once if the response is not valid JSON.
    """
    api_key = os.environ["CLAUDE_API_KEY"]
    client = anthropic.Anthropic(api_key=api_key)

    top_notizie = _score_and_select(client, notizie)
    user_prompt = _build_user_prompt(top_notizie, precedenti)

    response = client.messages.create(
        model=MODEL,
        max_tokens=MAX_TOKENS,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_prompt}],
    )

    raw_text = response.content[0].text.strip()
    logger.debug("Risposta Claude (raw, primi 500 char): %s", raw_text[:500])

    idee = _parse_json(raw_text)
    if idee is None:
        logger.warning("JSON non valido al primo tentativo. Ritento con prompt correttivo.")
        idee = _retry_with_correction(client, user_prompt, raw_text)

    if not idee:
        raise ValueError("Claude non ha restituito JSON valido dopo il retry.")

    logger.info("Idee articolo generate da Claude: %d", len(idee))
    return idee


def _parse_json(text: str) -> list[dict] | None:
    text = text.strip()
    if text.startswith("```"):
        lines = text.split("\n")
        text = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:])

    try:
        data = json.loads(text)
        if isinstance(data, list):
            return data
    except json.JSONDecodeError:
        pass

    import re
    match = re.search(r"\[.*\]", text, re.DOTALL)
    if match:
        try:
            data = json.loads(match.group())
            if isinstance(data, list):
                return data
        except json.JSONDecodeError:
            pass

    return None


def _retry_with_correction(client, original_prompt: str, bad_response: str) -> list[dict] | None:
    correction = client.messages.create(
        model=MODEL,
        max_tokens=MAX_TOKENS,
        system=SYSTEM_PROMPT,
        messages=[
            {"role": "user", "content": original_prompt},
            {"role": "assistant", "content": bad_response},
            {
                "role": "user",
                "content": (
                    "La tua risposta non è JSON valido. "
                    "Restituisci UNICAMENTE il JSON array, senza testo aggiuntivo, "
                    "senza markdown, senza spiegazioni."
                ),
            },
        ],
    )
    return _parse_json(correction.content[0].text.strip())
