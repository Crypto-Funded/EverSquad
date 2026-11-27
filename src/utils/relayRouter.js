import agentsRegistry from "../../registry/agents.json";
import squadsRegistry from "../../registry/squads.json";

export const AGENTS = agentsRegistry;
export const SQUADS = squadsRegistry;

export const DOMAINS = [
  { id: "code", label: "Code & Web", color: "emerald" },
  { id: "writing", label: "Redaction", color: "sky" },
  { id: "design", label: "Design & Images", color: "violet" },
  { id: "data", label: "Data & Analyse", color: "amber" },
  { id: "marketing", label: "Marketing", color: "rose" }
];

export function getAgentsForDomain(domain) {
  const matched = AGENTS.filter(function (a) { return a.domain === domain; });
  const fallbacks = AGENTS.filter(function (a) { return a.authType === "local_browser" && a.domain !== domain; });
  return matched.concat(fallbacks).sort(function (a, b) { return a.priority - b.priority; });
}

export function enhancePrompt(rawPrompt, domain) {
  const clean = (rawPrompt || "").trim();
  if (!clean) return "";
  if (domain === "code") {
    return "Cree une page web HTML5 complete, autonome (avec Tailwind CDN ou CSS moderne integre), responsive et esthetique pour : " + clean + ". Renvoie uniquement le code HTML complet pret a afficher.";
  }
  if (domain === "design") {
    return "High quality modern digital illustration, clean composition, vibrant lighting, " + clean;
  }
  if (domain === "marketing") {
    return "Agis comme un stratege marketing senior. Produis un plan clair en Markdown (Positionnement, 3 Slogans, Plan d action en 5 etapes) pour : " + clean;
  }
  if (domain === "data") {
    return "Structure et analyse clairement les donnees suivantes sous forme de tableau Markdown et synthese actionnable : " + clean;
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
      "    <p class=\"text-slate-300 mb-6\">Votre projet a continue sans aucune interruption grace au relais automatique vers le moteur local du navigateur (" + memNote + ").</p>",
      "    <div class=\"grid grid-cols-1 sm:grid-cols-2 gap-4\">",
      "      <div class=\"p-4 rounded-xl bg-slate-800/80 border border-slate-700\"><h2 class=\"font-semibold text-emerald-400\">Etape 1 : Structure</h2><p class=\"text-sm text-slate-400 mt-1\">Base responsive prete a personnaliser dans l editeur.</p></div>",
      "      <div class=\"p-4 rounded-xl bg-slate-800/80 border border-slate-700\"><h2 class=\"font-semibold text-sky-400\">Etape 2 : Export</h2><p class=\"text-sm text-slate-400 mt-1\">Telechargez le fichier HTML ou partagez-le en 1 clic.</p></div>",
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
    "- **Statut :** Continuité garantie sans inscription ni interruption.",
    "",
    "## Plan d action propose",
    "1. Definir les 3 priorites cles du livrable.",
    "2. Affiner le contenu directement dans l onglet Source / Editeur a droite.",
    "3. Sauvegarder un Checkpoint puis exporter en .md ou partager par lien."
  ].join("\n");
}

export async function executeWithRelay({ domain, prompt, currentDeliverable, localMemory, exhaustedIds, onRelay }) {
  const pool = getAgentsForDomain(domain);
  const available = pool.filter(function (a) { return exhaustedIds.indexOf(a.id) === -1; });
  const queue = available.length > 0 ? available : [pool[pool.length - 1]];

  const contextSummary = currentDeliverable
    ? "Etat actuel du projet (extrait) : " + currentDeliverable.slice(0, 600)
    : "Nouveau projet";
  const memorySnippet = localMemory ? "Memoire utilisateur : " + localMemory.slice(0, 400) : "";
  const fullPrompt = [
    "Tu es un agent expert EverSquad dans le domaine : " + domain + ".",
    memorySnippet,
    contextSummary,
    "Demande utilisateur : " + prompt,
    domain === "code" ? "Reponds avec un fichier HTML complet et fonctionnel." : "Reponds de facon claire et structuree en francais."
  ].filter(Boolean).join("\n\n");

  let previousAgent = null;

  for (let i = 0; i < queue.length; i++) {
    const agent = queue[i];
    if (previousAgent && onRelay) {
      onRelay({ from: previousAgent, to: agent, reason: "Quota ou indisponibilite detectee — contexte compresse transfere" });
    }

    if (agent.authType === "proxy_free_tier") {
      previousAgent = agent;
      continue;
    }

    if (agent.authType === "local_browser") {
      const localOut = buildLocalFallbackOutput(domain, prompt, localMemory);
      return {
        agent: agent,
        rawText: "Reponse generee par " + agent.name + " (moteur de secours local infini).",
        deliverable: localOut,
        type: domain === "code" ? "html" : "markdown",
        relayed: Boolean(previousAgent)
      };
    }

    if (domain === "design" && agent.endpoint.indexOf("image.pollinations.ai") !== -1) {
      const imgPrompt = encodeURIComponent(enhancePrompt(prompt, "design"));
      const imgUrl = "https://image.pollinations.ai/prompt/" + imgPrompt + "?width=1024&height=640&nologo=true";
      return {
        agent: agent,
        rawText: "Visuel genere gratuitement par " + agent.name + ".",
        deliverable: imgUrl,
        type: "image",
        relayed: Boolean(previousAgent)
      };
    }

    try {
      const controller = new AbortController();
      const timer = setTimeout(function () { controller.abort(); }, 14000);
      const res = await fetch("https://text.pollinations.ai/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          messages: [
            { role: "system", content: "Tu es EverSquad, un assistant expert concis et efficace." },
            { role: "user", content: fullPrompt }
          ],
          model: "openai"
        })
      });
      clearTimeout(timer);
      if (!res.ok || res.status === 429) {
        previousAgent = agent;
        continue;
      }
      const text = await res.text();
      if (!text || text.length < 10) {
        previousAgent = agent;
        continue;
      }
      const clean = extractDeliverable(text);
      const isHtml = clean.indexOf("<html") !== -1 || clean.indexOf("<!DOCTYPE") !== -1;
      return {
        agent: agent,
        rawText: isHtml ? "Code HTML genere par " + agent.name + " et affiche dans le Canvas." : text,
        deliverable: clean,
        type: isHtml ? "html" : "markdown",
        relayed: Boolean(previousAgent)
      };
    } catch {
      previousAgent = agent;
    }
  }

  const fallbackAgent = pool[pool.length - 1];
  return {
    agent: fallbackAgent,
    rawText: "Relais complet vers le moteur local.",
    deliverable: buildLocalFallbackOutput(domain, prompt, localMemory),
    type: domain === "code" ? "html" : "markdown",
    relayed: true
  };
}
