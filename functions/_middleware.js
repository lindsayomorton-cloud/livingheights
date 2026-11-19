// Cloudflare Pages middleware for the two domains served by this one build:
//   theheightshouston.com     → Draper Real Estate (pages at "/")
//   livingintheheightstx.com  → Living in the Heights (the "/heights/" pages, served at "/")
// Other hosts (e.g. the *.pages.dev preview address) get the build as-is.
const HEIGHTS_HOST = 'livingintheheightstx.com';
const DRAPER_HOST = 'theheightshouston.com';
const SHARED = ['/_astro/', '/img/', '/ds/', '/heights/assets/', '/favicon.svg', '/icons/'];
const isHeightsPage = (p) => (p === '/heights' || p.startsWith('/heights/')) && !p.startsWith('/heights/assets/');
const stripHeights = (p) => p.slice('/heights'.length) || '/';

export async function onRequest({ request, next, env }) {
  const url = new URL(request.url);
  for (const host of [HEIGHTS_HOST, DRAPER_HOST]) {
    if (url.hostname === 'www.' + host) {
      url.hostname = host;
      return Response.redirect(url.toString(), 301);
    }
  }
  const path = url.pathname;

  if (url.hostname === DRAPER_HOST) {
    // Heights pages belong on their own domain.
    if (isHeightsPage(path)) return Response.redirect(`https://${HEIGHTS_HOST}${stripHeights(path)}${url.search}`, 301);
    return next();
  }

  if (url.hostname !== HEIGHTS_HOST) return next();
  if (SHARED.some((p) => path.startsWith(p))) return next();

  // Old /heights/... page links → clean URLs on this domain.
  if (isHeightsPage(path)) {
    url.pathname = stripHeights(path);
    return Response.redirect(url.toString(), 301);
  }
  // Pages are folders ("/food/"); add the trailing slash first to avoid redirect loops.
  if (!path.endsWith('/') && !/\.[a-z0-9]+$/i.test(path)) {
    url.pathname = path + '/';
    return Response.redirect(url.toString(), 301);
  }
  url.pathname = '/heights' + path;
  const res = await env.ASSETS.fetch(new Request(url.toString(), request));
  if (res.status === 404) return next(); // fall back to the normal 404
  return res;
}
