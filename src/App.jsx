import { useState, useEffect } from "react";
import { Zap, Radio, LayoutGrid, Command, Coins, ArrowRightLeft, GitBranch, Settings, Cpu, CheckCircle2, X } from "lucide-react";
import Studio from "./components/Studio";
import FreeAIRadar from "./components/FreeAIRadar";
import CommandPalette from "./components/CommandPalette";
import { getAgentsForDomain, decodeProjectUrl, loadWebLlmEngine, isWebLlmReady } from "./utils/relayRouter";

export default function App() {
  const [activeTab, setActiveTab] = useState("studio");
  const [domain, setDomain] = useState("code");
  const [exhaustedIds, setExhaustedIds] = useState([]);
  const [activeAgent, setActiveAgent] = useState(function () { return getAgentsForDomain("code")[0]; });
  const [pitStopBanner, setPitStopBanner] = useState(null);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [proxyUrl, setProxyUrl] = useState(function () { return localStorage.getItem("eversquad_proxy_url") || ""; });
  const [gpuStatus, setGpuStatus] = useState(isWebLlmReady() ? "ready" : "idle");
  const [gpuProgress, setGpuProgress] = useState("");
  const [externalPrompt, setExternalPrompt] = useState("");
  const [sharedProject] = useState(function () { return decodeProjectUrl(window.location.hash); });

  const [stats, setStats] = useState(function () {
    try {
      const saved = localStorage.getItem("eversquad_stats");
      return saved ? JSON.parse(saved) : { relays: 0, savedDollars: 4, generations: 0 };
    } catch {
      return { relays: 0, savedDollars: 4, generations: 0 };
    }
  });

  useEffect(function () {
    localStorage.setItem("eversquad_stats", JSON.stringify(stats));
  }, [stats]);

  useEffect(function () {
    localStorage.setItem("eversquad_proxy_url", proxyUrl);
  }, [proxyUrl]);

  useEffect(function () {
    const pool = getAgentsForDomain(domain).filter(function (a) { return exhaustedIds.indexOf(a.id) === -1; });
    setActiveAgent(pool[0] || getAgentsForDomain(domain)[0]);
  }, [domain, exhaustedIds]);

  async function handleEnableWebGpu() {
    if (gpuStatus === "loading" || gpuStatus === "ready") return;
    setGpuStatus("loading");
    setGpuProgress("Initialisation WebGPU...");
    try {
      await loadWebLlmEngine(function (txt) { setGpuProgress(txt); });
      setGpuStatus("ready");
      setGpuProgress("Moteur Qwen-0.5B pret dans votre navigateur (100% hors-ligne) !");
    } catch (err) {
      setGpuStatus("error");
      setGpuProgress(err && err.message ? err.message : "WebGPU indisponible sur cet appareil.");
    }
  }

  function handleSimulateQuotaZero() {
    if (!activeAgent) return;
    const pool = getAgentsForDomain(domain);
    const nextExhausted = exhaustedIds.indexOf(activeAgent.id) === -1 ? exhaustedIds.concat([activeAgent.id]) : exhaustedIds;
    const remaining = pool.filter(function (a) { return nextExhausted.indexOf(a.id) === -1; });
    const nextAgent = remaining[0] || pool[pool.length - 1];

    if (remaining.length === 0) {
      setExhaustedIds([]);
      setPitStopBanner("Cycle complet reinitialise — tous les agents gratuits sont prets !");
    } else {
      setExhaustedIds(nextExhausted);
      setActiveAgent(nextAgent);
      setStats(function (s) { return { relays: s.relays + 1, savedDollars: s.savedDollars + 2, generations: s.generations }; });
      setPitStopBanner("Pit-Stop Relay : Quota 0% sur " + activeAgent.name + " -> Relais instantane vers " + nextAgent.name + " !");
    }
    setTimeout(function () { setPitStopBanner(null); }, 4500);
  }

  function handleAgentUsed(agent) {
    setActiveAgent(agent);
    setStats(function (s) { return { relays: s.relays, savedDollars: s.savedDollars + 1, generations: s.generations + 1 }; });
  }

  function handleRelayTriggered(ev) {
    setStats(function (s) { return { relays: s.relays + 1, savedDollars: s.savedDollars + 2, generations: s.generations }; });
    setPitStopBanner("Relais automatique : " + ev.from.name + " -> " + ev.to.name + " sans interruption !");
    setTimeout(function () { setPitStopBanner(null); }, 4500);
  }

  function handleCommand(cmd) {
    if (cmd.action === "toggle_palette") { setPaletteOpen(function (v) { return !v; }); return; }
    if (cmd.action === "simulate_relay") { handleSimulateQuotaZero(); return; }
    if (cmd.action === "open_radar") { setActiveTab("radar"); return; }
    if (cmd.domain && cmd.prompt) {
      setDomain(cmd.domain);
      setActiveTab("studio");
      setExternalPrompt(cmd.prompt);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 font-extrabold text-lg text-white">
              <span className="p-1.5 rounded-xl bg-emerald-500 text-slate-950"><Zap className="w-4 h-4" /></span>
              EverSquad
            </div>
            <span className="hidden sm:inline-block text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-emerald-400 border border-slate-700">
              v1.1 MIT • Zero Login
            </span>
          </div>

          <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button onClick={function () { setActiveTab("studio"); }} className={"inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition " + (activeTab === "studio" ? "bg-emerald-500 text-slate-950" : "text-slate-300 hover:text-white")}>
              <LayoutGrid className="w-3.5 h-3.5" /> Studio
            </button>
            <button onClick={function () { setActiveTab("radar"); }} className={"inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition " + (activeTab === "radar" ? "bg-emerald-500 text-slate-950" : "text-slate-300 hover:text-white")}>
              <Radio className="w-3.5 h-3.5" /> Free AI Radar
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              <span>~{stats.savedDollars} $ economises • {stats.relays} relais • 0 coupure</span>
            </div>
            <button onClick={function () { setSettingsOpen(true); }} className={"inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition " + (gpuStatus === "ready" || proxyUrl ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300" : "bg-slate-800 border-slate-700 text-slate-300 hover:text-white")}>
              <Settings className="w-3.5 h-3.5" /> Miroir & IA
            </button>
            <button onClick={handleSimulateQuotaZero} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-semibold transition">
              <ArrowRightLeft className="w-3.5 h-3.5" /> Simuler Quota 0%
            </button>
            <button onClick={function () { setPaletteOpen(true); }} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs">
              <Command className="w-3.5 h-3.5" /> Ctrl+K
            </button>
            <a href="https://github.com/Crypto-Funded/EverSquad" target="_blank" rel="noreferrer" className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300" title="GitHub Repository (MIT)">
              <GitBranch className="w-4 h-4" />
            </a>
          </div>
        </div>

        {pitStopBanner && (
          <div className="bg-emerald-500 text-slate-950 text-xs font-bold py-1.5 px-4 text-center animate-pulse">
            ⚡ {pitStopBanner}
          </div>
        )}
      </header>

      <main className="flex-1">
        {activeTab === "studio" ? (
          <Studio
            domain={domain}
            setDomain={setDomain}
            exhaustedIds={exhaustedIds}
            activeAgent={activeAgent}
            proxyUrl={proxyUrl}
            onAgentUsed={handleAgentUsed}
            onRelayTriggered={handleRelayTriggered}
            sharedProject={sharedProject}
            externalPrompt={externalPrompt}
            onClearExternalPrompt={function () { setExternalPrompt(""); }}
          />
        ) : (
          <FreeAIRadar onSelectAgentDomain={function (d) { setDomain(d); setActiveTab("studio"); }} />
        )}
      </main>

      {settingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={function () { setSettingsOpen(false); }}>
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl p-6 space-y-5 shadow-2xl" onClick={function (e) { e.stopPropagation(); }}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Moteurs IA & Miroir Cloudflare</h3>
              <button onClick={function () { setSettingsOpen(false); }} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-white flex items-center gap-2"><Cpu className="w-4 h-4 text-emerald-400" /> Vraie IA Locale WebGPU (WebLLM)</p>
                  <p className="text-xs text-slate-400 mt-0.5">Telecharge un mini modele Qwen-0.5B dans votre navigateur. 0 serveur, quota infini.</p>
                </div>
                {gpuStatus === "ready" ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400"><CheckCircle2 className="w-4 h-4" /> Pret</span>
                ) : (
                  <button onClick={handleEnableWebGpu} disabled={gpuStatus === "loading"} className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 text-xs font-bold">
                    {gpuStatus === "loading" ? "Chargement..." : "Activer WebGPU"}
                  </button>
                )}
              </div>
              {gpuProgress && <p className="text-[11px] text-sky-300 bg-slate-900 p-2 rounded-lg">{gpuProgress}</p>}
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <label className="text-sm font-semibold text-white block">URL de Miroir Proxy Cloudflare (Optionnel)</label>
              <p className="text-xs text-slate-400">Connectez votre Worker gratuit (`workers/eversquad-proxy.js`) pour router Groq, Gemini et OpenRouter :free sans exposer de cles.</p>
              <input
                value={proxyUrl}
                onChange={function (e) { setProxyUrl(e.target.value); }}
                placeholder="https://eversquad-mirror.votre-nom.workers.dev"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex justify-end">
              <button onClick={function () { setSettingsOpen(false); }} className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white">Fermer</button>
            </div>
          </div>
        </div>
      )}

      <CommandPalette isOpen={paletteOpen} onClose={function () { setPaletteOpen(false); }} onRunCommand={handleCommand} />
    </div>
  );
}
