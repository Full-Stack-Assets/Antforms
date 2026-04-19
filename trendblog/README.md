# The Dispatch

A self-hosted, zero-cost trend blog. One scheduled function runs daily, picks the highest-signal story from six sources, researches it, writes a structured MDX post, and commits it to GitHub. The Next.js site auto-deploys.

**Stack:** Next.js 15 · TinaCMS · Groq (free tier) · Brave Search · Pexels · GitHub Contents API · Vercel/Cloudflare.

**Monthly cost at steady state:** $0.

---

## How it works

```
 ┌─ Reddit ─┐
 │ HN      │
 │ DEV.to  │──▶ score ──▶ dedup ──▶ winner ──▶ research ──▶ Groq ──▶ MDX ──▶ git commit ──▶ deploy
 │ RSS     │   (pop + engagement + recency)    (Brave + scrape     (strict JSON
 │ YouTube │                                    + YT transcripts)   contract)
 └─ Brave ─┘
```

Each stage is its own module in `src/lib/orchestrator/` and can be tested independently. The `pipeline.ts` runner wires them together with per-stage timings and graceful fallbacks — a flaky source doesn't kill the run.

---

## Setup

### 1. Prereqs

- Node 20+
- `pnpm` (or npm/yarn — adjust commands accordingly)
- A GitHub repo to commit posts into (can be this same repo)

### 2. Install

```bash
pnpm install
cp .env.example .env.local
```

### 3. Get the free API keys

| Key | Where | Free tier |
|---|---|---|
| `GROQ_API_KEY` | https://console.groq.com/keys | Generous rate limits, ~30 RPM on llama-3.3-70b |
| `BRAVE_API_KEY` | https://api.search.brave.com/app/keys | 2,000 queries/month on the free plan |
| `PEXELS_API_KEY` | https://www.pexels.com/api/new/ | Unlimited for dev use |
| `GITHUB_TOKEN` | github.com → Settings → Developer settings → Fine-grained PAT | Scope: **Contents: Read/Write** on the blog repo only |
| `CRON_SECRET` | `openssl rand -hex 32` | — |

Fill them into `.env.local` along with `GITHUB_OWNER` / `GITHUB_REPO` / `GITHUB_BRANCH`.

### 4. Test locally

```bash
# Dry run — prints the generated post, doesn't write anything
pnpm generate --dry

# Real run — writes MDX to content/posts/ and updates content/.topic-log.json
pnpm generate

# Start the dev server
pnpm dev
```

Open http://localhost:3000. The seed post is visible out of the box; new posts show up as soon as `pnpm generate` writes them.

---

## Deploy

### Option A — Vercel (easiest)

1. Push this repo to GitHub.
2. Import the repo into Vercel.
3. Add every env var from `.env.local` to the Vercel project.
4. `vercel.json` already declares a daily cron at **12:00 UTC** (7am ET during DST, 8am ET in standard time). Adjust the schedule in `vercel.json` if you want a different tick.
5. Vercel's cron automatically sends `Authorization: Bearer $CRON_SECRET` — the route checks for it.

That's it. The next cron tick will generate a post, commit it via the GitHub API, and trigger a redeploy.

### Option B — Cloudflare Pages (zero-cost route)

Cloudflare Pages Functions have a **~30s CPU limit per request**, and this pipeline typically runs 30–90s end-to-end. Two paths:

**B1 — Recommended.** Deploy the Next.js blog to Pages for hosting, but move the cron to a **Cloudflare Workers Cron Trigger** (separate service, 15-min CPU budget on the paid Workers plan; 30s on free). Create a Worker that imports and calls `runPipeline()` from `src/lib/orchestrator/pipeline.ts`. The blog repo stays the same; only the scheduler moves.

**B2 — Scheduled GitHub Action.** Add a workflow that runs `pnpm tsx scripts/run-local.ts` on cron, commits the output, and pushes. No serverless CPU limits, and you get free logs. This is the most forgiving option.

Either way, keep Pages as the static host — it's free and fast.

### Option C — Self-host

`pnpm build && pnpm start` and point a reverse proxy at port 3000. Trigger the cron route with `curl`:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://your-domain/api/cron/generate
```

---

## TinaCMS editor (optional)

The schema in `tina/config.ts` matches the frontmatter the pipeline emits. Start the editor with:

```bash
pnpm dev   # Tina runs alongside Next via the `tinacms dev` wrapper
```

Then visit http://localhost:3000/admin/index.html. You can fix typos, tweak tags, or hand-write posts that follow the same structure.

For hosted editing (non-local contributors), sign up at tina.io for the free tier and fill in `NEXT_PUBLIC_TINA_CLIENT_ID` + `TINA_TOKEN`.

---

## The MDX contract

Every generated post follows this exact shape — the system prompt in `src/lib/orchestrator/generate.ts` enforces it, and the zod schema validates the JSON before writing:

1. **Lead paragraph** (no heading, 3–5 sentences)
2. `<Callout type="takeaway">` — one-sentence synthesis
3. `## What happened`
4. `## Why it matters`
5. `<ProsCons>` block with 3+ items per side
6. `## How to think about it`
7. `<Callout type="warning">` — *optional*, only if warranted
8. `## FAQ` with exactly 3 `<Question>` entries

All components are implemented in `src/components/mdx/index.tsx` and styled via `globals.css`'s `.prose-editorial` rules.

---

## Scoring

From `src/lib/orchestrator/score.ts`:

```
score = 0.5·popularity + 0.2·engagement + 0.3·recency
```

- **popularity** — log-scaled upvotes, normalized per-source, then weighted by source (HN=1.0, Reddit=0.85, DEV=0.75, Brave=0.9, RSS=0.7, YT=0.6)
- **engagement** — comments-to-upvotes ratio (capped at 1.0)
- **recency** — exponential decay with a **24h half-life**

Dedup uses a sorted-token fingerprint of the title, so "GPT-5 released today" and "Today: GPT-5 is out" collapse to the same signature. The topic log (`content/.topic-log.json`) is checked on every run and capped at 500 entries.

---

## Troubleshooting

**"no items from any source"** — all six sources failed. Usually a network blip; check logs. Try `pnpm generate --dry` after a minute.

**"all top candidates already covered"** — the scorer found winners, but every one has a signature that's already in the topic log. Either wait for new stories or delete recent entries from `content/.topic-log.json`.

**"no research content scrapable"** — the winner's URL and all three Brave results failed to scrape (timeouts, 403s, JS-only pages). The pipeline skips gracefully; try again next tick.

**Groq rate limit** — the free tier resets every minute. Should never hit it with one post/day, but if you're iterating, just wait.

**Cloudflare Pages timeouts** — see Option B above. Pages Functions can't run this pipeline end-to-end.

---

## Extending

- **Add a source:** drop a new file in `src/lib/sources/`, export a function returning `RawItem[]`, and add it to the `Promise.all` in `pipeline.ts`.
- **Tune the tone:** edit `SYSTEM_PROMPT` in `generate.ts`. The zod schema will catch anything structurally broken.
- **Change the niche:** adjust `SUBREDDITS` in `reddit.ts`, `BRAVE_QUERIES` in `bravenews.ts`, and `DEFAULT_FEEDS` in `rss.ts`.
- **Multiple posts per day:** call `runPipeline()` in a loop with different category filters, or run the cron multiple times.

---

## License

MIT — do whatever you want with it.
