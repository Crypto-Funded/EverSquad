import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const REGISTRY_PATH = join(process.cwd(), "registry", "agents.json");
const OUTPUT_DIR = join(process.cwd(), "public");
const OUTPUT_PATH = join(OUTPUT_DIR, "radar-status.json");

const agents = JSON.parse(readFileSync(REGISTRY_PATH, "utf-8"));
let previousData = { agents: {} };
if (existsSync(OUTPUT_PATH)) {
  try { previousData = JSON.parse(readFileSync(OUTPUT_PATH, "utf-8")); } catch { previousData = { agents: {} }; }
}

async function checkAgent(agent) {
  if (!agent.testUrl || agent.authType === "local_browser") {
    return { status: "online", latencyMs: 5, httpCode: 200, note: "Client-side local engine" };
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  const start = Date.now();
  try {
    const res = await fetch(agent.testUrl, {
      method: "GET",
      signal: controller.signal,
      headers: { "User-Agent": "EverSquad-Radar/1.0" }
    });
    const latencyMs = Date.now() - start;
    clearTimeout(timeout);
    if (res.status === 429) return { status: "rate_limited", latencyMs, httpCode: 429 };
    if (res.ok || res.status === 401 || res.status === 403) {
      return { status: latencyMs > 2500 ? "degraded" : "online", latencyMs, httpCode: res.status };
    }
    return { status: "down", latencyMs, httpCode: res.status };
  } catch (err) {
    clearTimeout(timeout);
    return { status: "down", latencyMs: null, httpCode: 0, note: err.name === "AbortError" ? "Timeout > 5s" : "Network error" };
  }
}

async function run() {
  const checkedAt = new Date().toISOString();
  const results = {};
  for (const agent of agents) {
    const check = await checkAgent(agent);
    const prevHistory = previousData.agents?.[agent.id]?.history || [];
    const newHistory = [...prevHistory.slice(-23), { time: checkedAt, status: check.status, latencyMs: check.latencyMs }];
    const onlineCount = newHistory.filter(h => h.status === "online" || h.status === "degraded").length;
    const uptimeScore = Math.round((onlineCount / newHistory.length) * 100);
    results[agent.id] = { id: agent.id, name: agent.name, domain: agent.domain, status: check.status, latencyMs: check.latencyMs, uptimeScore, lastChecked: checkedAt, history: newHistory };
  }
  mkdirSync(OUTPUT_DIR, { recursive: true });
  writeFileSync(OUTPUT_PATH, JSON.stringify({ updatedAt: checkedAt, agents: results }, null, 2));
  console.log("EverSquad Radar updated at " + checkedAt + " (" + Object.keys(results).length + " agents)");
}

run();
