# FERPA Data to Reports

A public documentation site (UCSB) on how to transfer the "FERPA-protected data to report"
pipeline to any dataset, centered on UCSB's LLM Sandbox, with a no-code Google Colab path.

Live: https://ucsb-pace.github.io/ferpa-data-reports/

It is a multi-page static site (plain HTML, no build step): 30 HTML pages sharing one
`styles.css` and one `app.js`. GitHub Pages serves it from `main`.

## Contents
- `index.html` - landing page (the hook, featured cases, and the track chooser)
- `usecases.html` - the "Find your use case" gallery, linking to 21 detail pages
- `cases/` - 21 use-case detail pages (one per dataset/scenario)
- `the-ai-prism.html` - the AI@Work "AI Prism" showcase page
- `nocode.html`, `colab-intro.html` - the no-code Google Colab track
- `dev.html`, `gateway.html`, `sandbox.html` - the developer track (the build, the generic LLM gateway, the UCSB LLM Sandbox specifics)
- `about.html` - about the guide and its author
- `styles.css`, `app.js` - the shared design system and behaviors used by every page
- `img/` - annotated screenshots
- `sample-data/` - synthetic sample files, one per use case (CSV/XLSX/PDF), no real records
- `ferpa_pipeline_colab.ipynb` - ready-to-run companion notebook
- `knowledge/ferpa-data-reports.md` - the chat assistant's knowledge source
- `worker/` - the Cloudflare Worker proxy source (deploy with wrangler; the key is a server-side secret)

The "Ask the assistant" chat calls a Cloudflare Worker proxy that holds the bot API key
server-side, so the key is never in this repo or the page.

Built with the help of UCSB's LLM Sandbox under human review.

## Contributor setup (commit hooks)

Commits in this repo must follow [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:`, `chore:` ...), and are scanned for secrets. Git does not version `.git/hooks`, so **every fresh clone must run one of these once**:

```sh
# Option 1: pre-commit (also runs the secret scan)
pip install pre-commit
pre-commit install --hook-type pre-commit --hook-type commit-msg

# Option 2: dependency-free commit-msg hook only (needs a pace-core checkout)
<path-to-pace-core>/STANDARDS/hooks/install-hook.sh --copy .
```

Check it worked: `git commit --allow-empty -m "bad message"` should be rejected, and `git commit --allow-empty -m "chore: test"` should pass (undo with `git reset --soft HEAD~1`).
