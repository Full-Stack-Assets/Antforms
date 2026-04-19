#!/usr/bin/env tsx
/**
 * Local runner — triggers the pipeline, writes the MDX to content/posts/
 * and updates a local topic log in content/.topic-log.json.
 *
 * Usage:
 *   pnpm generate           # full run, writes to disk, does NOT commit
 *   pnpm generate --dry     # dry run, prints output only
 */
import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import { runPipeline } from '../src/lib/orchestrator/pipeline';
import type { TopicLog } from '../src/lib/orchestrator/types';
import { signature } from '../src/lib/orchestrator/score';

const LOG_PATH = path.join(process.cwd(), 'content', '.topic-log.json');
const POSTS_DIR = path.join(process.cwd(), 'content', 'posts');

async function loadLocalLog(): Promise<TopicLog> {
  try {
    const raw = await fs.readFile(LOG_PATH, 'utf8');
    return JSON.parse(raw);
  } catch {
    return { topics: [] };
  }
}

async function saveLocalLog(log: TopicLog): Promise<void> {
  await fs.mkdir(path.dirname(LOG_PATH), { recursive: true });
  await fs.writeFile(LOG_PATH, JSON.stringify(log, null, 2), 'utf8');
}

async function main() {
  const dryRun = process.argv.includes('--dry');
  const topicLog = await loadLocalLog();

  console.log(`→ Running pipeline (${dryRun ? 'DRY RUN' : 'writing to disk'})…`);
  console.log(`→ Existing topic log: ${topicLog.topics.length} entries\n`);

  const result = await runPipeline({ dryRun: true, topicLog });

  console.log('\n─── Result ───');
  console.log(JSON.stringify({ ...result, mdx: result.mdx ? `[${result.mdx.length} bytes]` : undefined }, null, 2));

  if (!result.ok || !result.slug || !result.mdx) {
    process.exit(result.error ? 1 : 0);
  }

  if (dryRun) {
    console.log('\n─── MDX preview (first 2000 chars) ───');
    console.log(result.mdx.slice(0, 2000));
    return;
  }

  await fs.mkdir(POSTS_DIR, { recursive: true });
  const filePath = path.join(POSTS_DIR, `${result.slug}.mdx`);
  await fs.writeFile(filePath, result.mdx, 'utf8');
  console.log(`\n✓ Wrote ${filePath}`);

  if (result.winner) {
    await saveLocalLog({
      topics: [
        ...topicLog.topics,
        {
          slug: result.slug,
          title: result.winner.title,
          url: result.winner.url,
          publishedAt: new Date().toISOString(),
          signature: signature(result.winner.title),
        },
      ],
    });
    console.log(`✓ Updated topic log`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
