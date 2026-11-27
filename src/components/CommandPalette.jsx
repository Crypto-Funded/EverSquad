import { useEffect, useState } from "react";
import { Search, Zap, Code2, PenTool, Palette, BarChart3, Radio, Share2, X } from "lucide-react";

const COMMANDS = [
  { id: "cmd-landing", label: "Creer une landing page moderne", domain: "code", prompt: "Cree une landing page moderne et epuree avec section Hero, 3 avantages et bouton d action", icon: Code2 },
  { id: "cmd-write", label: "Rediger un post ou article percutant", domain: "writing", prompt: "Redige un article structure et engageant avec accroche, 3 points cles et conclusion", icon: PenTool },
  { id: "cmd-design", label: "Generer un concept visuel / illustration", domain: "design", prompt: "Futuristic clean workspace studio with glowing holographic AI assistants, minimalist", icon: Palette },
  { id: "cmd-data", label: "Synthetiser mes notes locales en tableau", domain: "data", prompt: "Analyse mes notes locales et cree une synthese avec tableau comparatif et priorites", icon: BarChart3 },
  { id: "cmd-relay", label: "Tester le Relais Pit-Stop (Simuler Quota 0%)", action: "simulate_relay", icon: Zap },
  { id: "cmd-radar", label: "Ouvrir le Free AI Radar (Meteo IA)", action: "open_radar", icon: Radio },
  { id: "cmd-share", label: "Copier le lien de partage du projet", action: "share_project", icon: Share2 }
];

export default function CommandPalette({ isOpen, onClose, onRunCommand }) {
  const [query, setQuery] = useState("");

  useEffect(function () {
    function onKeyDown(e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (isOpen) onClose();
        else onRunCommand({ action: "toggle_palette" });
      } else if (e.key === "Escape" && isOpen) {
        onClose();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return function () { window.removeEventListener("keydown", onKeyDown); };
  }, [isOpen, onClose, onRunCommand]);

  if (!isOpen) return null;

  const filtered = COMMANDS.filter(function (c) {
    return c.label.toLowerCase().indexOf(query.toLowerCase()) !== -1;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden" onClick={function (e) { e.stopPropagation(); }}>
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-800">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            autoFocus
            value={query}
            onChange={function (e) { setQuery(e.target.value); }}
            placeholder="Tapez une commande rapide..."
            className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
          />
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-2 max-h-80 overflow-y-auto">
          {filtered.map(function (cmd) {
            const Icon = cmd.icon;
            return (
              <button
                key={cmd.id}
                onClick={function () { onRunCommand(cmd); onClose(); }}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-sm text-slate-200 hover:bg-emerald-500/10 hover:text-emerald-300 transition"
              >
                <span className="flex items-center gap-3">
                  <Icon className="w-4 h-4 text-emerald-400" />
                  {cmd.label}
                </span>
                {cmd.domain && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">{cmd.domain}</span>
                )}
              </button>
            );
          })}
          {filtered.length === 0 && (
            <p className="text-center text-xs text-slate-500 py-6">Aucune commande trouvee.</p>
          )}
        </div>
      </div>
    </div>
  );
}
