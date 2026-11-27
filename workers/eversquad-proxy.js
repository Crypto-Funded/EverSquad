export default {
  async fetch(request, env) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    if (url.pathname === "/health") {
      return new Response(JSON.stringify({
        ok: true,
        providers: {
          groq: Boolean(env.GROQ_API_KEY),
          gemini: Boolean(env.GEMINI_API_KEY),
          openrouter: Boolean(env.OPENROUTER_API_KEY),
          pollinations: Boolean(env.POLLINATIONS_API_KEY)
        }
      }), { headers: Object.assign({}, corsHeaders, { "Content-Type": "application/json" }) });
    }

    if (request.method !== "POST") {
      return new Response("EverSquad Free Mirror Proxy is running. Send POST JSON.", { headers: corsHeaders });
    }

    let body = {};
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400, headers: corsHeaders });
    }

    const prompt = String(body.prompt || "").slice(0, 12000);
    const systemPrompt = String(body.systemPrompt || "Tu es EverSquad, un assistant expert concis et efficace.");
    let relays = 0;

    const attempts = [];
    if (env.GROQ_API_KEY) attempts.push({ name: "Groq", fn: callGroq });
    if (env.GEMINI_API_KEY) attempts.push({ name: "Gemini", fn: callGemini });
    if (env.OPENROUTER_API_KEY) attempts.push({ name: "OpenRouter", fn: callOpenRouter });
    if (env.POLLINATIONS_API_KEY) attempts.push({ name: "Pollinations", fn: callPollinations });

    for (let i = 0; i < attempts.length; i++) {
      try {
        const text = await attempts[i].fn(env, systemPrompt, prompt);
        if (text && text.length > 5) {
          return new Response(JSON.stringify({
            text: text,
            providerUsed: attempts[i].name,
            relays: relays
          }), { headers: Object.assign({}, corsHeaders, { "Content-Type": "application/json" }) });
        }
      } catch {
        relays++;
      }
    }

    return new Response(JSON.stringify({ error: "All cloud free-tier quotas exhausted", relays: relays }), {
      status: 429,
      headers: Object.assign({}, corsHeaders, { "Content-Type": "application/json" })
    });
  }
};

async function callGroq(env, sys, usr) {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Authorization": "Bearer " + env.GROQ_API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ model: env.GROQ_MODEL || "llama-3.3-70b-versatile", messages: [{ role: "system", content: sys }, { role: "user", content: usr }] })
  });
  if (!res.ok) throw new Error("Groq " + res.status);
  const data = await res.json();
  return data && data.choices && data.choices[0] && data.choices[0].message ? data.choices[0].message.content : "";
}

async function callGemini(env, sys, usr) {
  const model = env.GEMINI_MODEL || "gemini-3.5-flash-lite";
  const res = await fetch("https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent?key=" + env.GEMINI_API_KEY, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ systemInstruction: { parts: [{ text: sys }] }, contents: [{ parts: [{ text: usr }] }] })
  });
  if (!res.ok) throw new Error("Gemini " + res.status);
  const data = await res.json();
  return data && data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0] ? data.candidates[0].content.parts[0].text : "";
}

async function callOpenRouter(env, sys, usr) {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": "Bearer " + env.OPENROUTER_API_KEY,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://crypto-funded.github.io/EverSquad/",
      "X-Title": "EverSquad"
    },
    body: JSON.stringify({ model: "openrouter/free", messages: [{ role: "system", content: sys }, { role: "user", content: usr }] })
  });
  if (!res.ok) throw new Error("OpenRouter " + res.status);
  const data = await res.json();
  return data && data.choices && data.choices[0] && data.choices[0].message ? data.choices[0].message.content : "";
}

async function callPollinations(env, sys, usr) {
  const res = await fetch("https://gen.pollinations.ai/v1/chat/completions", {
    method: "POST",
    headers: { "Authorization": "Bearer " + env.POLLINATIONS_API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "openai", messages: [{ role: "system", content: sys }, { role: "user", content: usr }] })
  });
  if (!res.ok) throw new Error("Pollinations " + res.status);
  const data = await res.json();
  return data && data.choices && data.choices[0] && data.choices[0].message ? data.choices[0].message.content : "";
}
