import Link from 'next/link';
import { listPosts } from '@/lib/posts';

export const revalidate = 300; // re-check content every 5 minutes

export default async function HomePage() {
  const posts = await listPosts();
  const [lead, ...rest] = posts;

  return (
    <div className="mx-auto max-w-6xl px-6 py-10 sm:py-16">
      <Masthead />

      {posts.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          {lead && <LeadStory post={lead} />}
          {rest.length > 0 && (
            <div className="mt-20">
              <SectionRule label="More dispatches" />
              <div className="mt-8 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
                {rest.map((p) => (
                  <PostCard key={p.slug} post={p} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Masthead() {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  return (
    <div className="mb-16 flex flex-col gap-3 border-b-2 border-ink pb-8 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <div className="text-xs uppercase tracking-[0.3em] text-muted">Vol. 1 · Issue {Math.floor((Date.now() - new Date('2025-01-01').getTime()) / 86400000) + 1}</div>
        <h1 className="mt-2 font-display text-5xl sm:text-6xl font-black leading-none tracking-tight">
          What shipped.<br /><span className="text-accent">What matters.</span>
        </h1>
      </div>
      <div className="text-right text-xs uppercase tracking-widest text-muted">
        {today}
      </div>
    </div>
  );
}

function SectionRule({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-4">
      <div className="h-px flex-1 bg-ink/20" />
      <span className="font-display text-xs font-bold uppercase tracking-[0.3em] text-muted">{label}</span>
      <div className="h-px flex-1 bg-ink/20" />
    </div>
  );
}

function LeadStory({ post }: { post: Awaited<ReturnType<typeof listPosts>>[number] }) {
  const { slug, frontmatter, readingTimeMin } = post;
  return (
    <article className="grid gap-8 sm:grid-cols-5">
      {frontmatter.hero?.url && (
        <div className="sm:col-span-3 aspect-[4/3] overflow-hidden bg-ink/5">
          <Link href={`/blog/${slug}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={frontmatter.hero.url}
              alt={frontmatter.hero.alt}
              className="h-full w-full object-cover transition-transform duration-700 hover:scale-[1.03]"
            />
          </Link>
        </div>
      )}
      <div className="sm:col-span-2 flex flex-col justify-center">
        <Link href={`/categories/${frontmatter.category}`} className="mb-3 inline-block self-start border border-accent px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.2em] text-accent hover:bg-accent hover:text-paper transition-colors">
          {frontmatter.category}
        </Link>
        <Link href={`/blog/${slug}`} className="group">
          <h2 className="font-display text-3xl sm:text-4xl font-black leading-[1.05] tracking-tight group-hover:text-accent transition-colors">
            {frontmatter.title}
          </h2>
        </Link>
        <p className="mt-4 text-lg leading-relaxed text-ink/75">{frontmatter.description}</p>
        <div className="mt-5 text-xs uppercase tracking-widest text-muted">
          {new Date(frontmatter.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          {' · '} {readingTimeMin} min read
        </div>
      </div>
    </article>
  );
}

function PostCard({ post }: { post: Awaited<ReturnType<typeof listPosts>>[number] }) {
  const { slug, frontmatter, readingTimeMin } = post;
  return (
    <article className="group flex flex-col">
      {frontmatter.hero?.url && (
        <Link href={`/blog/${slug}`} className="mb-4 block aspect-[16/10] overflow-hidden bg-ink/5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={frontmatter.hero.url}
            alt={frontmatter.hero.alt}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </Link>
      )}
      <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-accent">
        {frontmatter.category}
      </div>
      <Link href={`/blog/${slug}`}>
        <h3 className="font-display text-xl font-semibold leading-tight group-hover:text-accent transition-colors">
          {frontmatter.title}
        </h3>
      </Link>
      <p className="mt-2 text-sm text-ink/70 line-clamp-2">{frontmatter.description}</p>
      <div className="mt-3 text-[11px] uppercase tracking-widest text-muted">
        {new Date(frontmatter.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        {' · '} {readingTimeMin} min
      </div>
    </article>
  );
}

function EmptyState() {
  return (
    <div className="border-2 border-dashed border-ink/25 py-24 text-center">
      <div className="font-display text-3xl font-bold">Nothing published yet.</div>
      <p className="mt-3 text-muted">
        Run <code className="rounded bg-ink/10 px-2 py-0.5 text-sm">pnpm generate</code> or wait for the next cron tick.
      </p>
    </div>
  );
}
