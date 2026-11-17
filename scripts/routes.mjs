// Maps design-prototype filenames to site routes, and rewrites links/asset paths.
export const DRAPER = {
  'Draper Real Estate': { route: '/', slug: 'home', title: 'Draper Real Estate · Homes in the Houston Heights' },
  'About Lauren': { route: '/about/', slug: 'about', title: 'About Lauren · Draper Real Estate' },
  'Buy a Home': { route: '/buy/', slug: 'buy', title: 'Buy a Home · Draper Real Estate' },
  'Sell a Home': { route: '/sell/', slug: 'sell', title: 'Sell a Home · Draper Real Estate' },
  'Journal': { route: '/journal/', slug: 'journal', title: 'Journal · Draper Real Estate' },
  'Article': { route: '/journal/article/', slug: 'article', title: 'Article · Draper Real Estate' },
  'Contact': { route: '/contact/', slug: 'contact', title: 'Contact · Draper Real Estate' },
  'Video Templates': { route: '/video-guide/', slug: 'video-templates', title: 'Video Templates · Draper Real Estate', noindex: true },
  'Vertical Video Style': { route: '/video-guide/vertical/', slug: 'vertical-video', title: 'Vertical Video Style · Draper Real Estate', noindex: true },
  'Listing Video Template': { route: '/video-guide/listing/', slug: 'listing-video', title: 'Listing Video Template · Draper Real Estate', noindex: true },
  'Neighborhood Tour Template': { route: '/video-guide/neighborhood-tour/', slug: 'neighborhood-tour', title: 'Neighborhood Tour Template · Draper Real Estate', noindex: true },
};
export const HEIGHTS = ['index', 'neighborhoods', 'schools', 'food', 'events', 'news', 'history', 'guides', 'music', 'homes'];
export const heightsRoute = (n) => (n === 'index' ? '/heights/' : `/heights/${n}/`);

// Cross-site links. On Cloudflare Pages builds, Living in the Heights links from the
// Draper pages point at its own domain, and Draper links from the Heights pages point
// at theheightshouston.com. Locally (and anywhere else) both stay relative.
export const HEIGHTS_DOMAIN = 'livingintheheightstx.com';
export const DRAPER_DOMAIN = 'theheightshouston.com';
const onPages = !!process.env.CF_PAGES;
export const HEIGHTS_ORIGIN = process.env.HEIGHTS_ORIGIN ?? (onPages ? `https://${HEIGHTS_DOMAIN}` : '');
export const DRAPER_ORIGIN = process.env.DRAPER_ORIGIN ?? (onPages ? `https://${DRAPER_DOMAIN}` : '');
const crossHeights = (n) => (HEIGHTS_ORIGIN ? HEIGHTS_ORIGIN + (n === 'index' ? '/' : `/${n}/`) : heightsRoute(n));

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function rewrite(src, { heights = false } = {}) {
  let out = src;
  // Draper pages (raw or %20-encoded), optionally prefixed with ./ or ../
  for (const [name, { route }] of Object.entries(DRAPER)) {
    const variants = [name, name.replace(/ /g, '%20')].map(esc).join('|');
    out = out.replace(new RegExp(`(["'(])(?:\\.\\.?/)?(?:${variants})\\.dc\\.html`, 'g'), `$1${heights ? DRAPER_ORIGIN : ''}${route}`);
  }
  // Living in the Heights pages (alternate -v2 explorations map to the main page)
  const hp = HEIGHTS.join('|');
  const prefix = heights ? '(?:\\./)?' : '(?:\\./)?living-in-the-heights/';
  out = out.replace(new RegExp(`(["'(])${prefix}(${hp})(?:-v2)?\\.html`, 'g'), (_, q, n) => q + (heights ? heightsRoute(n) : crossHeights(n)));
  // Assets
  out = out.replace(/(["'(])(?:\.\.?\/)?img\//g, '$1/img/');
  out = out.replace(/(["'(])(?:\.\/)?living-in-the-heights\/assets\//g, '$1/heights/assets/');
  if (heights) out = out.replace(/(["'(])(?:\.\/)?assets\//g, '$1/heights/assets/');
  return out;
}
