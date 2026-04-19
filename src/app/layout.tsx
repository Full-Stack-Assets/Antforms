import type { Metadata } from 'next';
import Link from 'next/link';
import { Analytics } from '@vercel/analytics/next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'The Dispatch',
    template: '%s — The Dispatch',
  },
  description: 'A daily trend brief for builders, synthesized from across the web.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="relative">
        <Header />
        <main className="relative z-10">{children}</main>
        <Footer />
        <Analytics />
      </body>
    </html>
  );
}

function Header() {
  return (
    <header className="relative z-20 border-b border-ink/20">
      <div className="mx-auto flex max-w-6xl items-end justify-between px-6 py-6">
        <Link href="/" className="group">
          <div className="font-display text-3xl font-black tracking-tight leading-none">
            The <span className="text-accent">Dispatch</span>
          </div>
          <div className="mt-1 text-[10px] uppercase tracking-[0.2em] text-muted">
            Daily · Synthesized · Opinionated
          </div>
        </Link>
        <nav className="hidden sm:flex items-center gap-6 text-sm font-medium">
          <Link href="/" className="hover:text-accent transition-colors">Latest</Link>
          <Link href="/categories/engineering" className="hover:text-accent transition-colors">Engineering</Link>
          <Link href="/categories/ai" className="hover:text-accent transition-colors">AI</Link>
          <Link href="/categories/tools" className="hover:text-accent transition-colors">Tools</Link>
          <Link href="/about" className="hover:text-accent transition-colors">About</Link>
          <Link href="/stats" className="hover:text-accent transition-colors">Stats</Link>
          <a href="/feed.xml" className="hover:text-accent transition-colors" title="RSS Feed">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><circle cx="6.18" cy="17.82" r="2.18"/><path d="M4 4.44v2.83c7.03 0 12.73 5.7 12.73 12.73h2.83c0-8.59-6.97-15.56-15.56-15.56zm0 5.66v2.83c3.9 0 7.07 3.17 7.07 7.07h2.83c0-5.47-4.43-9.9-9.9-9.9z"/></svg>
          </a>
        </nav>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="relative z-10 mt-32 border-t border-ink/20">
      <div className="mx-auto max-w-6xl px-6 py-10 text-sm text-muted">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="font-display text-base font-semibold text-ink">The Dispatch</span>
            {' '}— one post a day, generated from what's trending.
          </div>
          <div className="text-xs uppercase tracking-widest">
            © {new Date().getFullYear()} — No humans were harmed in the making of this blog.
          </div>
        </div>
      </div>
    </footer>
  );
}
