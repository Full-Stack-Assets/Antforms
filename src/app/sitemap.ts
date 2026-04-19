import { listPosts } from '@/lib/posts';
import type { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://dispatch.dev';
  const posts = await listPosts();

  const postEntries: MetadataRoute.Sitemap = posts.map((p) => ({
    url: `${siteUrl}/blog/${p.slug}`,
    lastModified: new Date(p.frontmatter.date),
    changeFrequency: 'never',
    priority: 0.8,
  }));

  const categories = Array.from(new Set(posts.map((p) => p.frontmatter.category)));
  const catEntries: MetadataRoute.Sitemap = categories.map((c) => ({
    url: `${siteUrl}/categories/${c}`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 0.5,
  }));

  return [
    { url: siteUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${siteUrl}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${siteUrl}/stats`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.3 },
    ...postEntries,
    ...catEntries,
  ];
}
