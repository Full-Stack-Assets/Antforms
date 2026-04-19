import type { GeneratedPost } from './types';

interface PexelsPhoto {
  id: number;
  url: string;
  photographer: string;
  photographer_url: string;
  alt: string;
  src: { large2x: string; large: string; original: string };
}

interface PexelsResponse {
  photos: PexelsPhoto[];
}

/**
 * Pick a banner image from Pexels. Falls back to a deterministic
 * Unsplash source URL (no key required) if Pexels is unavailable.
 */
export async function pickImage(post: GeneratedPost): Promise<GeneratedPost['heroImage']> {
  const key = process.env.PEXELS_API_KEY;

  // Build a query from the post's tags + category, skipping overly generic words
  const queryTerms = [...post.tags, post.category].filter(
    (t) => !['news', 'opinion', 'tech', 'technology'].includes(t.toLowerCase())
  );
  const query = (queryTerms[0] ?? post.tags[0] ?? post.category ?? 'technology').replace(/-/g, ' ');

  if (key) {
    try {
      const url = new URL('https://api.pexels.com/v1/search');
      url.searchParams.set('query', query);
      url.searchParams.set('orientation', 'landscape');
      url.searchParams.set('size', 'large');
      url.searchParams.set('per_page', '15');

      const res = await fetch(url, { headers: { authorization: key } });
      if (res.ok) {
        const json = (await res.json()) as PexelsResponse;
        if (json.photos.length > 0) {
          // Pick deterministically from the top results based on slug hash
          const idx = Math.abs(hashCode(post.slug)) % Math.min(5, json.photos.length);
          const photo = json.photos[idx];
          return {
            url: photo.src.large2x,
            alt: photo.alt || post.title,
            credit: photo.photographer,
            creditUrl: photo.photographer_url,
          };
        }
      }
    } catch (err) {
      console.warn('[image] Pexels failed, falling back:', err);
    }
  }

  // Fallback: Unsplash Source (no key, returns redirect to a random image matching the query)
  return {
    url: `https://source.unsplash.com/1600x900/?${encodeURIComponent(query)}`,
    alt: post.title,
    credit: 'Unsplash',
    creditUrl: 'https://unsplash.com',
  };
}

function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return h;
}
