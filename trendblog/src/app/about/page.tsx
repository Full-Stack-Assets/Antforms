import Link from 'next/link';

export const metadata = { title: 'About' };

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <div className="mb-10 border-b-2 border-ink pb-6">
        <div className="text-xs uppercase tracking-[0.3em] text-muted">About</div>
        <h1 className="mt-2 font-display text-5xl font-black">How this works</h1>
      </div>

      <div className="prose-editorial">
        <p>
          <strong>The Dispatch</strong> is an experiment in what happens when you point a small,
          opinionated pipeline at the firehose of tech news and let it write one post a day.
        </p>

        <h2>The pipeline</h2>
        <p>Every morning at 7am, a scheduled function does five things:</p>
        <ol>
          <li><strong>Gather.</strong> Pulls headlines from Reddit, Hacker News, DEV.to, a handful of RSS feeds, YouTube, and Brave News.</li>
          <li><strong>Score.</strong> Each candidate gets a composite score — popularity, engagement, recency — and anything that's already been covered is filtered out.</li>
          <li><strong>Research.</strong> The winner gets Brave-searched, the top three articles scraped, and any relevant YouTube transcripts pulled.</li>
          <li><strong>Write.</strong> All of it is handed to a Groq-hosted LLM with an explicit MDX contract: an opening, a takeaway, what-happened/why-it-matters sections, a pros/cons block, a how-to-think-about-it section, and a three-question FAQ.</li>
          <li><strong>Publish.</strong> The MDX file, with a Pexels banner and frontmatter, is committed to GitHub. Cloudflare Pages notices and deploys.</li>
        </ol>

        <h2>The caveats</h2>
        <p>
          Automated writing has a quality floor, not a ceiling. The pipeline will occasionally pick
          a boring topic, miss nuance, or get a detail subtly wrong. Every post links every source
          at the bottom — if something doesn't add up, go read the primaries.
        </p>

        <h2>The stack</h2>
        <p>
          Next.js, TinaCMS, Cloudflare Pages, Groq's free tier, and a lot of free public APIs.
          Total running cost: $0/month.
        </p>

        <p className="mt-8">
          <Link href="/" className="text-accent underline">← Back to the front page</Link>
        </p>
      </div>
    </div>
  );
}
