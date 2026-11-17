# Draper Real Estate + Living in the Heights

One Astro project that serves two sites:

| Site | Route | Source design |
|---|---|---|
| Draper Real Estate | `/` | `design/*.dc.html` |
| Living in the Heights | `/heights/` | `design/living-in-the-heights/*.html` |

The original design handoff lives in [`design/`](design/) (see `design/README.md`). Design files are the source of truth for the build.

## Run it

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # static site in dist/
```

## How it works

`npm run sync` (run automatically by `dev` and `build`) does three things:

1. `scripts/sync-assets.mjs` copies images from `design/` into `public/`.
2. `scripts/convert-dc.mjs` converts each Draper page into a React component (JSON template + the page's original logic). Astro renders it to static HTML and hydrates it for the interactive parts (menu, contact panel, testimonials, valuation form, listing search).
3. `scripts/convert-heights.mjs` prepares the Living in the Heights pages (rewrites links and asset paths).

`scripts/routes.mjs` maps design filenames to routes. To change a page, edit the design file and rebuild. Generated files (`src/generated/`, `public/img/`, `public/heights/`, `public/ds/`) are not committed.

## Routes

- Draper: `/`, `/about/`, `/buy/`, `/sell/`, `/journal/`, `/journal/article/`, `/contact/`
- Video guide (not indexed): `/video-guide/`, `/video-guide/vertical/`, `/video-guide/listing/`, `/video-guide/neighborhood-tour/`
- Living in the Heights: `/heights/`, `/heights/neighborhoods/`, `/heights/schools/`, `/heights/food/`, `/heights/events/`, `/heights/news/`, `/heights/history/`, `/heights/guides/`, `/heights/music/`, `/heights/homes/`

## Before launch

- **Forms** (valuation, contact, newsletter) only show a success state. Connect them to a form service or CRM.
- **Domains:** the site switcher links to `/` and `/heights/`. Once the two domains are confirmed, point those links at the absolute URLs and map each domain at the host.
- **Photos:** many listing, food, event and school photos are hot-linked or unlicensed. See `design/image-credits.csv`.
- **Placeholder copy:** testimonials, stats and some photos are still bracketed placeholders (see `design/images-still-needed.md`).
- **Content:** Journal, News and Events are still hard-coded in the page designs; moving them to Astro content collections is the next step for editing without code.

## Domains (Cloudflare Pages)

- **livingintheheightstx.com** serves Living in the Heights at its root (`/food/`, `/schools/`, ...). `functions/_middleware.js` maps that domain onto the `/heights/` pages and redirects `www.` and old `/heights/...` links.
- **theheightshouston.com** serves Draper Real Estate. Its `/heights/...` pages redirect to livingintheheightstx.com, and `www.` redirects to the bare domain.
- Any other host (for example the `*.pages.dev` preview address) serves the build as-is: Draper at `/`, Heights at `/heights/`.
- On Cloudflare builds, links between the two sites are absolute. Override with the `HEIGHTS_ORIGIN` and `DRAPER_ORIGIN` build variables (for example to test on a preview address).

## Deploy

Netlify, Vercel or Cloudflare Pages: build command `npm run build`, output directory `dist`.
