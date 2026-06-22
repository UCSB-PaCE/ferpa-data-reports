# From FERPA Data to Reports: A Transferable Pipeline

This is the knowledge source for the "Ferpa Data Reports Website Assistant" bot. It mirrors the documentation site at https://sites.google.com/ucsb.edu/ferpa-data-reports. The site explains how to transfer a "FERPA-protected data to report" pipeline to any FERPA-protected dataset, not just course evaluations. It is built on UCSB's LLM Sandbox, an OpenAI-compatible, token-metered institutional LLM gateway.

## Overview

This guide grew out of a student-evaluation pipeline that turned raw survey exports into per-instructor PDF reports with AI insight. The shape of that pipeline is not specific to evaluations. It is a reusable recipe for taking any sensitive education record and producing a clean, trustworthy, AI-summarized report.

Headline facts:
- Re-running an already-analyzed record costs 0 tokens (served from a warm cache).
- A genuinely new AI analysis costs about 1.3K tokens.
- FERPA first: data stays inside your institution's vetted gateway.
- A human holds the release gate; the AI only assists.

Who this is for: registrars, advising offices, program managers, institutional research and assessment teams, instructional designers, and anyone with a pile of FERPA-protected records and a recurring need to turn them into readable reports. You do not need to be a developer to follow the no-code Google Colab path.

## The transferable pattern: one shape, many datasets

The evaluation pipeline is seven concrete steps, but underneath it is a six-stage pattern. Every stage is dataset-agnostic. Swap the inputs and the report template, keep the spine.

1. Ingest: adapt to whatever export you were handed (CSV, XLSX, a SIS dump).
2. Standardize: rename columns, validate types, coerce scales. The source file is never mutated.
3. Reconcile identity: fuzzy-match people to a roster of truth; resolve duplicates and aliases.
4. AI insight (cached): summarize free text into keywords plus a cited insight. Cache the result.
5. Render report: per-subject, per-group, and global PDFs with charts and the AI insight.
6. Distribute: upload, track, and share, with a human approving the release.

What "any FERPA data" means in practice. The pattern fits any record that has some structured fields, some free text humans wrote, and a natural "subject" to report on. Examples of the same machine re-pointed:
- Course evaluations (the origin): Qualtrics CSV; subject is the instructor or course; free text is open-ended student comments.
- Academic advising: advising-notes export; subject is the student, advisor, or program; free text is session notes and follow-ups.
- Field placements and internships: supervisor eval forms; subject is the student placement; free text is supervisor narrative feedback.
- Program assessment: rubric plus reflection exports; subject is the cohort or outcome; free text is reflective free response.
- Student support and case notes: case-management dump; subject is the case or caseworker; free text is interaction summaries.
- Scholarship and aid review: application plus reviewer notes; subject is the applicant or committee; free text is reviewer rationale.

The mental model: structured columns drive the charts. Free text drives the AI insight. Identity reconciliation ties them to a person or group. Caching makes it cheap. A report template makes it shareable. Everything else is dataset-specific glue.

## The continuous-improvement loop

This pipeline is drawn as two concentric loops. The outer loop is the six-stage pipeline doing the operational work each cycle. A faster inner loop (observe, diagnose, improve, verify) keeps making that work leaner, cheaper, and more reliable. AI is a tool used inside the loops, only where it earns its place. This is the part that makes the pipeline self-healing, and it transfers to any process you run on a recurring basis.

You do not need both loops to start. But once the outer loop runs on a schedule, the inner loop is what keeps it reliable as your data and formats change over time, and the cache is what keeps the inner loop free: re-running a fixed period re-reads cached insight instead of re-billing the model, so you can replay your fixes at zero token cost.

The four phases and how they transfer:
- Observe (read the run): each run logs row counts, unmatched names, missing codes, token usage, and which records were freshly analyzed versus served from cache. For your dataset, log the same. You cannot improve a run you cannot see.
- Diagnose (root cause): a mislabeled quarter, a fragile column name, a name that did not fuzzy-match, traced to one cause, not patched at the symptom. Ask why a record dropped out; usually it is a brittle assumption about the source format.
- Improve (modular change): one small, testable change in a single module, never a sprawling rewrite. Make the smallest change that fixes the cause and keep it modular.
- Verify (replay and cache): replay the affected period. Cached insight makes the replay cost 0 tokens; only genuinely new work is re-billed. Confirm the fix, then ship.

Why AI makes this loop cheaper than it used to be: the observe and diagnose phases used to be the expensive, human-only part. Now the system can help read its own runs. Code analysis and log summarization are exactly the kind of small, bounded jobs the same gateway is good at.

## FERPA-safe AI: route through a gateway you control

FERPA protects "education records." The moment you send a student's free-text comment to a third-party AI API on the public internet, you have made a disclosure, and most consumer AI endpoints reserve rights you cannot accept on behalf of an institution. The single most important architectural decision in this pipeline is therefore where the model call goes.

- Use an institutional gateway. An LLM gateway your institution operates (or contracts under terms it has vetted) keeps the request inside an approved boundary. At UCSB this is LLM Sandbox, an OpenAI-compatible endpoint in front of cloud foundation models, governed by the campus and token-metered rather than dollar-billed.
- Do not train on the data. Confirm with your provider that prompts and completions are not retained for model training and are not logged beyond what you have approved. A gateway makes that one contract to verify, instead of one per team.
- Minimize what you send. Send only the free text that needs summarizing. Names, IDs, grades, and other identifiers belong in your structured pipeline, not in the prompt. De-identify before the call where you can.
- Keep a human at the gate. AI drafts the insight; a person reviews and approves the report before it is shared. The model never has release authority. This is both a quality control and a compliance control.

Verify before you build. This guide shows the architecture for handling FERPA data responsibly; it is not legal advice and does not certify any specific tool as "FERPA-compliant." Before sending real records anywhere, confirm the data-governance terms of your chosen gateway with your institution's registrar, privacy or compliance office, and IT security.

The de-identification habit. Because the AI only ever needs the free text, you can keep identifiers out of the prompt entirely. The pipeline numbers each comment so the model can cite it ([1], [2]) without ever knowing who wrote it. The bracketed indices are reattached to the verbatim comments after the model responds, inside your own system, so the insight can say "students praised clarity [1][3]" while the model never saw an identity.

## LLM Sandbox API reference

UCSB's LLM Sandbox exposes an OpenAI-compatible Chat Completions API in front of cloud foundation models (Anthropic Claude on Amazon Bedrock, among others). "OpenAI-compatible" is the key fact: any OpenAI SDK or any tool that speaks the Chat Completions shape works against it. You only change the base URL and the auth header. This generalizes to any gateway built on the same convention (LiteLLM, Bedrock Access Gateway, vLLM's OpenAI server, Azure OpenAI, and similar).

Base URL and authentication:
- Base URL: `https://<your-llm-sandbox-host>/v1`. From your institution's gateway admin. Ends in `/v1` like the OpenAI API.
- Auth header: send your key as either `Authorization: Bearer <KEY>` (what OpenAI SDKs send automatically) or `x-api-key: <KEY>`. Either one authenticates.
- Model: `claude-v4.5-haiku` is one of many valid IDs. List the live catalog with `GET {BASE_URL}/models`.
- Content type: `application/json`.

Good news, the key works two ways: LLM Sandbox accepts your key as a standard `Authorization: Bearer <KEY>` (exactly what the OpenAI SDKs already send) or as an `x-api-key: <KEY>` header. Either one authenticates, so a normal OpenAI client works with just a base_url and api_key, no header surgery. The raw HTTP examples use x-api-key because it is explicit; the bearer is equally valid. Verified live against the gateway, June 2026.

Live model catalog (verified June 2026, via GET {BASE_URL}/models): Anthropic claude-v4.6-sonnet, claude-v4.6-opus, claude-v4.5-haiku, claude-v3.7-sonnet, claude-v3.5-haiku, claude-v3-opus; Amazon amazon-nova-pro, amazon-nova-lite, amazon-nova-micro; also llama-4-maverick-17b-instruct, llama-4-scout-17b-instruct, llama3-3-70b-instruct, mistral-large-2, mixtral-8x7b-instruct, deepseek-r1, qwen3-32b, and OpenAI-named aliases like gpt-4o. Always pull the current list from /models; the catalog grows over time.

Endpoint: Chat Completions. `POST {BASE_URL}/chat/completions`. Request body uses model, max_tokens, and a messages array of {role, content} objects (roles are system, user, assistant). Response uses the OpenAI shape: read `choices[0].message.content` and `usage`. The usage object is how you meter cost; on LLM Sandbox the budget is tokens, not dollars, so `total_tokens` is the number that matters. A typical analysis is about 1,060 in plus 254 out, about 1.3K tokens.

Common parameters:
- model (string, required): a model ID from the gateway's catalog.
- messages (array, required): {role, content} objects.
- max_tokens (integer): cap on the completion length. This pipeline uses 1024.
- temperature (number, optional): lower (0 to 0.4) for consistent, reproducible summaries.
- stream (boolean, optional): for batch report generation you almost always want false.

Picking a model: summarizing short free text into a few keywords and a paragraph is a small, cheap-model job. A Haiku-class model is the right default: fast, low token cost, and more than capable. Reserve larger models for genuinely harder reasoning.

Errors and retries (OpenAI-compatible HTTP status codes):
- 401 or 403: key missing, wrong, or revoked. Send a current key as Authorization: Bearer or x-api-key; do not retry.
- 404: unknown model or wrong path. Verify the model ID and that the base URL ends in /v1.
- 429: rate or quota limit. Back off and retry with exponential delay. Caching reduces how often you hit this.
- 5xx: gateway or upstream error. Retry a few times with backoff, then log and skip that record so one failure does not block the batch.

Production rule: a failed analysis returns an "Error in analysis: ..." string and is not cached, so the next run retries it cleanly.

## System-agnostic code

The same call works in any language that can make an HTTP POST. Base URL, key, and model always come from the environment or a secrets store; never hard-code them.

Python with the OpenAI SDK:

```python
import os
from openai import OpenAI

client = OpenAI(
    base_url=os.environ["LLM_SANDBOX_BASE_URL"],
    api_key=os.environ["LLM_SANDBOX_API_KEY"],   # the SDK sends it as Bearer; the gateway accepts it
)

def analyze(comments):
    numbered = "\n".join(f"[{i}] {c}" for i, c in enumerate(comments, 1))
    resp = client.chat.completions.create(
        model=os.environ.get("LLM_SANDBOX_MODEL", "claude-v4.5-haiku"),
        max_tokens=1024,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": numbered},
            {"role": "user", "content": TASK_PROMPT},
        ],
    )
    return resp.choices[0].message.content
```

Python with requests (no SDK), Node with fetch, and cURL all follow the same shape: POST to `{BASE_URL}/chat/completions` with the key in an `x-api-key` (or `Authorization: Bearer`) header and a JSON body of model, max_tokens, and messages.

The two prompts. The insight quality comes mostly from the prompt. The system prompt sets the role. The task prompt asks for a color-coded keyword summary plus a short, citation-grounded insight, which is what stops the model from inventing problems students never raised.

SYSTEM_PROMPT: "You are a helpful assistant specialized in analyzing feedback."

TASK_PROMPT asks for a concise keyword summary (each keyword one to two words, color-coded Green, Orange, or Red strictly by the actual tone, leaning positive), and a one to two paragraph insight no longer than the original comments that adds nothing not present. Comments are numbered [1], [2], and the insight must cite the comments that support each statement inline, citing only numbers that appear. No markdown.

Why the citation rule matters for FERPA and trust: requiring inline [n] citations grounds every claim in a real, numbered comment. It makes the insight auditable (a reviewer can click back to the source) and sharply reduces hallucination, because the model cannot cite a comment that does not exist.

## Caching for near zero cost

The single biggest cost lever is not analyzing the same thing twice. This pipeline persists every AI insight keyed by (scope, subject, period). Re-running an already-analyzed period reads from the cache and spends 0 tokens. You only pay for genuinely new records.

Flow: build a key like ("instructor", "Doe, Jane", "F25"); look it up; on a hit return the stored insight with no model call; on a miss call the gateway, get the insight plus token usage, and store it.

A single SQLite file is plenty. It is ACID, queryable, needs no server, and travels with your project.

```python
import sqlite3, datetime

db = sqlite3.connect("ai_cache.sqlite")
db.execute("""
  CREATE TABLE IF NOT EXISTS ai_cache(
    scope TEXT, subject TEXT, period TEXT,
    analysis TEXT, model TEXT,
    input_tokens INTEGER, output_tokens INTEGER, cost_usd REAL,
    created_at TEXT,
    PRIMARY KEY (scope, subject, period)
  )""")

def get_or_analyze(scope, subject, period, comments):
    row = db.execute(
        "SELECT analysis FROM ai_cache WHERE scope=? AND subject=? AND period=?",
        (scope, subject, period)).fetchone()
    if row:
        return row[0]               # cache hit: 0 tokens
    analysis = analyze(comments)    # cache miss: one gateway call
    db.execute("INSERT OR REPLACE INTO ai_cache VALUES (?,?,?,?,?,?,?,?,?)",
        (scope, subject, period, analysis, "claude-v4.5-haiku",
         0, 0, None, datetime.datetime.now().isoformat()))
    db.commit()
    return analysis
```

Design the key for warmth. Choose a key that is stable across runs so the cache stays warm. Keying on (subject, period) means fixing a typo in next quarter's data never re-bills last quarter's analyses. If you change the prompt and want fresh output, add a prompt_version to the key instead of wiping the cache, so old and new coexist.

Caching turns "analyze everything, every cycle" into "analyze only what is new." That one move is most of the lean.

## Token economics

On a token-metered gateway the budget is tokens. Ground-truth rates measured in production for short free-text summarization:
- Re-run an already-analyzed period: 0 tokens (served from the warm cache).
- One new analysis: about 1.3K tokens (about 1,060 in, 254 out).
- A live validation or smoke-test call: about 1.3K tokens.
- A fresh cycle of 50 to 150 new analyses: about 65K to 200K tokens.

Rule of thumb: steady-state cost is about (new subjects this cycle) times about 1.3K tokens. A full from-scratch rebuild of an entire multi-year history is a one-time event you only pay if the cache is wiped, never in normal operation. Dollar figures, if you compute them, are a list-price proxy only; an institution-provided gateway like LLM Sandbox meters tokens rather than billing you per call.

## The no-code path: Google Colab plus Secrets

You can run this entire pipeline in Google Colab, a free browser-based Python notebook, without installing anything. The one thing you must never do is paste your API key into a cell. Colab has a built-in Secrets manager for exactly this.

Colab basics: a Colab notebook is a stack of cells. You put code (or notes) in a cell and run it, and the output appears right below. To add cells use the "+ Code" and "+ Text" buttons; to run everything top to bottom press "Run all"; to run one cell click its run button or press Ctrl+Enter.

Step 1: store your key in Colab Secrets. Open a new notebook at colab.research.google.com. In the left sidebar click the key icon ("Secrets"). Click "Add new secret" and add three secrets, toggling "Notebook access" on for each: LLM_SANDBOX_BASE_URL (your gateway URL ending in /v1), LLM_SANDBOX_API_KEY (the key your admin gave you), and LLM_SANDBOX_MODEL (for example claude-v4.5-haiku).

Why Secrets and not a cell: secrets are stored against your Google account, not inside the notebook file. If you share or download the notebook, the key does not travel with it.

Step 2: read the secrets in code. Colab exposes secrets through google.colab.userdata. This is the only Colab-specific line in the whole pipeline:

```python
from google.colab import userdata
BASE_URL = userdata.get("LLM_SANDBOX_BASE_URL")
API_KEY  = userdata.get("LLM_SANDBOX_API_KEY")
MODEL    = userdata.get("LLM_SANDBOX_MODEL")
```

Step 3: bring in your data file (a spreadsheet is just a file). Open the Files panel via the folder icon in the left rail. Two ways to get data in: Upload a file into the session (quick, but it is temporary and disappears when the runtime resets), or Mount Drive to read from your Google Drive (persistent, tied to your account). A .csv or .xlsx is just a file: bring it in, then read it with pandas, for example `df = pd.read_excel("advising_notes.xlsx")` or `pd.read_csv(...)`. Mounted Drive files live under /content/drive/MyDrive/.

FERPA when you attach data: (1) uploaded files go to temporary session storage on Google infrastructure and vanish when the runtime recycles; mounting Drive is persistent but still Google-hosted. (2) For real FERPA records, confirm your institution permits Colab for that data class, prefer mounting from an approved Google Workspace (EDU) account, de-identify first, and remember that only the free text ever leaves your notebook for the gateway. For a dry run, use synthetic data first.

Gemini in Colab: Colab ships with Gemini, a built-in AI assistant that writes and explains code from a plain-English prompt. It is handy for the no-code path. Caution: the Gemini helper reads your notebook's code and contents to assist you, so treat it as a coding helper only. Never paste real student records or a secret value into a Gemini prompt, and do not ask it to print your secrets. Your governed model calls go to the LLM Sandbox gateway, not to Gemini.

## Worked example: advising notes to report

A non-evaluation example. An advising office has a messy CSV of session notes and wants a per-advisor summary report. Same six stages, different inputs. The companion notebook ferpa_pipeline_colab.ipynb is a ready-to-run version.

- Cell 1: install openai and pandas, read the three Colab secrets, build the OpenAI client with the x-api-key header.
- Cell 2: ingest and standardize. Upload the CSV, then rename the export's columns to clean names (subject, period, text). Never edit the source file; build a clean layer on top.
- Cell 3: reconcile identity. Fuzzy-match each subject to a roster of truth (using thefuzz) with a threshold of about 85. Unmatched rows are dropped and printed so you can fix the roster.
- Cell 4: AI insight, cached. Group by (subject, period). For each group, either read the cached insight (0 tokens) or call the gateway once and cache the result. Only free text, numbered [1], [2], leaves the notebook. Skip groups with fewer than five comments because the sentiment signal is too weak.
- Cell 5: render the report. One PDF per subject and period (using reportlab). A human reviews these before anyone else sees them; the AI never has release authority.

To point this at a different FERPA dataset, change only the column map in Cell 2 (subject, period, text) and the roster in Cell 3. The gateway call in Cell 4 never changes. Re-running is free for anything already cached.

## Three principles and a launch checklist

Three principles to carry:
1. Build on top, never mutate. Treat the source export as read-only. Every transformation produces a new clean layer. You can always re-derive; you can never un-corrupt a source you edited in place.
2. Cache hard-won output. Pay for new work only, never repeated work. A relational key keeps the cache warm across runs and makes re-running the whole thing free.
3. Let the system read its own runs. Code analysis and feedback are the cheapest improvement engine you have. One small, modular, testable change per cycle compounds.

Launch checklist before you send real FERPA data:
- Gateway approved by your registrar, privacy office, and IT security for this data class.
- Confirmed prompts and completions are not retained for training or extra logging.
- Only free text leaves your system; identifiers stay in the structured layer.
- API key in a secrets store (Colab Secrets, env var, or vault), never in a cell or commit.
- Insight requires inline citations; output is reviewable against verbatim source.
- A human approves every report before it is shared.
- Cache keyed for warmth; failed analyses are not cached so they retry next run.
- A dry run on synthetic data passed end to end.

You do not need a big budget to do this well. You need a gateway you trust, a cache, and a human at the gate.

## How this site and its assistant were made

The whole site, the writing, code samples, diagrams, the annotated Google Colab screenshots, and this assistant, was generated with the help of UCSB's LLM Sandbox, under human direction and review. A human set the goal and the guardrails, an AI drafted and revised the work in small passes, and a human proofread and approved every change before it shipped. Each section heading on the site carries a small "revised N times" badge: an honest count of how many times that section's wording was adjusted during the build (not how many times content was added).

The bot configuration: knowledge is this entire site exported as Markdown (the embed's iframe is not reliably crawlable, so a clean file beats a URL crawl); the model is Claude Haiku 4.5 on Bedrock (fast, low cost, the same class the pipeline uses); temperature 0.2 for consistency; a grounding check around 0.7 to block unsupported claims; citations on; delivered through a published REST API and an in-page chat widget that posts a message then polls for the reply.

## About this site and its assistant

The documentation was generated with the help of UCSB's LLM Sandbox, with an AI drafting, proofreading, and adjusting the content under human supervision and approval. This assistant is a Bedrock-backed chatbot grounded on this website's content via LLM Sandbox. It answers only from this material, points to the relevant section when something is not covered, and does not give legal advice or certify any tool as "FERPA-compliant." For compliance specifics, confirm with your institution.
