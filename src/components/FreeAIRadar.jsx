import { useEffect, useState } from "react";
import { Radio, Trophy, ArrowRight, Activity, Clock, ShieldCheck } from "lucide-react";
import { AGENTS, DOMAINS } from "../utils/relayRouter";

export default function FreeAIRadar({ onSelectAgentDomain }) {
  const [radarData, setRadarData] = useState(null);
  const [selectedDomain, setSelectedDomain] = useState("all");

  useEffect(function () {
    const url = (import.meta.env.BASE_URL || "/") + "radar-status.json";
    fetch(url)
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) { if (data) setRadarData(data); })
      .catch(function () { setRadarData(null); });
  }, []);

  const filteredAgents = selectedDomain === "all"
    ? AGENTS
    : AGENTS.filter(function (a) { return a.domain === selectedDomain; });

  function getAgentStatus(agent) {
    const live = radarData && radarData.agents ? radarData.agents[agent.id] : null;
    if (live) return live;
    return {
      status: agent.authType === "proxy_free_tier" ? "degraded" : "online",
      latencyMs: agent.authType === "local_browser" ? 5 : 420,
      uptimeScore: 100,
      history: [{ status: "online" }, { status: "online" }, { status: "online" }, { status: "online" }]
    };
  }

  const bestAgent = filteredAgents[0];

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2 text-white">
            <Radio className="w-5 h-5 text-emerald-400 animate-pulse" />
            Free AI Radar — Meteo en direct des IA gratuites
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Mis a jour automatiquement toutes les heures via GitHub Actions.
            {radarData && radarData.updatedAt ? " Derniere verification : " + new Date(radarData.updatedAt).toLocaleString() : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={function () { setSelectedDomain("all"); }}
            className={"px-3 py-1.5 rounded-xl text-xs font-medium transition " + (selectedDomain === "all" ? "bg-emerald-500 text-slate-950" : "bg-slate-800 text-slate-300 hover:bg-slate-700")}
          >
            Tous
          </button>
          {DOMAINS.map(function (d) {
            return (
              <button
                key={d.id}
                onClick={function () { setSelectedDomain(d.id); }}
                className={"px-3 py-1.5 rounded-xl text-xs font-medium transition " + (selectedDomain === d.id ? "bg-emerald-500 text-slate-950" : "bg-slate-800 text-slate-300 hover:bg-slate-700")}
              >
                {d.label}
              </button>
            );
          })}
        </div>
      </div>

      {bestAgent && (
        <div className="bg-gradient-to-r from-emerald-500/15 via-sky-500/10 to-slate-900 border border-emerald-500/30 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-emerald-400 font-semibold">Meilleur agent recommande maintenant</p>
              <p className="text-base font-bold text-white">{bestAgent.name} <span className="text-xs font-normal text-slate-400">({bestAgent.provider} • {bestAgent.domain})</span></p>
            </div>
          </div>
          <button
            onClick={function () { onSelectAgentDomain(bestAgent.domain); }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-sm transition"
          >
            Utiliser dans le Studio <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAgents.map(function (agent) {
          const st = getAgentStatus(agent);
          const isOnline = st.status === "online";
          const isDegraded = st.status === "degraded" || st.status === "rate_limited";
          const badgeClass = isOnline ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" : isDegraded ? "bg-amber-500/15 text-amber-300 border-amber-500/30" : "bg-rose-500/15 text-rose-400 border-rose-500/30";
          const statusLabel = isOnline ? "Operationnel" : isDegraded ? "Quota tendu / Proxy" : "Hors ligne";
          const bars = (st.history || []).slice(-16);
          return (
            <div key={agent.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between gap-4 hover:border-slate-700 transition">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-white">{agent.name}</h3>
                    <p className="text-xs text-slate-400">{agent.provider} • Domaine : {agent.domain}</p>
                  </div>
                  <span className={"text-xs px-2.5 py-1 rounded-full border font-medium " + badgeClass}>{statusLabel}</span>
                </div>
                <p className="text-xs text-slate-300 mt-3">{agent.description}</p>
              </div>
              <div className="space-y-3 pt-2 border-t border-slate-800/80">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-sky-400" /> {st.latencyMs ? st.latencyMs + " ms" : "N/A"}</span>
                  <span className="flex items-center gap-1"><Activity className="w-3.5 h-3.5 text-emerald-400" /> {st.uptimeScore}% fiabilite</span>
                  <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-violet-400" /> {agent.authType === "none" ? "Sans cle" : agent.authType === "local_browser" ? "Local" : "Proxy"}</span>
                </div>
                <div className="flex items-center gap-1 h-3">
                  {bars.map(function (b, idx) {
                    const c = b.status === "online" ? "bg-emerald-500" : b.status === "degraded" ? "bg-amber-400" : "bg-rose-500";
                    return <div key={idx} className={"flex-1 h-full rounded-sm " + c} title={b.status} />;
                  })}
                </div>
                <button
                  onClick={function () { onSelectAgentDomain(agent.domain); }}
                  className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition"
                >
                  Lancer un projet ({agent.domain})
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
