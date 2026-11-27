import { useState, useEffect } from "react";
import { Zap, Radio, LayoutGrid, Command, Coins, ArrowRightLeft, GitBranch } from "lucide-react";
import Studio from "./components/Studio";
import FreeAIRadar from "./components/FreeAIRadar";
import CommandPalette from "./components/CommandPalette";
import { getAgentsForDomain, decodeProjectUrl } from "./utils/relayRouter";

export default function App() {
  const [activeTab, setActiveTab] = useState("studio");
  const [domain, setDomain] = useState("code");
  const [exhaustedIds, setExhaustedIds] = useState([]);
  const [activeAgent, setActiveAgent] = useState(function () {
    return getAgentsForDomain("code")[0];
  });
  const [pitStopBanner, setPitStopBanner] = useState(null);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [externalPrompt, setExternalPrompt] = useState("");
  const [sharedProject] = useState(function () {
    return decodeProjectUrl(window.location.hash);
  });

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
    const pool = getAgentsForDomain(domain).filter(function (a) { return exhaustedIds.indexOf(a.id) === -1; });
    setActiveAgent(pool[0] || getAgentsForDomain(domain)[0]);
  }, [domain, exhaustedIds]);

  function handleSimulateQuotaZero() {
    if (!activeAgent) return;
    const pool = getAgentsForDomain(domain);
    const nextExhausted = exhaustedIds.indexOf(activeAgent.id) === -1 ? exhaustedIds.concat([activeAgent.id]) : exhaustedIds;
    const remaining = pool.filter(function (a) { return nextExhausted.indexOf(a.id) === -1; });
    const nextAgent = remaining[0] || pool[pool.length - 1];

    if (remaining.length === 0) {
      setExhaustedIds([]);
      setPitStopBanner("Cycle complet reinitialise — tous les agents gratuits sont de nouveau prets !");
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
              MIT Open Source • Zero Login
            </span>
          </div>

          <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              onClick={function () { setActiveTab("studio"); }}
              className={"inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition " + (activeTab === "studio" ? "bg-emerald-500 text-slate-950" : "text-slate-300 hover:text-white")}
            >
              <LayoutGrid className="w-3.5 h-3.5" /> Studio
            </button>
            <button
              onClick={function () { setActiveTab("radar"); }}
              className={"inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition " + (activeTab === "radar" ? "bg-emerald-500 text-slate-950" : "text-slate-300 hover:text-white")}
            >
              <Radio className="w-3.5 h-3.5" /> Free AI Radar
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              <span>~{stats.savedDollars} $ economises • {stats.relays} relais • 0 coupure</span>
            </div>
            <button
              onClick={handleSimulateQuotaZero}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-semibold transition"
              title="Simuler un epuisement de quota pour tester le remplacement automatique"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" /> Simuler Quota 0%
            </button>
            <button
              onClick={function () { setPaletteOpen(true); }}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
            >
              <Command className="w-3.5 h-3.5" /> Ctrl+K
            </button>
            <a
              href="https://github.com/Crypto-Funded/EverSquad"
              target="_blank"
              rel="noreferrer"
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
              title="GitHub Repository (MIT)"
            >
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

      <CommandPalette
        isOpen={paletteOpen}
        onClose={function () { setPaletteOpen(false); }}
        onRunCommand={handleCommand}
      />
    </div>
  );
}
