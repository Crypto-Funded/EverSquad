import { useState, useEffect } from "react";
import { Sparkles, Send, RefreshCw, Download, Share2, History, Eye, Code, Brain, Upload, Check, ShieldAlert, ArrowRightLeft } from "lucide-react";
import { DOMAINS, SQUADS, getAgentsForDomain, enhancePrompt, executeWithRelay, encodeProjectUrl } from "../utils/relayRouter";

export default function Studio({ domain, setDomain, exhaustedIds, activeAgent, onAgentUsed, onRelayTriggered, sharedProject, externalPrompt, onClearExternalPrompt }) {
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState([
    { role: "system", text: "Bienvenue sur EverSquad ! Choisissez votre domaine ou une Squad ci-dessous, decrivez votre projet et les agents gratuits collaborent sans inscription." }
  ]);
  const [deliverable, setDeliverable] = useState("");
  const [deliverableType, setDeliverableType] = useState("markdown");
  const [rightTab, setRightTab] = useState("preview");
  const [checkpoints, setCheckpoints] = useState([]);
  const [localMemory, setLocalMemory] = useState(function () {
    return localStorage.getItem("eversquad_memory") || "";
  });
  const [copiedLink, setCopiedLink] = useState(false);

  const domainAgents = getAgentsForDomain(domain);

  useEffect(function () {
    if (sharedProject) {
      if (sharedProject.domain) setDomain(sharedProject.domain);
      if (sharedProject.deliverable) setDeliverable(sharedProject.deliverable);
      if (sharedProject.type) setDeliverableType(sharedProject.type);
      setMessages(function (prev) {
        return prev.concat([{ role: "system", text: "Projet partage charge depuis le lien magique !" }]);
      });
    }
  }, [sharedProject, setDomain]);

  useEffect(function () {
    localStorage.setItem("eversquad_memory", localMemory);
  }, [localMemory]);

  useEffect(function () {
    if (externalPrompt) {
      handleRunPrompt(externalPrompt);
      onClearExternalPrompt();
    }
  }, [externalPrompt]);

  async function handleRunPrompt(customPrompt) {
    const textToSend = (typeof customPrompt === "string" ? customPrompt : prompt).trim();
    if (!textToSend || isLoading) return;
    if (typeof customPrompt !== "string") setPrompt("");
    setIsLoading(true);

    setMessages(function (prev) { return prev.concat([{ role: "user", text: textToSend }]); });

    const result = await executeWithRelay({
      domain: domain,
      prompt: textToSend,
      currentDeliverable: deliverable,
      localMemory: localMemory,
      exhaustedIds: exhaustedIds,
      onRelay: function (ev) {
        onRelayTriggered(ev);
        setMessages(function (prev) {
          return prev.concat([{
            role: "relay",
            text: "Relais Pit-Stop : " + ev.from.name + " -> " + ev.to.name + " (" + ev.reason + ")"
          }]);
        });
      }
    });

    onAgentUsed(result.agent);
    setDeliverable(result.deliverable);
    setDeliverableType(result.type);
    setCheckpoints(function (prev) {
      return prev.concat([{
        id: Date.now(),
        label: "v" + (prev.length + 1) + " • " + result.agent.name,
        deliverable: result.deliverable,
        type: result.type
      }]);
    });
    setMessages(function (prev) {
      return prev.concat([{ role: "agent", agentName: result.agent.name, text: result.rawText }]);
    });
    setIsLoading(false);
  }

  function handleEnhance() {
    if (!prompt.trim()) return;
    setPrompt(enhancePrompt(prompt, domain));
  }

  function handleFileUpload(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (ev) {
      const content = String(ev.target.result || "").slice(0, 4000);
      setLocalMemory(function (prev) {
        return (prev ? prev + "\n\n" : "") + "--- Fichier : " + file.name + " ---\n" + content;
      });
    };
    reader.readAsText(file);
  }

  function handleExport() {
    if (!deliverable) return;
    if (deliverableType === "image") {
      window.open(deliverable, "_blank");
      return;
    }
    const ext = deliverableType === "html" ? "html" : "md";
    const blob = new Blob([deliverable], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "eversquad-project." + ext;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleShare() {
    if (!deliverable) return;
    const encoded = encodeProjectUrl({ domain: domain, deliverable: deliverable.slice(0, 6000), type: deliverableType });
    const shareUrl = window.location.origin + window.location.pathname + "#project=" + encoded;
    window.location.hash = "project=" + encoded;
    if (navigator.clipboard) navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(function () { setCopiedLink(false); }, 2500);
  }

  return (
    <div className="max-w-7xl mx-auto p-3 sm:p-4 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 rounded-2xl p-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 px-2">Domaine :</span>
          {DOMAINS.map(function (d) {
            return (
              <button
                key={d.id}
                onClick={function () { setDomain(d.id); }}
                className={"px-3 py-1.5 rounded-xl text-xs font-semibold transition " + (domain === d.id ? "bg-emerald-500 text-slate-950" : "bg-slate-800 text-slate-300 hover:bg-slate-700")}
              >
                {d.label}
              </button>
            );
          })}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {SQUADS.filter(function (s) { return s.domain === domain; }).map(function (sq) {
            return (
              <span key={sq.id} className="text-xs px-2.5 py-1 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-300">
                Squad : {sq.name} ({sq.roles.join(" + ")})
              </span>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Panneau Gauche : Orchestrateur & Relais */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col h-[74vh]">
          <div className="p-3 border-b border-slate-800 bg-slate-900/90 rounded-t-2xl">
            <p className="text-xs font-semibold text-slate-400 mb-2">File de Relais du domaine ({domain}) :</p>
            <div className="flex flex-wrap gap-1.5">
              {domainAgents.map(function (a) {
                const isExhausted = exhaustedIds.indexOf(a.id) !== -1;
                const isCurrent = activeAgent && activeAgent.id === a.id;
                const cls = isExhausted
                  ? "bg-rose-500/10 text-rose-400 border-rose-500/30 line-through"
                  : isCurrent
                    ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/40"
                    : "bg-slate-800 text-slate-400 border-slate-700";
                return (
                  <span key={a.id} className={"text-[11px] px-2 py-1 rounded-lg border " + cls}>
                    {isCurrent ? "● " : ""}{a.name}
                  </span>
                );
              })}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.map(function (m, idx) {
              if (m.role === "relay") {
                return (
                  <div key={idx} className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
                    <ArrowRightLeft className="w-4 h-4 shrink-0" />
                    <span>{m.text}</span>
                  </div>
                );
              }
              const isUser = m.role === "user";
              return (
                <div key={idx} className={"p-3 rounded-xl text-sm " + (isUser ? "bg-emerald-500/15 border border-emerald-500/30 text-slate-100 ml-6" : "bg-slate-800/80 border border-slate-700/60 text-slate-200 mr-4")}>
                  {m.agentName && <p className="text-[11px] font-semibold text-emerald-400 mb-1">{m.agentName}</p>}
                  <p className="whitespace-pre-wrap leading-relaxed">{m.text}</p>
                </div>
              );
            })}
            {isLoading && (
              <div className="flex items-center gap-2 text-xs text-emerald-400 p-2">
                <RefreshCw className="w-4 h-4 animate-spin" /> Construction en cours par les agents gratuits...
              </div>
            )}
          </div>

          <div className="p-3 border-t border-slate-800 space-y-2">
            <textarea
              rows={3}
              value={prompt}
              onChange={function (e) { setPrompt(e.target.value); }}
              onKeyDown={function (e) {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleRunPrompt();
                }
              }}
              placeholder="Decrivez ce que vous voulez construire (ex: Un site vitrine pour une boulangerie)..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 resize-none"
            />
            <div className="flex items-center justify-between gap-2">
              <button
                onClick={handleEnhance}
                type="button"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-sky-300 transition"
              >
                <Sparkles className="w-3.5 h-3.5" /> Ameliorer ma demande
              </button>
              <button
                onClick={function () { handleRunPrompt(); }}
                disabled={isLoading || !prompt.trim()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 font-semibold text-xs transition"
              >
                <Send className="w-3.5 h-3.5" /> Construire
              </button>
            </div>
          </div>
        </div>

        {/* Panneau Droit : Canvas Studio */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col h-[74vh]">
          <div className="p-2.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1">
              <button
                onClick={function () { setRightTab("preview"); }}
                className={"inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition " + (rightTab === "preview" ? "bg-slate-800 text-emerald-400" : "text-slate-400 hover:text-white")}
              >
                <Eye className="w-3.5 h-3.5" /> Apercu
              </button>
              <button
                onClick={function () { setRightTab("source"); }}
                className={"inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition " + (rightTab === "source" ? "bg-slate-800 text-emerald-400" : "text-slate-400 hover:text-white")}
              >
                <Code className="w-3.5 h-3.5" /> Source
              </button>
              <button
                onClick={function () { setRightTab("memory"); }}
                className={"inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition " + (rightTab === "memory" ? "bg-slate-800 text-emerald-400" : "text-slate-400 hover:text-white")}
              >
                <Brain className="w-3.5 h-3.5" /> Memoire Locale
              </button>
            </div>

            <div className="flex items-center gap-2">
              {checkpoints.length > 0 && (
                <select
                  onChange={function (e) {
                    const cp = checkpoints.find(function (c) { return String(c.id) === e.target.value; });
                    if (cp) { setDeliverable(cp.deliverable); setDeliverableType(cp.type); }
                  }}
                  className="bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-xl px-2.5 py-1.5"
                  defaultValue=""
                >
                  <option value="" disabled>Checkpoints ({checkpoints.length})</option>
                  {checkpoints.map(function (c) {
                    return <option key={c.id} value={c.id}>{c.label}</option>;
                  })}
                </select>
              )}
              <button onClick={handleExport} disabled={!deliverable} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-xs text-slate-200">
                <Download className="w-3.5 h-3.5" /> Exporter
              </button>
              <button onClick={handleShare} disabled={!deliverable} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 disabled:opacity-40 text-xs text-emerald-300">
                {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
                {copiedLink ? "Lien copie !" : "Partager"}
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-auto p-4">
            {rightTab === "preview" && (
              deliverable ? (
                deliverableType === "html" ? (
                  <iframe title="EverSquad Live Preview" srcDoc={deliverable} sandbox="allow-scripts" className="w-full h-full min-h-[450px] bg-white rounded-xl border border-slate-700" />
                ) : deliverableType === "image" ? (
                  <div className="flex flex-col items-center justify-center h-full gap-3">
                    <img src={deliverable} alt="EverSquad Generated" className="max-h-[460px] rounded-xl border border-slate-700 shadow-lg" />
                  </div>
                ) : (
                  <div className="prose prose-invert max-w-none bg-slate-950/60 border border-slate-800 rounded-xl p-5 whitespace-pre-wrap text-sm text-slate-200 leading-relaxed">
                    {deliverable}
                  </div>
                )
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 space-y-3">
                  <History className="w-10 h-10 text-slate-700" />
                  <p className="text-sm max-w-md">Votre projet vivant apparaitra ici en direct (aperçu HTML interactif, visuel ou document). Tapez <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-xs">Ctrl+K</kbd> pour des idees rapides !</p>
                </div>
              )
            )}

            {rightTab === "source" && (
              <textarea
                value={deliverable}
                onChange={function (e) { setDeliverable(e.target.value); }}
                placeholder="Le code ou texte genere apparaitra ici. Vous pouvez aussi le modifier librement."
                className="w-full h-full bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs text-emerald-300 focus:outline-none resize-none"
              />
            )}

            {rightTab === "memory" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-xl p-3">
                  <div className="flex items-center gap-2 text-xs text-slate-300">
                    <ShieldAlert className="w-4 h-4 text-emerald-400" />
                    Vos notes restent 100% privees dans votre navigateur (aucun compte, aucun serveur).
                  </div>
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 cursor-pointer">
                    <Upload className="w-3.5 h-3.5" /> Importer .txt/.md
                    <input type="file" accept=".txt,.md,.json,.csv" onChange={handleFileUpload} className="hidden" />
                  </label>
                </div>
                <textarea
                  rows={14}
                  value={localMemory}
                  onChange={function (e) { setLocalMemory(e.target.value); }}
                  placeholder="Collez ici votre profil, vos cours, votre charte ou notes de projet. Chaque agent utilisera automatiquement ce contexte..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
