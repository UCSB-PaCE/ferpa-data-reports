# CLAUDE.md

Guidance for Claude Code working in the **ferpa-data-reports** repository.

## What this is

A public documentation website that teaches how to transfer a "FERPA-protected data to
report" pipeline to **any** FERPA dataset (not just course evaluations), centered on
UCSB's **LLM Sandbox** API, with a no-code Google Colab path for non-technical users.

- **Live:** https://ucsb-pace.github.io/ferpa-data-reports/ (GitHub Pages, deploy from `main` / root)
- **Repo:** `UCSB-PaCE/ferpa-data-reports` (public)
- **Owner / maintainer:** **jengeln**. This is a jengeln project: commits, PRs, and issue
  assignees default to `jengeln`, and the git remote is authenticated as `jengeln`.
- **Origin:** spun out of `pace-evaluation/docs-site/` once it earned its own public repo.
  It is now a first-class sibling under the PaCERepo umbrella; that old folder is retired.

## How it is built and deployed

This is **plain static HTML**, no build step. The site is **seven pages sharing one
`styles.css` and one `app.js`**. `index.html` is the landing (origin-story hook + two
tracks). The split is by audience: a **no-code track** (`nocode.html`, `colab-intro.html`)
and a **developer track** (`dev.html` the build, `gateway.html` the generic API,
`sandbox.html` the UCSB specifics), plus `about.html`. Display face is **Fraunces** (serif);
labels are **JetBrains Mono**; body is **Nunito Sans**. Per-page data (the "revised N×"
badge counts/date and the chat's suggested questions) is set in a small inline `<script>`
that runs before `app.js`. There is **no test suite, no linter, and no
package manager** (no `package.json`, no CI workflow); "verify" means looking at the page
(and running axe-core for accessibility), not running a unit-test runner.
To publish: commit and `git push origin main`; GitHub Pages auto-deploys in ~30-60s.
Always verify live afterward (curl the pages / check assets 200).

```bash
# preview locally before pushing (relative asset paths + the chat widget need a server,
# not a file:// open):
python -m http.server 8000      # then open http://localhost:8000/

# typical change loop
#   1. edit a page (or styles.css / app.js)
#   2. git add -A && git commit && git push origin main
#   3. curl -s https://ucsb-pace.github.io/ferpa-data-reports/sandbox.html | grep <new text>
```

## File map

| Path | Purpose |
|------|---------|
| `index.html` | **Landing** (root URL): a calm hero with the origin-story hook, then two track cards (no-code / developer) + About and "New to Colab?" entrances. |
| `nocode.html` | **No-code track**: the explanatory Google Colab walkthrough (an AI helper writes each step; you approve). Written for smart, mildly-technical readers. |
| `colab-intro.html` | **"New to Google Colab?"** five-minute primer (cells, run, Secrets, Files). |
| `dev.html` | **Developer guide**: the six pipeline stages with code, each tagged by role (`script` / `AI` / `human` via the `.role` badge), caching, token economics, the continuous-improvement loop, principles + checklist. |
| `gateway.html` | **Generic gateway** (developer track): "use any organization-controlled LLM gateway", what you need / no-gateway guidance, the OpenAI-compatible API, neutral snippets (curl/Python/Node), and a common-errors cookbook. Product-agnostic. |
| `sandbox.html` | **UCSB specifics** (developer track): get an LLM Sandbox key (two routes), the live model catalog, and the facts verified against the campus `/v1` gateway (either `Bearer` or `x-api-key` works). Links to `gateway.html` for the mechanics. |
| `about.html` | The author (Jonathan Engeln Lambinet-Lacson, email + LinkedIn), the project, and "how this was made". |
| `styles.css`, `app.js` | The **shared design system** + behaviors (tabbed code, copy buttons, scrollspy, mobile nav, chat widget, "revised N×" badge renderer) used by every page. Edit these once; every page updates. |
| `img/` | Annotated screenshots (PNG). `_annot.py` is the annotation helper (crop / box / numbered badge / legend). |
| `knowledge/ferpa-data-reports.md` | The chat assistant's curated knowledge file (one of its two sources; see below). |
| `sample-data/` | Synthetic `advising_notes_sample.csv` / `.xlsx` (KPI columns; no real records). |
| `ferpa_pipeline_colab.ipynb` | Ready-to-run companion notebook. |
| `worker/` | Cloudflare Worker proxy that hides the bot API key (`worker.js`, `wrangler.jsonc`, `README.md`). |
| `favicon.svg`, `README.md` | Site favicon; public README. |

## The chat assistant ("Ask the assistant")

The in-page widget calls a **Cloudflare Worker proxy**
(`https://ferpa-reports-bot-proxy.jonathan-engeln.workers.dev`), which holds the bot API
key as a **server-side secret**, allows only the `https://ucsb-pace.github.io` origin, and
rate-limits, then forwards to the **published bot API** (bedrock-claude-chat: async
`POST /conversation`, then poll `GET /conversation/{id}`; model `claude-v4.5-haiku`).

- **The API key is NEVER in `index.html`.** It lives only in the Worker secret
  (`BOT_API_KEY`). Do not paste it into the page, a commit, or a screenshot.
- **Bot:** "Ferpa Data Reports Website Assistant", id `01KVEPQV2NF2PVSBVMNW53NYA5`, on
  `llmsandbox.cloud.ucsb.edu` (edit at `/bot/edit/<id>`).
- **Knowledge = two sources:** `knowledge/ferpa-data-reports.md` **and** the live site URL
  `https://ucsb-pace.github.io/ferpa-data-reports/`.
- **After you change site content, re-sync the bot** so it re-crawls: open `/bot/my`, click
  **Update** on the bot (web-crawl re-embed takes a few minutes). If you add new pages,
  add their URLs to the bot's URL knowledge too.
- Worker deploy is `wrangler deploy` from `worker/`; the secret is set with
  `wrangler secret put BOT_API_KEY`. See `worker/README.md`.

## House style (do not break these)

- **No em dashes anywhere.** Use commas, parentheses, or "to". This is a hard rule across
  all PaCE content.
- **The word "messy" is retired** from the copy (it lived in the old advising example,
  which no longer exists as a section). Use "raw", "inconsistent", or "rarely clean".
- **Product naming:** the generally-available product is **LLM Sandbox**
  (`llmsandbox.cloud.ucsb.edu`); always call it that. The **developer console**
  `llmdev.cloud.ucsb.edu` is dev/alpha and **in preview, not open to everyone yet**. Frame
  anything dev-only as "currently in preview for people on dev". (Today: the bot
  **API Publish Settings** route gives an endpoint + key and is GA; the direct `/v1`
  base-URL + key from the dev console is the preview path the pipeline code uses.)
- **UCSB-specific but generalizable:** concrete UCSB references are good; keep the
  transferable pattern usable by any department or institution. No "PaCE Reflect" branding.
- **Accessibility:** correct heading order (no level skips), real `alt` text on every
  screenshot, sufficient contrast.

## Screenshots and annotation

- Annotate with `img/_annot.py` (`Annotator(src, crop=...).box()/.badge()/.legend()/.save()`).
  Run with Windows `python` (Git Bash `python3` lacks Pillow).
- **Redact secrets**: blur API keys and (for caution) base URLs in any screenshot. Prefer
  screens where the key is masked.
- **PNG, not JPEG** for UI screenshots (PNG-8 quantization beats JPEG on flat UI). Keep
  files reasonably small.
- Raw captures (`raw-*.png`), `_mk_*.py` scratch scripts, `__pycache__/`, and Playwright
  artifacts are build junk; they are gitignored, do not commit them.

## Issues / project board

This repo sits under the **PaCERepo umbrella**; the umbrella `CLAUDE.md` (a parent
directory) carries the full GitHub Project #3 conventions and field IDs. In short: issues
go on Project #3 (UCSB-PaCE org), assignee `jengeln`, always set Type / Status / Priority /
Size, apply a type label plus area labels (`ai`, `automation`, `data`, `infra`, etc.).

---

## Roadmap

Driven by reviewer feedback: the site is strong (the "get and use an API" walkthrough was
called out as especially helpful), but it currently teaches **three things at once** (FERPA,
the transferable process, and how to drive the Sandbox), which can overwhelm even
experienced readers. The reviewer also noted that official Sandbox docs were **sparse and
had syntax errors** they had to fix with AI (Cursor). The roadmap responds to both.

### Status (shipped 2026-06-21)
- **P1 split: done.** `index.html` is now the goal chooser; the full guide moved to
  `guide.html`; `concept.html` and `sandbox.html` are the focused editions. All four share
  `styles.css` + `app.js` (P2 extraction done too).
- **P1 cookbook: done.** `sandbox.html` carries a common-errors cookbook.
- **Live-verified the gateway (2026-06-21), corrected the docs:** the key authenticates as
  **either** `Authorization: Bearer` **or** `x-api-key` (the old "x-api-key, not Bearer"
  claim was wrong and is fixed sitewide, including `knowledge/`), the Base URL ends in
  `/v1`, and the real model catalog was captured (`claude-v4.6-sonnet`, `claude-v4.5-haiku`,
  `amazon-nova-*`, `llama-4-*`, `gpt-4o` aliases, etc.). All four pages pass **axe-core
  WCAG 2.1 AA** (0 violations).
- **Still open:** add the new page URLs (`concept.html`, `sandbox.html`, `guide.html`) to the
  bot's URL knowledge and re-sync; P3 niceties (`details`/`summary` progressive disclosure,
  a mobile sticky section menu, streaming chat); fresh annotated key-creation screenshots.

The items below are kept for context on the original intent.

### P1 — Split into audience-focused editions
Keep the current comprehensive page as the "full guide", and add focused entry points that
share the same CSS and assets:
- **Concept edition** (`concept.html`): the transferable 6-stage pattern, the
  continuous-improvement loop, and the FERPA principles. No keys, no code. For
  decision-makers and anyone who wants the "what and why" without the plumbing.
- **Sandbox how-to edition** (`sandbox.html`): a standalone, practical guide to *using LLM
  Sandbox*, decoupled from FERPA and this specific pipeline. Highest-value new artifact,
  it directly fills the gap the reviewer hit. Include: getting keys (both routes), the auth
  gotchas (`x-api-key` vs `Authorization: Bearer`, base URL ending in `/v1`, exact model
  ids), and **known-good, copy-paste snippets** (curl / Python / Node) that actually run.
- **Landing / chooser**: a short top page that routes readers by goal ("I want the concept"
  / "I want to use the Sandbox" / "I want the whole pipeline"). The current `index.html`
  can become the full guide, with the chooser linking into it.

### P1 — Sandbox "common errors" cookbook
Inside the Sandbox edition, a troubleshooting table of the real failure modes and their
fixes (401/403 from wrong header, bearer vs `x-api-key`, missing `/v1`, wrong model id,
SDK sending the wrong auth). This is the antidote to "the provided docs had syntax errors".

### P2 — Structure for multipage
Extract shared inline CSS into `styles.css` once there is more than one page, so edits stay
DRY. The old Google Sites ~237K paste limit no longer applies (we are on Pages), so multiple
pages are free. Keep the per-page "revised N×" badge script working across pages.

### P2 — Keep the assistant in sync with editions
When new pages ship, add their URLs to the bot's URL knowledge and re-sync. Consider scoping
the widget's suggested questions per page.

### P3 — Nice-to-haves
Streaming responses in the chat widget (`stream: true`), light analytics, and a short
screencast of the Colab no-code path.
