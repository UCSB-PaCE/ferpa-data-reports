# FERPA Data to Reports

A public documentation site (UCSB) on how to transfer the "FERPA-protected data to report"
pipeline to any dataset, centered on UCSB's LLM Sandbox, with a no-code Google Colab path.

Live: https://ucsb-pace.github.io/ferpa-data-reports/

## Contents
- `index.html` - the site (single self-contained page; images in `img/`)
- `img/` - annotated screenshots
- `sample-data/` - synthetic advising-notes sample (CSV + XLSX), no real records
- `ferpa_pipeline_colab.ipynb` - ready-to-run companion notebook
- `knowledge/ferpa-data-reports.md` - the chat assistant's knowledge source

The "Ask the assistant" chat calls a Cloudflare Worker proxy that holds the bot API key
server-side, so the key is never in this repo or the page.

Built with the help of UCSB's LLM Sandbox under human review.
