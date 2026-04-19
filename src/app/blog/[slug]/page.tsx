import { notFound } from 'next/navigation';
import Link from 'next/link';
import { MDXRemote } from 'next-mdx-remote/rsc';
import type { Metadata } from 'next';
import { loadPost, listSlugs } from '@/lib/posts';
import { mdxComponents } from '@/components/mdx';

export const revalidate = 300;

export async function generateStaticParams() {
  const slugs = await listSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await loadPost(slug);
  if (!post) return { title: 'Not found' };
  return {
    title: post.frontmatter.title,
    description: post.frontmatter.description,
    openGraph: {
      title: post.frontmatter.title,
      description: post.frontmatter.description,
      images: post.frontmatter.hero?.url ? [post.frontmatter.hero.url] : [],
    },
  };
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await loadPost(slug);
  if (!post) notFound();

  const { frontmatter, body, readingTimeMin } = post;
  const date = new Date(frontmatter.date).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <article className="mx-auto max-w-3xl px-6 py-12 sm:py-20">
      {/* Article header */}
      <header className="mb-12">
        <div className="mb-4 flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-muted">
          <Link href={`/categories/${frontmatter.category}`} className="border border-accent px-2 py-0.5 text-accent hover:bg-accent hover:text-paper transition-colors">
            {frontmatter.category}
          </Link>
          <span>{date}</span>
          <span>·</span>
          <span>{readingTimeMin} min read</span>
        </div>
        <h1 className="font-display text-4xl sm:text-6xl font-black leading-[1.02] tracking-tight">
          {frontmatter.title}
        </h1>
        <p className="mt-6 font-display text-xl sm:text-2xl font-normal leading-snug text-ink/70">
          {frontmatter.description}
        </p>
      </header>

      {/* Hero */}
      {frontmatter.hero?.url && (
        <figure className="mb-12 -mx-6 sm:mx-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={frontmatter.hero.url}
            alt={frontmatter.hero.alt}
            className="aspect-video w-full object-cover"
          />
          {frontmatter.hero.credit && (
            <figcaption className="mt-2 px-6 sm:px-0 text-xs text-muted">
              Photo:{' '}
              <a href={frontmatter.hero.creditUrl} className="underline hover:text-accent" target="_blank" rel="noopener noreferrer">
                {frontmatter.hero.credit}
              </a>
            </figcaption>
          )}
        </figure>
      )}

      {/* Body */}
      <div className="prose-editorial">
        <MDXRemote source={body} components={mdxComponents} />
      </div>

      {/* Sources */}
      {frontmatter.sources?.length > 0 && (
        <section className="mt-16 border-t-2 border-ink pt-8">
          <div className="mb-4 font-display text-sm font-bold uppercase tracking-[0.3em] text-muted">
            Sources
          </div>
          <ol className="space-y-2 text-sm">
            {frontmatter.sources.map((s, i) => (
              <li key={i} className="flex gap-3">
                <span className="font-mono text-accent">{String(i + 1).padStart(2, '0')}</span>
                <a href={s.url} target="_blank" rel="noopener noreferrer" className="underline hover:text-accent break-all">
                  {s.title || s.url}
                </a>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* Tags */}
      {frontmatter.tags?.length > 0 && (
        <div className="mt-10 flex flex-wrap gap-2">
          {frontmatter.tags.map((t) => (
            <Link key={t} href={`/tags/${t}`} className="border border-ink/30 px-2 py-1 text-[11px] uppercase tracking-widest text-ink/70 hover:border-accent hover:text-accent transition-colors">
              #{t}
            </Link>
          ))}
        </div>
      )}

      {/* Back link */}
      <div className="mt-16 border-t border-ink/20 pt-8">
        <Link href="/" className="inline-flex items-center gap-2 font-display font-semibold text-accent hover:gap-3 transition-all">
          ← Back to The Dispatch
        </Link>
      </div>
    </article>
  );
}
