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

This is **plain static HTML**, no build step. `index.html` is a single self-contained
page (inline CSS + JS). To publish: commit and `git push origin main`; GitHub Pages
auto-deploys in ~30-60s. Always verify live afterward (curl the page / check images 200).

```bash
# typical change loop
#   1. edit index.html (or assets)
#   2. git add -A && git commit && git push origin main
#   3. curl -s https://ucsb-pace.github.io/ferpa-data-reports/index.html | grep <new text>
```

## File map

| Path | Purpose |
|------|---------|
| `index.html` | The whole site. Sections: overview, 6-stage pattern, continuous-improvement loop, FERPA guardrails, **get-key** (how to get an LLM Sandbox key), API reference, system-agnostic snippets, SQLite caching, token economics, Colab + Secrets + Gemini, advising worked example, charts, VS Code, principles, "How this was made". Per-section "revised N× · date" badges + copy buttons live in inline `<script>` blocks near the bottom. |
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
- **The word "messy" appears only in the advising worked example**, nowhere else.
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
