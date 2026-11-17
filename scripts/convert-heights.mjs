// Prepares the Living in the Heights pages (plain static HTML) for Astro:
// rewrites links and asset paths, then splits each page into head + body.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { HEIGHTS, rewrite } from './routes.mjs';

const OUT = 'src/generated/heights';
mkdirSync(OUT, { recursive: true });

function parseAttrs(s) {
  const o = {};
  for (const m of s.matchAll(/([^\s=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)) o[m[1]] = m[2] ?? m[3] ?? m[4] ?? '';
  return o;
}

for (const name of HEIGHTS) {
  const src = rewrite(readFileSync(`design/living-in-the-heights/${name}.html`, 'utf8'), { heights: true });
  const head = (src.match(/<head[^>]*>([\s\S]*?)<\/head>/i) || [, ''])[1];
  const title = (head.match(/<title>([\s\S]*?)<\/title>/i) || [, 'Living in the Heights'])[1];
  const headRest = head
    .replace(/<meta charset[^>]*>/i, '')
    .replace(/<meta name="viewport"[^>]*>/i, '')
    .replace(/<title>[\s\S]*?<\/title>/i, '')
    .trim();
  const bodyOpen = src.match(/<body([^>]*)>/i);
  const bodyStart = bodyOpen.index + bodyOpen[0].length;
  const bodyEnd = src.lastIndexOf('</body>');
  const body = src.slice(bodyStart, bodyEnd < 0 ? undefined : bodyEnd);
  const viewport = (head.match(/<meta name="viewport" content="([^"]*)"/i) || [, 'width=device-width, initial-scale=1'])[1];
  writeFileSync(`${OUT}/${name}.json`, JSON.stringify({ title, viewport, head: headRest, bodyAttrs: parseAttrs(bodyOpen[1]), body }));
}
console.log(`converted ${HEIGHTS.length} Living in the Heights pages`);
