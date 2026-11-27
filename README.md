<div align="center">

# EverSquad
**The Open-Source AI Studio that never stops. Zero login. Zero paywall. Automatic quota relay.**

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Live Studio](https://img.shields.io/badge/Launch-EverSquad_Studio-blue)](https://crypto-funded.github.io/EverSquad/)
[![PRs Welcome](https://img.shields.io/badge/PRs-Welcome-brightgreen.svg)](CONTRIBUTING.md)

</div>

---

## Why EverSquad?
Most AI tools lock you behind accounts, paywalls, or sudden limit walls in the middle of your project.

**EverSquad** aggregates free AI agents across all domains (Code, Writing, Design, Data, Marketing) into a live **Canvas Studio**.
If an active agent hits a rate limit (`429`) or runs out of quota, EverSquad automatically compresses the current context and hands the baton to another free agent in the same domain—without interrupting your project.

### Key Features
- **Zero Friction:** No account, no login, no credit card. Saved locally in your browser.
- **Pit-Stop Quota Relay:** Seamless automatic switching between free agents.
- **Live Canvas Studio:** Live HTML/Markdown preview, checkpoints, `Ctrl+K` palette, and URL sharing.
- **Live Free AI Radar:** Automated hourly uptime & latency monitor via GitHub Actions.

## Living Roadmap
- [x] **v1.0** — Canvas Studio UI, Local Memory, Pit-Stop Relay & `Ctrl+K` Palette
- [x] **v1.0** — Automated Hourly Free AI Radar (GitHub Actions)
- [ ] **v1.1** — WebLLM / WebGPU Local Browser Fallback (100% offline infinite quota)
- [ ] **v1.2** — Pyodide integration (run Python directly in the browser)
- [ ] **v1.3** — Cross-Agent Debate Mode (2 free agents reviewing each other)

## Contributing
Anyone can propose a new free AI agent via Issues or add one in `registry/agents.json`. See [CONTRIBUTING.md](CONTRIBUTING.md).

## License
MIT License — Free for everyone, forever.
