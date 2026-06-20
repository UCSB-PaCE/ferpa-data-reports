# Bot API proxy (Cloudflare Worker)

Hides the LLM Sandbox bot API key from the public docs site. The browser calls this
Worker; the Worker attaches the key server-side and forwards to the bot API. Only
approved origins (GitHub Pages + the Google Sites `*.googleusercontent.com` embed) are
allowed, and an optional per-IP rate limit guards against abuse.

## Deploy

```bash
cd docs-site/worker
npx wrangler deploy                     # needs Cloudflare auth (token or `wrangler login`)
npx wrangler secret put BOT_API_KEY     # paste the bot API key when prompted
```

Auth options (pick one):
- `export CLOUDFLARE_API_TOKEN=...`  (token with **Workers Scripts: Edit** + **Account: Read**), or
- `npx wrangler login`               (interactive browser OAuth)

After deploy, note the Worker URL (e.g. `https://ferpa-reports-bot-proxy.<account>.workers.dev`)
and point the widget at it (the `EP` constant in `../index.html`), removing the `KEY`.

## Update the allowed origin

Edit `ALLOWED_ORIGINS` in `worker.js` to your exact GitHub Pages origin, then redeploy.

## Notes
- `BOT_API_BASE` (in `wrangler.jsonc`) is the bot's published API endpoint. Update if it changes.
- The rate-limit binding is optional; the Worker runs fine without it. Adjust `limit`/`period`
  in `wrangler.jsonc` (the `namespace_id` is an arbitrary per-account id for the limiter).
- The key lives only as a Worker **secret**; it is never in the repo or the page source.
