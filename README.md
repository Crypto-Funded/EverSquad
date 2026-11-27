<div align="center">

# ⚡ EverSquad
**The Open-Source AI Studio that never stops. Zero login. Zero paywall. Automatic quota relay.**

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Live Studio](https://img.shields.io/badge/🚀_Launch-EverSquad_Studio-blue)](https://crypto-funded.github.io/EverSquad/)
[![Free AI Radar](https://img.shields.io/badge/📡_Radar-Hourly_Live_Check-orange)](https://github.com/Crypto-Funded/EverSquad/actions/workflows/radar.yml)
[![Cloudflare Mirror](https://img.shields.io/badge/⚡_Cloudflare_Worker-0_EUR_Proxy-F38020)](workers/DEPLOY_PROXY.md)
[![PRs Welcome](https://img.shields.io/badge/PRs-Welcome-brightgreen.svg)](CONTRIBUTING.md)

</div>

---

## 💡 Why EverSquad?
Most AI tools lock you behind accounts, subscriptions, or sudden rate-limit walls right in the middle of building your project.

**EverSquad** brings together free AI capabilities across every domain (**Code, Writing, Design, Data, Marketing**) in a single **Split-Screen Canvas Studio**—with **zero sign-up required**.

### ✨ Standout Features (v1.1)
- 🔓 **100% Zero Friction:** No login, no credit card. Your projects, checkpoints, and notes stay private in `localStorage`.
- 🏎️ **3-Tier Zero-Downtime Relay:**
  1. **Cloudflare Free Mirror** (`workers/eversquad-proxy.js`): Automatically rotates across **Groq, Gemini Free Tier, OpenRouter (`openrouter/free`), and Pollinations** on any `429` error.
  2. **In-Browser Real AI (`WebGPU WebLLM` + Chrome Built-in AI):** Runs `Qwen2.5-0.5B` directly on your GPU with infinite quota and zero server.
  3. **Instant Studio Fallback:** Guarantees your workflow is never interrupted.
- 🤝 **Cross-Agent Debate Mode:** Toggle **Mode Debat** to let a second agent review, debug, and polish the first output automatically.
- 📡 **Live 24/7 Free AI Radar:** GitHub Actions checks public AI endpoints every hour and updates `radar-status.json` live.
- 🔗 **Serverless Link Sharing:** Share entire projects via compressed `#project=` URLs with zero database.

---

## 🔄 How the Relay Works
```text
[User Goal] ─▶ [Cloud Mirror (Groq/Gemini/OpenRouter)] ─(OK)─▶ [Live Canvas]
                        │
                (429 / Offline)
                        ▼
          [Browser WebGPU / Built-in AI] ─▶ Continues seamlessly!
                        │
                        ▼
          [Local Studio Fallback] ─▶ Guaranteed 0-downtime output
```

---

## ⚡ Deploy Your Own Free Mirror (Hydra Architecture)
Want to run free-tier cloud keys for your community with **0 EUR** server cost (100,000 requests/day free on Cloudflare Workers)?
Follow the 3-minute guide in **[workers/DEPLOY_PROXY.md](workers/DEPLOY_PROXY.md)**.

## 🗺️ Living Roadmap
- [x] **v1.0** — Canvas Studio, Local Memory, Checkpoints, `Ctrl+K` Palette & Hourly GitHub Radar
- [x] **v1.1** — Real In-Browser WebGPU AI (`WebLLM`), Debate Mode & Cloudflare Mirror Proxy
- [ ] **v1.2** — Pyodide Python sandbox execution directly inside the Canvas
- [ ] **v1.3** — Community Squad Marketplace via GitHub PRs

## 🤝 Contributing
Know a free AI API or model? **[Submit it in 1 minute](../../issues/new?template=propose-agent.yml)** or edit `registry/agents.json`. See [CONTRIBUTING.md](CONTRIBUTING.md).

## 📜 License
MIT License — Built for everyone, forever free.
