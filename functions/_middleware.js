// Cloudflare Pages middleware: serves Living in the Heights at the root of its own domain.
// The same build serves Draper Real Estate at "/" on every other host.
const HEIGHTS_HOST = 'livingintheheightstx.com';
const SHARED = ['/_astro/', '/img/', '/ds/', '/heights/assets/', '/favicon.svg'];

export async function onRequest({ request, next, env }) {
  const url = new URL(request.url);
  if (url.hostname === 'www.' + HEIGHTS_HOST) {
    url.hostname = HEIGHTS_HOST;
    return Response.redirect(url.toString(), 301);
  }
  if (url.hostname !== HEIGHTS_HOST) return next();

  const path = url.pathname;
  if (SHARED.some((p) => path.startsWith(p))) return next();

  // Old /heights/... page links → clean URLs on this domain.
  if (path === '/heights' || path.startsWith('/heights/')) {
    url.pathname = path.slice('/heights'.length) || '/';
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
