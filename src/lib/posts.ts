import fs from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';
import readingTime from 'reading-time';

export interface PostFrontmatter {
  title: string;
  description: string;
  date: string;
  category: string;
  tags: string[];
  hero: { url: string; alt: string; credit: string; creditUrl: string };
  sources: Array<{ title: string; url: string }>;
}

export interface Post {
  slug: string;
  frontmatter: PostFrontmatter;
  body: string;
  readingTimeMin: number;
}

const POSTS_DIR = path.join(process.cwd(), 'content', 'posts');

export async function listPosts(): Promise<Post[]> {
  let files: string[] = [];
  try {
    files = await fs.readdir(POSTS_DIR);
  } catch {
    return [];
  }
  const posts = await Promise.all(
    files.filter((f) => f.endsWith('.mdx')).map((f) => loadPost(f.replace(/\.mdx$/, '')))
  );
  return posts
    .filter((p): p is Post => p !== null)
    .sort((a, b) => b.frontmatter.date.localeCompare(a.frontmatter.date));
}

export async function loadPost(slug: string): Promise<Post | null> {
  try {
    const raw = await fs.readFile(path.join(POSTS_DIR, `${slug}.mdx`), 'utf8');
    const { data, content } = matter(raw);
    const rt = readingTime(content);
    return {
      slug,
      frontmatter: data as PostFrontmatter,
      body: content,
      readingTimeMin: Math.max(1, Math.round(rt.minutes)),
    };
  } catch {
    return null;
  }
}

export async function listSlugs(): Promise<string[]> {
  try {
    const files = await fs.readdir(POSTS_DIR);
    return files.filter((f) => f.endsWith('.mdx')).map((f) => f.replace(/\.mdx$/, ''));
  } catch {
    return [];
  }
}
