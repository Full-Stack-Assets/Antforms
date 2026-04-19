import { z } from 'zod';
import type { ResearchBundle, GeneratedPost } from './types';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

const PostSchema = z.object({
  title: z.string().min(20).max(120),
  description: z.string().min(60).max(200),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  category: z.string(),
  tags: z.array(z.string()).min(2).max(6),
  body: z.string().min(800),
});

const SYSTEM_PROMPT = `You are a senior tech writer producing a single blog post in MDX format for a developer audience.

Your output MUST be a valid JSON object with exactly these fields — nothing else, no prose, no code fences:
{
  "title": string,                // 60-100 chars, specific and concrete, no clickbait
  "description": string,          // 140-180 chars, SEO meta description
  "slug": string,                 // kebab-case, <= 60 chars
  "category": string,             // one of: "news", "tools", "engineering", "ai", "security", "opinion"
  "tags": string[],               // 2-6 lowercase tags
  "body": string                  // MDX body (see structural rules below)
}

BODY STRUCTURE (mandatory, in this order):

1. Opening paragraph (3-5 sentences) — hook + what happened + why it matters. No heading.

2. <Callout type="takeaway"> … </Callout> — a single sentence synthesizing the core point.

3. ## What happened
   Two or three tight paragraphs of factual reporting from the research.

4. ## Why it matters
   Analysis — stakes, implications, who's affected.

5. <ProsCons>
     <Pros>
       <li>…</li>
       <li>…</li>
       <li>…</li>
     </Pros>
     <Cons>
       <li>…</li>
       <li>…</li>
       <li>…</li>
     </Cons>
   </ProsCons>

6. ## How to think about it
   Practical guidance or a framework. Prose only.

7. <Callout type="warning"> … </Callout> — IF there are meaningful caveats, risks, or things the reader should NOT do. Omit this block if nothing warrants a warning.

8. ## FAQ
   <FAQ>
     <Question q="…">Answer paragraph.</Question>
     <Question q="…">Answer paragraph.</Question>
     <Question q="…">Answer paragraph.</Question>
   </FAQ>
   Exactly 3 questions, each a real question a reader would ask.

HARD RULES:
- Never invent quotes or attribute statements to people.
- Never invent specific numbers. If you cite a number, it must appear in the research.
- Do not paraphrase any single source closely — synthesize across sources.
- No filler like "in today's fast-paced world" or "in conclusion".
- No emoji.
- American English.
- Do not wrap the JSON in markdown code fences.`;

export async function generate(bundle: ResearchBundle): Promise<GeneratedPost> {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error('GROQ_API_KEY not set');

  const userPrompt = buildUserPrompt(bundle);

  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      temperature: 0.5,
      max_tokens: 4096,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Groq API error ${res.status}: ${text.slice(0, 500)}`);
  }

  const json = (await res.json()) as { choices: Array<{ message: { content: string } }> };
  const raw = json.choices[0]?.message?.content ?? '';
  const parsed = JSON.parse(raw);
  const validated = PostSchema.parse(parsed);

  const sources = [
    { title: bundle.winner.title, url: bundle.winner.url },
    ...bundle.articles.map((a) => ({ title: a.title, url: a.url })),
    ...bundle.transcripts.map((t) => ({
      title: `${t.title} (video)`,
      url: `https://www.youtube.com/watch?v=${t.videoId}`,
    })),
  ];

  return {
    ...validated,
    heroImage: { url: '', alt: '', credit: '', creditUrl: '' }, // populated by image stage
    sources,
  };
}

function buildUserPrompt(bundle: ResearchBundle): string {
  const { winner, articles, transcripts, related } = bundle;

  const articleBlock = articles
    .map(
      (a, i) => `### Source ${i + 1}: ${a.title}
URL: ${a.url}
${a.content.slice(0, 4000)}`
    )
    .join('\n\n');

  const transcriptBlock = transcripts.length
    ? '\n\n## Video transcripts\n' +
      transcripts
        .map((t) => `### ${t.title}\n${t.text.slice(0, 3000)}`)
        .join('\n\n')
    : '';

  const relatedBlock = related.length
    ? '\n\n## Related headlines (for context only, do not quote)\n' +
      related.map((r) => `- ${r.title} (${r.source})`).join('\n')
    : '';

  return `# Topic
**Winner headline**: ${winner.title}
**Source**: ${winner.source}
**URL**: ${winner.url}
**Published**: ${winner.publishedAt}

## Primary research
${articleBlock}
${transcriptBlock}
${relatedBlock}

Produce the JSON object now.`;
}
