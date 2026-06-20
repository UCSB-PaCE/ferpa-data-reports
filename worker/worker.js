/**
 * Cloudflare Worker: proxy for the LLM Sandbox published bot API.
 *
 * Why: the public docs site (GitHub Pages) must not ship the bot API key. This Worker
 * holds the key as a server-side secret, accepts requests only from approved origins,
 * optionally rate-limits, and forwards to the bot API with the key attached. The browser
 * never sees the key.
 *
 * Secrets / vars (set via wrangler):
 *   BOT_API_KEY   (secret)  the LLM Sandbox published-bot API key
 *   BOT_API_BASE  (var)     e.g. https://3em1pblmjl.execute-api.us-east-1.amazonaws.com/api
 *   RATE_LIMITER  (binding, optional)  native rate-limit binding; if absent, skipped
 */

// Exact origins allowed to call this Worker from a browser.
const ALLOWED_ORIGINS = [
  "https://ucsb-pace.github.io", // GitHub Pages (update to your exact Pages origin)
];
// Origin suffixes allowed (kept empty: the GitHub Pages origin above is the only
// client. Re-add e.g. ".googleusercontent.com" only if a Google Sites embed needs it.)
const ALLOWED_SUFFIXES = [];

function allowOrigin(origin) {
  if (!origin) return null;
  if (ALLOWED_ORIGINS.includes(origin)) return origin;
  for (const s of ALLOWED_SUFFIXES) if (origin.endsWith(s)) return origin;
  return null;
}

function cors(origin) {
  const h = {
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
  if (origin) h["Access-Control-Allow-Origin"] = origin;
  return h;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = allowOrigin(request.headers.get("Origin"));

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors(origin) });
    }
    // Browsers send an Origin header; reject anything not on the allowlist.
    if (!origin) return new Response("Forbidden origin", { status: 403 });

    // Optional per-IP rate limit (native binding). No-op if the binding is absent.
    if (env.RATE_LIMITER) {
      const ip = request.headers.get("CF-Connecting-IP") || "anon";
      const { success } = await env.RATE_LIMITER.limit({ key: ip });
      if (!success) return new Response("Rate limited", { status: 429, headers: cors(origin) });
    }

    // Only proxy the chat endpoints: /conversation, /conversation/<id>, /health.
    const path = url.pathname.replace(/^\/+/, "");
    if (path !== "health" && !/^conversation(\/[\w-]+)?$/.test(path)) {
      return new Response("Not found", { status: 404, headers: cors(origin) });
    }

    const target = env.BOT_API_BASE.replace(/\/+$/, "") + "/" + path;
    const init = {
      method: request.method,
      headers: { "x-api-key": env.BOT_API_KEY, "Content-Type": "application/json" },
    };
    if (request.method === "POST") init.body = await request.text();

    const upstream = await fetch(target, init);
    const body = await upstream.text();
    return new Response(body, {
      status: upstream.status,
      headers: { ...cors(origin), "Content-Type": "application/json" },
    });
  },
};
