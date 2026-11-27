// Cloudflare Pages Function: GET/PUT /api/edits
// Needs a KV namespace binding named EDITS and an environment variable EDIT_PASSWORD.

const JSON_HEADERS = { "content-type": "application/json", "cache-control": "no-store" };

export async function onRequestGet({ env }) {
  const data = await env.EDITS.get("edits");
  return new Response(data || "{}", { headers: JSON_HEADERS });
}

export async function onRequestPut({ request, env }) {
  if (!env.EDIT_PASSWORD || request.headers.get("x-edit-password") !== env.EDIT_PASSWORD) {
    return new Response(JSON.stringify({ error: "wrong password" }), { status: 401, headers: JSON_HEADERS });
  }

  const body = await request.text();
  if (body.length > 100000) {
    return new Response(JSON.stringify({ error: "too large" }), { status: 413, headers: JSON_HEADERS });
  }

  let input;
  try { input = JSON.parse(body); } catch { input = null; }
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return new Response(JSON.stringify({ error: "bad data" }), { status: 400, headers: JSON_HEADERS });
  }

  // Keep only short string values with simple keys like "home.lede".
  const clean = {};
  for (const [k, v] of Object.entries(input)) {
    if (/^[a-z0-9.]{1,60}$/i.test(k) && typeof v === "string") clean[k] = v.slice(0, 2000);
  }

  await env.EDITS.put("edits", JSON.stringify(clean));
  return new Response(JSON.stringify({ ok: true }), { headers: JSON_HEADERS });
}
