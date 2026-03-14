"""
Calls Claude API to generate 10 hyper-specific content ideas
targeted at Southern Italian professionals and entrepreneurs.
"""

import json
import logging
import os
from datetime import datetime

import anthropic

logger = logging.getLogger(__name__)

MODEL = "claude-sonnet-4-6"
MAX_TOKENS = 6144
MAX_NEWS_INPUT = 15  # articoli inviati a Claude (prende i più recenti)

SYSTEM_PROMPT = """Sei un editor di contenuti finanziari specializzato nel mercato del Sud Italia.
Il tuo compito è trasformare notizie economiche reali in spunti articolo iperspecifici per
professionisti e imprenditori del Sud Italia (Puglia e dintorni): dentisti, avvocati,
commercialisti, medici, titolari di PMI, ristoratori, artigiani.

REGOLE FONDAMENTALI:
1. Ogni spunto deve citare un professionista concreto con contesto reale e numeri specifici
   (es: "Un dentista di Bari con studio da 3 poltrone, 2 dipendenti e 280k di fatturato annuo").
2. Spiega l'impatto PRATICO e IMMEDIATO della notizia sulla sua vita economica quotidiana:
   cosa cambia in euro, in comportamenti, in decisioni da prendere subito.
3. Ogni spunto si collega a un articolo specifico dalla lista fornita — nessuna notizia inventata.
4. I titoli devono essere SPECIFICI: mai frasi come "cosa significa per i mercati",
   "impatto sul settore", "il professionista e la nuova legge". Usa nomi, cifre, situazioni reali.
5. L'apertura narrativa deve agganciare in prima riga con una domanda, un dato sorprendente
   o una scena concreta — come un articolo di qualità.
6. Varia i profili: non tutti dentisti, non tutti Bari. Distribuisci tra le categorie disponibili
   e tra diverse città del Sud Italia.

OUTPUT: Rispondi UNICAMENTE con un JSON array valido. Zero testo aggiuntivo prima o dopo il JSON."""


def _build_user_prompt(notizie: list[dict], precedenti: list[str]) -> str:
    today = datetime.now().strftime("%d/%m/%Y")

    news_block = "\n".join(
        f"[{i+1}] {n['titolo']}\n"
        f"    Fonte: {n['fonte']} | Data: {n['data']}\n"
        f"    Sommario: {n['sommario']}\n"
        f"    URL: {n['url']}"
        for i, n in enumerate(notizie)
    )

    if precedenti:
        prev_block = "\n".join(f"- {p}" for p in precedenti[:40])
    else:
        prev_block = "(nessuno — è la prima esecuzione)"

    return f"""NOTIZIE DELLA SETTIMANA (recuperate il {today}):
{news_block}

ARGOMENTI GIÀ TRATTATI NEGLI ULTIMI 60 GIORNI (NON ripetere temi simili):
{prev_block}

---

Genera esattamente 10 spunti come JSON array. Ogni elemento deve avere questa struttura:
{{
  "titolo": "Titolo specifico con professionista, città e cifre concrete",
  "pubblico": "Dentista|Avvocato|PMI|Imprenditore|Professionista generico",
  "categoria": "Fiscale|Mercati|Previdenza|Immobiliare|Credito|Normativa|Economia",
  "contesto": "Tre righe che spiegano la notizia e il suo impatto pratico e immediato su questo professionista specifico",
  "apertura_narrativa": "Una frase hook che apre l'articolo con domanda, dato sorprendente o scena concreta",
  "articolo_url": "URL esatto dalla lista notizie sopra (deve corrispondere a un articolo esistente)",
  "fonte": "Sole24Ore|ANSA|Reuters|MEF|BancaItalia"
}}

Ricorda: varia i profili e le città. Rispondi SOLO con il JSON array."""


def generate_spunti(notizie: list[dict], precedenti: list[str]) -> list[dict]:
    """
    Calls Claude API and returns a list of 10 spunto dicts.
    Retries once with a correction prompt if the response is not valid JSON.
    """
    api_key = os.environ["CLAUDE_API_KEY"]
    client = anthropic.Anthropic(api_key=api_key)

    user_prompt = _build_user_prompt(notizie[:MAX_NEWS_INPUT], precedenti)

    response = client.messages.create(
        model=MODEL,
        max_tokens=MAX_TOKENS,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_prompt}],
    )

    raw_text = response.content[0].text.strip()
    logger.debug("Risposta Claude (raw, primi 500 char): %s", raw_text[:500])

    spunti = _parse_json(raw_text)
    if spunti is None:
        logger.warning("JSON non valido al primo tentativo. Ritento con prompt correttivo.")
        spunti = _retry_with_correction(client, user_prompt, raw_text)

    if not spunti:
        raise ValueError("Claude non ha restituito JSON valido dopo il retry.")

    logger.info("Spunti generati da Claude: %d", len(spunti))
    return spunti


def _parse_json(text: str) -> list[dict] | None:
    """Attempts to extract and parse a JSON array from the text."""
    # Strip markdown code fences if present
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

    # Try to find the array inside the text
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
    """Single retry: show Claude its broken output and ask for valid JSON only."""
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
