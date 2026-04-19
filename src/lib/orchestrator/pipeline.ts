import { fetchReddit } from '../sources/reddit';
import { fetchHackerNews } from '../sources/hackernews';
import { fetchDevTo } from '../sources/devto';
import { fetchRss } from '../sources/rss';
import { fetchYouTube } from '../sources/youtube';
import { fetchBraveNews } from '../sources/bravenews';
import { score, dedupe, pickWinner, signature } from './score';
import { research } from './research';
import { generate } from './generate';
import { pickImage } from './image';
import { serialize } from './serialize';
import { loadTopicLog, saveTopicLog, commitPost } from './github';
import type { RawItem, TopicLog } from './types';

export interface PipelineResult {
  ok: boolean;
  slug?: string;
  path?: string;
  winner?: { title: string; url: string; score: number };
  skipped?: string;
  error?: string;
  timings: Record<string, number>;
}

export interface PipelineOptions {
  /** If true, don't commit to GitHub — return the MDX content instead. */
  dryRun?: boolean;
  /** Override the topic log (useful for local runs). */
  topicLog?: TopicLog;
}

export async function runPipeline(opts: PipelineOptions = {}): Promise<PipelineResult & { mdx?: string }> {
  const timings: Record<string, number> = {};
  const t = (label: string) => {
    const start = Date.now();
    return () => (timings[label] = Date.now() - start);
  };

  try {
    // ── 1. Gather ─────────────────────────────────────────────────
    const doneGather = t('gather');
    const [reddit, hn, devto, rss, yt, brave] = await Promise.all([
      fetchReddit().catch((e) => { console.warn('reddit', e); return [] as RawItem[]; }),
      fetchHackerNews().catch((e) => { console.warn('hn', e); return [] as RawItem[]; }),
      fetchDevTo().catch((e) => { console.warn('devto', e); return [] as RawItem[]; }),
      fetchRss().catch((e) => { console.warn('rss', e); return [] as RawItem[]; }),
      fetchYouTube().catch((e) => { console.warn('yt', e); return [] as RawItem[]; }),
      fetchBraveNews().catch((e) => { console.warn('brave', e); return [] as RawItem[]; }),
    ]);
    const allItems = [...reddit, ...hn, ...devto, ...rss, ...yt, ...brave];
    doneGather();

    if (allItems.length === 0) {
      return { ok: false, skipped: 'no items from any source', timings };
    }

    // ── 2. Score & pick ───────────────────────────────────────────
    const doneScore = t('score');
    const scored = dedupe(score(allItems));
    const topicLog = opts.topicLog ?? (opts.dryRun ? { topics: [] } : await loadTopicLog());
    const winner = pickWinner(scored, topicLog);
    doneScore();

    if (!winner) {
      return { ok: false, skipped: 'all top candidates already covered', timings };
    }

    // ── 3. Research ──────────────────────────────────────────────
    const doneResearch = t('research');
    const bundle = await research(winner, allItems);
    doneResearch();

    if (bundle.articles.length === 0 && bundle.transcripts.length === 0) {
      return {
        ok: false,
        skipped: `no research content scrapable for: ${winner.title}`,
        winner: { title: winner.title, url: winner.url, score: winner.score },
        timings,
      };
    }

    // ── 4. Generate ──────────────────────────────────────────────
    const doneGen = t('generate');
    const post = await generate(bundle);
    post.heroImage = await pickImage(post);
    const mdx = serialize(post);
    doneGen();

    if (opts.dryRun) {
      return {
        ok: true,
        slug: post.slug,
        winner: { title: winner.title, url: winner.url, score: winner.score },
        mdx,
        timings,
      };
    }

    // ── 5. Commit ────────────────────────────────────────────────
    const doneCommit = t('commit');
    const path = await commitPost(post, mdx);
    await saveTopicLog({
      topics: [
        ...topicLog.topics,
        {
          slug: post.slug,
          title: winner.title,
          url: winner.url,
          publishedAt: new Date().toISOString(),
          signature: signature(winner.title),
        },
      ],
    });
    doneCommit();

    return {
      ok: true,
      slug: post.slug,
      path,
      winner: { title: winner.title, url: winner.url, score: winner.score },
      timings,
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
      timings,
    };
  }
}
