import type { GeneratedPost } from './types';

/**
 * Serialize a GeneratedPost into a complete MDX file with YAML frontmatter.
 * The shape matches the TinaCMS schema in tina/config.ts.
 */
export function serialize(post: GeneratedPost): string {
  const fm = {
    title: post.title,
    description: post.description,
    date: new Date().toISOString(),
    category: post.category,
    tags: post.tags,
    hero: {
      url: post.heroImage.url,
      alt: post.heroImage.alt,
      credit: post.heroImage.credit,
      creditUrl: post.heroImage.creditUrl,
    },
    sources: post.sources,
  };

  const yaml = toYaml(fm);
  return `---\n${yaml}---\n\n${post.body.trim()}\n`;
}

function toYaml(obj: unknown, indent = 0): string {
  const pad = '  '.repeat(indent);
  if (obj === null || obj === undefined) return 'null';

  if (typeof obj === 'string') return quoteIfNeeded(obj);
  if (typeof obj === 'number' || typeof obj === 'boolean') return String(obj);

  if (Array.isArray(obj)) {
    if (obj.length === 0) return '[]';
    return (
      '\n' +
      obj
        .map((item) => {
          if (typeof item === 'object' && item !== null) {
            const entries = Object.entries(item as Record<string, unknown>);
            const first = entries[0];
            const rest = entries.slice(1);
            const firstLine = `${pad}- ${first[0]}: ${toYaml(first[1], indent + 1)}`;
            const restLines = rest
              .map(([k, v]) => `${pad}  ${k}: ${toYaml(v, indent + 1)}`)
              .join('\n');
            return restLines ? `${firstLine}\n${restLines}` : firstLine;
          }
          return `${pad}- ${toYaml(item, indent + 1)}`;
        })
        .join('\n')
    );
  }

  if (typeof obj === 'object') {
    const entries = Object.entries(obj as Record<string, unknown>);
    if (entries.length === 0) return '{}';
    if (indent === 0) {
      return entries.map(([k, v]) => `${k}: ${toYaml(v, indent + 1)}`).join('\n') + '\n';
    }
    return (
      '\n' +
      entries.map(([k, v]) => `${pad}${k}: ${toYaml(v, indent + 1)}`).join('\n')
    );
  }

  return '';
}

function quoteIfNeeded(s: string): string {
  // Always quote for safety — dates, colons, leading dashes, etc. all need it
  const escaped = s.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  return `"${escaped}"`;
}
