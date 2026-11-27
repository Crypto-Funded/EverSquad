import agentsRegistry from "../../registry/agents.json";
import squadsRegistry from "../../registry/squads.json";

export const AGENTS = agentsRegistry;
export const SQUADS = squadsRegistry;
export const DEFAULT_PROXY_URL = "";

export const DOMAINS = [
  { id: "code", label: "Code & Web" },
  { id: "writing", label: "Redaction" },
  { id: "design", label: "Design & Images" },
  { id: "data", label: "Data & Analyse" },
  { id: "marketing", label: "Marketing" }
];

let webLlmEngine = null;

export function isWebLlmReady() {
  return Boolean(webLlmEngine);
}

export async function loadWebLlmEngine(onProgress) {
  if (webLlmEngine) return webLlmEngine;
  if (typeof navigator === "undefined" || !navigator.gpu) {
    throw new Error("WebGPU n’est pas disponible sur ce navigateur.");
  }
  if (onProgress) onProgress("Chargement du moteur WebGPU...");
  const webllm = await import(/* @vite-ignore */ "https://esm.sh/@mlc-ai/web-llm@0.2.85");
  webLlmEngine = await webllm.CreateMLCEngine("Qwen2.5-0.5B-Instruct-q4f16_1-MLC", {
    initProgressCallback: function (report) {
      if (onProgress && report && report.text) onProgress(report.text);
    }
  });
  return webLlmEngine;
}

export function getAgentsForDomain(domain) {
  const matched = AGENTS.filter(function (a) { return a.domain === domain; });
  const fallbacks = AGENTS.filter(function (a) { return a.authType === "local_browser" && a.domain !== domain; });
  return matched.concat(fallbacks).sort(function (a, b) { return a.priority - b.priority; });
}

export function enhancePrompt(rawPrompt, domain) {
  const clean = (rawPrompt || "").trim();
  if (!clean) return "";
  if (domain === "code") {
    return "Cree une page web HTML5 complete, autonome (avec Tailwind CDN), responsive et moderne pour : " + clean + ". Renvoie uniquement le code HTML complet pret a afficher.";
  }
  if (domain === "design") {
    return "High quality modern digital illustration, clean composition, vibrant lighting, " + clean;
  }
  if (domain === "marketing") {
    return "Agis comme un stratege marketing senior. Produis un plan clair en Markdown (Positionnement, 3 Slogans, Plan d’action en 5 etapes) pour : " + clean;
  }
  if (domain === "data") {
    return "Structure et analyse clairement ces donnees sous forme de tableau Markdown et synthese actionnable : " + clean;
  }
  return "Redige un contenu structure, clair, professionnel et engageant en francais en Markdown sur : " + clean;
}

export function extractDeliverable(text) {
  if (!text) return "";
  const marker = String.fromCharCode(96, 96, 96);
  const start = text.indexOf(marker);
  if (start !== -1) {
    const firstNl = text.indexOf("\n", start);
    const end = text.indexOf(marker, firstNl + 1);
    if (firstNl !== -1 && end !== -1) {
      return text.slice(firstNl + 1, end).trim();
    }
  }
  return text.trim();
}

export function encodeProjectUrl(projectObj) {
  const json = JSON.stringify(projectObj);
  const bytes = new TextEncoder().encode(json);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

export function decodeProjectUrl(hashStr) {
  try {
    if (!hashStr || hashStr.indexOf("#project=") !== 0) return null;
    const b64 = hashStr.slice(9);
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return null;
  }
}

function buildLocalFallbackOutput(domain, prompt, memory) {
  const title = (prompt || "Mon Projet EverSquad").slice(0, 60);
  const memNote = memory ? "Contexte local integre (" + memory.slice(0, 80) + "...)" : "Mode hors-ligne 100% navigateur";
  if (domain === "code") {
    return [
      "<!DOCTYPE html>",
      "<html lang=\"fr\">",
      "<head>",
      "  <meta charset=\"UTF-8\" />",
      "  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />",
      "  <title>" + title + "</title>",
      "  <script src=\"https://cdn.tailwindcss.com\"></script>",
      "</head>",
      "<body class=\"bg-slate-950 text-slate-100 min-h-screen flex items-center justify-center p-6\">",
      "  <div class=\"max-w-2xl w-full bg-slate-900 border border-emerald-500/30 rounded-2xl p-8 shadow-2xl\">",
      "    <span class=\"inline-block px-3 py-1 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-400 mb-4\">Genere par EverSquad Local Fallback</span>",
      "    <h1 class=\"text-3xl font-bold mb-3\">" + title + "</h1>",
      "    <p class=\"text-slate-300 mb-6\">Votre projet a continue sans interruption grace au relais automatique (" + memNote + ").</p>",
      "    <div class=\"grid grid-cols-1 sm:grid-cols-2 gap-4\">",
      "      <div class=\"p-4 rounded-xl bg-slate-800/80 border border-slate-700\"><h2 class=\"font-semibold text-emerald-400\">Etape 1 : Structure</h2><p class=\"text-sm text-slate-400 mt-1\">Activez WebGPU IA ou connectez un Miroir Cloudflare dans Parametres pour une generation 100% dynamique.</p></div>",
      "      <div class=\"p-4 rounded-xl bg-slate-800/80 border border-slate-700\"><h2 class=\"font-semibold text-sky-400\">Etape 2 : Export</h2><p class=\"text-sm text-slate-400 mt-1\">Modifiez dans Source, sauvegardez un Checkpoint ou partagez par lien.</p></div>",
      "    </div>",
      "  </div>",
      "</body>",
      "</html>"
    ].join("\n");
  }
  return [
    "# " + title,
    "",
    "> Relais reussi via le moteur local EverSquad (" + memNote + ").",
    "",
    "## Synthese du Projet",
    "- **Domaine :** " + domain,
    "- **Objectif :** " + prompt,
    "- **Astuce v1.1 :** Cliquez sur **Parametres (Miroir & IA)** en haut pour activer la vraie IA WebGPU locale ou brancher votre Miroir Cloudflare gratuit !",
    "",
    "## Plan d’action propose",
    "1. Definir les 3 priorites cles du livrable.",
    "2. Affiner directement dans l’onglet Source a droite.",
    "3. Exporter ou partager par lien magique."
  ].join("\n");
}

async function tryChromeBuiltInAi(fullPrompt) {
  try {
    if (typeof window === "undefined" || !window.LanguageModel) return null;
    const avail = await window.LanguageModel.availability();
    if (avail !== "available" && avail !== "readily") return null;
    const session = await window.LanguageModel.create();
    const out = await session.prompt(fullPrompt);
    return out || null;
  } catch {
    return null;
  }
}

export async function executeWithRelay({ domain, prompt, currentDeliverable, localMemory, exhaustedIds, proxyUrl, onRelay }) {
  const pool = getAgentsForDomain(domain);
  const activeProxy = (proxyUrl || DEFAULT_PROXY_URL || "").trim();
  const contextSummary = currentDeliverable
    ? "Etat actuel du projet (extrait) : " + currentDeliverable.slice(0, 700)
    : "Nouveau projet";
  const memorySnippet = localMemory ? "Memoire utilisateur : " + localMemory.slice(0, 450) : "";
  const systemPrompt = "Tu es EverSquad, un assistant expert concis et efficace dans le domaine : " + domain + ".";
  const fullPrompt = [
    memorySnippet,
    contextSummary,
    "Demande utilisateur : " + prompt,
    domain === "code" ? "Reponds uniquement avec un fichier HTML5 complet et fonctionnel (Tailwind CDN autorise)." : "Reponds de facon claire et structuree en francais."
  ].filter(Boolean).join("\n\n");

  let previousAgent = null;

  // 1. Tenter le Miroir Proxy Cloudflare (si configure)
  if (activeProxy && exhaustedIds.indexOf("cloudflare-mirror") === -1) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(function () { controller.abort(); }, 20000);
      const res = await fetch(activeProxy, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({ prompt: fullPrompt, systemPrompt: systemPrompt, domain: domain })
      });
      clearTimeout(timer);
      if (res.ok) {
        const data = await res.json();
        if (data && data.text) {
          const clean = extractDeliverable(data.text);
          const isHtml = clean.indexOf("<html") !== -1 || clean.indexOf("<!DOCTYPE") !== -1;
          const mirrorAgent = { id: "cloudflare-mirror", name: "Miroir Cloud (" + (data.providerUsed || "Free Tier") + ")", domain: domain };
          if (data.relays > 0 && onRelay) {
            onRelay({ from: { name: "Fournisseur principal" }, to: mirrorAgent, reason: data.relays + " relais effectue(s) automatiquement cote miroir" });
          }
          return {
            agent: mirrorAgent,
            rawText: isHtml ? "Code HTML genere par " + mirrorAgent.name + " et affiche dans le Canvas." : data.text,
            deliverable: clean,
            type: isHtml ? "html" : "markdown",
            relayed: data.relays > 0
          };
        }
      }
      previousAgent = { id: "cloudflare-mirror", name: "Miroir Cloud" };
    } catch {
      previousAgent = { id: "cloudflare-mirror", name: "Miroir Cloud" };
    }
  }

  // 2. Tenter Chrome Built-in AI (Gemini Nano local sans telechargement)
  const chromeText = await tryChromeBuiltInAi(fullPrompt);
  if (chromeText) {
    const chromeAgent = { id: "chrome-builtin", name: "Chrome Built-in AI", domain: domain };
    if (previousAgent && onRelay) {
      onRelay({ from: previousAgent, to: chromeAgent, reason: "Bascule vers l’IA integree du navigateur" });
    }
    const cleanChrome = extractDeliverable(chromeText);
    const isHtmlC = cleanChrome.indexOf("<html") !== -1 || cleanChrome.indexOf("<!DOCTYPE") !== -1;
    return {
      agent: chromeAgent,
      rawText: isHtmlC ? "Code HTML genere par Chrome Built-in AI." : chromeText,
      deliverable: cleanChrome,
      type: isHtmlC ? "html" : "markdown",
      relayed: Boolean(previousAgent)
    };
  }

  // 3. Tenter WebLLM WebGPU (si deja charge par l’utilisateur)
  if (webLlmEngine) {
    const gpuAgent = { id: "webllm-gpu", name: "WebGPU Qwen-0.5B (Local)", domain: domain };
    if (previousAgent && onRelay) {
      onRelay({ from: previousAgent, to: gpuAgent, reason: "Relais vers votre GPU local (quota infini)" });
    }
    try {
      const reply = await webLlmEngine.chat.completions.create({
        messages: [{ role: "system", content: systemPrompt }, { role: "user", content: fullPrompt }],
        temperature: 0.7
      });
      const gpuText = reply && reply.choices && reply.choices[0] ? reply.choices[0].message.content : "";
      if (gpuText) {
        const cleanGpu = extractDeliverable(gpuText);
        const isHtmlG = cleanGpu.indexOf("<html") !== -1 || cleanGpu.indexOf("<!DOCTYPE") !== -1;
        return {
          agent: gpuAgent,
          rawText: isHtmlG ? "Code HTML genere en local sur votre GPU par WebLLM !" : gpuText,
          deliverable: cleanGpu,
          type: isHtmlG ? "html" : "markdown",
          relayed: Boolean(previousAgent)
        };
      }
    } catch {
      previousAgent = gpuAgent;
    }
  }

  // 4. Fallback instantane du Studio (garantie 0 interruption)
  const fallbackAgent = pool[pool.length - 1];
  if (previousAgent && onRelay) {
    onRelay({ from: previousAgent, to: fallbackAgent, reason: "Relais instantane vers le moteur local de secours" });
  }
  return {
    agent: fallbackAgent,
    rawText: "Reponse generee par " + fallbackAgent.name + " (moteur de secours garanti sans coupure).",
    deliverable: buildLocalFallbackOutput(domain, prompt, localMemory),
    type: domain === "code" ? "html" : "markdown",
    relayed: Boolean(previousAgent)
  };
}
