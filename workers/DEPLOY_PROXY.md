# Deploy Your Free EverSquad Mirror Proxy (0 EUR / 100,000 req/day)

Anyone can host a free mirror on **Cloudflare Workers** in 3 minutes so visitors never need API keys or accounts:

1. Create a free account at [dash.cloudflare.com](https://dash.cloudflare.com) (no credit card needed).
2. Go to **Workers & Pages -> Create -> Create Worker** and name it `eversquad-mirror`.
3. Click **Edit code**, delete the default code, and paste the contents of `workers/eversquad-proxy.js`. Click **Deploy**.
4. Go to **Settings -> Variables and Secrets** and add one or more free API keys (as encrypted Secrets):
   - `GROQ_API_KEY` (from console.groq.com)
   - `GEMINI_API_KEY` (from aistudio.google.com)
   - `OPENROUTER_API_KEY` (from openrouter.ai — uses `openrouter/free` automatically)
   - `POLLINATIONS_API_KEY` (from enter.pollinations.ai)
5. Copy your Worker URL (e.g. `https://eversquad-mirror.yourname.workers.dev`) and paste it inside EverSquad under **Settings (Miroir & IA Locale)**!
