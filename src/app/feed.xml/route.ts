import { listPosts } from '@/lib/posts';

export const revalidate = 300;

export async function GET() {
  const posts = await listPosts();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://dispatch.dev';

  const items = posts
    .slice(0, 20)
    .map(
      (p) => `
    <item>
      <title><![CDATA[${p.frontmatter.title}]]></title>
      <link>${siteUrl}/blog/${p.slug}</link>
      <guid isPermaLink="true">${siteUrl}/blog/${p.slug}</guid>
      <pubDate>${new Date(p.frontmatter.date).toUTCString()}</pubDate>
      <description><![CDATA[${p.frontmatter.description}]]></description>
      <category>${p.frontmatter.category}</category>
    </item>`
    )
    .join('');

  const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>The Dispatch</title>
    <link>${siteUrl}</link>
    <description>A daily trend brief for builders, synthesized from across the web.</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${siteUrl}/feed.xml" rel="self" type="application/rss+xml"/>
    ${items}
  </channel>
</rss>`;

  return new Response(feed.trim(), {
    headers: {
      'content-type': 'application/xml; charset=utf-8',
      'cache-control': 'public, max-age=300',
    },
  });
}
