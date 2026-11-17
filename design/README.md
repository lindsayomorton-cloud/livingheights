# Handoff: Draper Real Estate + Living in the Heights

> **This handoff comes in two zips.** `handoff-1-code` (pages, scripts, this README) and `handoff-2-images` (`img/` and `living-in-the-heights/assets/`). Unzip both and merge them into ONE folder so `img/` sits next to the `.dc.html` files and `living-in-the-heights/assets/` sits next to the Living in the Heights pages. Commit images in a separate commit from code if a push is too large.

### Video templates (added)
`Video Templates.dc.html` links to three 9:16 templates for Lauren's social videos: `Vertical Video Style.dc.html` (talking video), `Listing Video Template.dc.html` and `Neighborhood Tour Template.dc.html`. These are references for video editors, not site pages. Optionally publish them at a private `/video-guide` route.

### School assets (added)
`heights-school-assets.csv` lists campus photos, logos and mascots for the 12 zoned schools with sources and verification notes. Logos are currently hot-linked; download and self-host the verified ones. Harvard, Browning, Crockett and Hamilton logos are still needed.

## Overview
Two linked websites for Lauren Draper's real estate business in Houston:
- **Draper Real Estate**: Lauren's agent site (buy, sell, about, journal, contact).
- **Living in the Heights**: a neighborhood guide for the Houston Heights (neighborhoods, schools, food, events, news, history, guides, music).

A red bar at the top of every page (and a navy bar in every footer) switches between the two sites. Also included is a style guide for Lauren's vertical (9:16) social videos.

## Decisions for the build
- **Repo:** `lindsayomorton-cloud/livingheights` (branch `main`). Put this whole folder in a `design/` directory and build the app at the repo root.
- **Stack:** **Astro** (static output, shared layout components, Markdown/MDX content collections for Journal, News and Events). Deploy to Netlify, Vercel or Cloudflare Pages.
- **Domains:** the client owns domains for **both** sites. Build one Astro project with two route groups (`/` for Draper, `/heights/` for Living in the Heights), or two apps in one monorepo, and map each domain to its site at the host. The site switcher links should use absolute URLs to the other domain. Confirm the exact domain names with the client.

## About the design files
Everything in this folder is a **design reference built in HTML**. These are prototypes that show the intended look and behavior. They are not production code to ship as-is. The task is to **rebuild these designs in a real web stack**. No codebase exists yet, so pick a fitting framework. A static-first framework such as Astro or Next.js (static export) suits a content site like this, and makes it easy to add a CMS later for the Journal, News and Events.

- `*.dc.html` files (Draper pages) are "Design Components": HTML templates with `{{ }}` holes plus a small logic class, rendered by `support.js`. Open them in a browser to view. Treat the inline styles as the spec.
- `living-in-the-heights/*.html` are plain static HTML pages.
- Images that were embedded in the Living in the Heights pages have been extracted to `living-in-the-heights/assets/inline/` (x1–x22). Every page is now under 135 KB.

## Fidelity
**High fidelity.** Colors, type, spacing, imagery and interactions are final. Recreate them closely.

## Site map

### Draper Real Estate (root)
| Page | File |
|---|---|
| Home | `Draper Real Estate.dc.html` |
| About Lauren | `About Lauren.dc.html` |
| Buy a Home | `Buy a Home.dc.html` |
| Sell a Home | `Sell a Home.dc.html` |
| Journal (articles + market chart placeholders) | `Journal.dc.html` |
| Article template | `Article.dc.html` |
| Contact | `Contact.dc.html` |

Homepage section order: Hero (Lauren photo overlapping the red hero) → Authority / "A designer's eye" + neighborhood links → Buy and sell cards → Testimonials carousel → Homes (portfolio) → Meet the agent → What makes me different (three things, auto-advancing) → What's your house worth (valuation form) → Articles → Contact → footer with skyline strip.

### Living in the Heights (`living-in-the-heights/`)
`index.html` (home), `neighborhoods.html`, `schools.html`, `food.html`, `events.html`, `news.html` ("Heard on the porch"), `history.html`, `guides.html`, `music.html`, `homes.html`. Files named `-v2` are alternate explorations. Confirm with the client before building them.

Key patterns:
- **Home:** school flow diagram (Elementary → Middle → High, color-coded by HISD feeder pattern), neighborhood cards with hand-lettered names, restaurant photos, event list, "Heard on the porch" news block.
- **Neighborhood sections, in order:** photo with logo → why people love it → top spots (restaurants + landmarks) → zoned schools → buyer info → listings.
- **News:** masthead, a lead story with a large photo, two secondary stories with round photos, then "More from the porch" grouped by month with topic filter buttons (All / Parks / Neighbors / Food / Events). Every story links out to the original outlet.
- **Events:** month-grouped list with category filters.

### Vertical video style guide
`Vertical Video Style.dc.html` is a 1080×1920 template for Lauren's videos with a 14s looping demo. This is a reference for video editors (CapCut, Premiere, After Effects), not a web page to build.
- 0–2s intro: Draper logo + "Houston, Texas" on cream, fades out.
- Top: subtitles, highlighted word by word.
- Middle: arched Lauren video box with a cream gap and a bluebonnet ring.
- Bottom: a full-width spotlight photo that shrinks into the center of three circle photos, then the red skyline, the Draper logo and a bluebonnet border.

## Interactions & behavior
- **Site switcher:** pill toggle in the red top bar and the navy footer bar. The current site is shown as a filled cream pill.
- **Draper header:** desktop nav (Buy, Sell, Homes, Contact button) collapses to a menu on narrow screens. The Contact button opens a contact panel.
- **Scroll reveal:** elements with `data-reveal` fade and rise in (0.8s, `cubic-bezier(.22,1,.36,1)`). Turn this off under `prefers-reduced-motion`.
- **Testimonials:** carousel with keyboard arrows and swipe.
- **What makes me different:** auto-advancing carousel.
- **Image hover:** `.zoom` images scale to 1.04 over 0.9s.
- **Living in the Heights:** sticky header. Below 1100px the nav becomes a full-screen menu (opened by the hamburger, closed with Escape). Filter buttons use `aria-pressed` and hide rows and empty month groups.
- **Forms** (valuation, contact, newsletter) are visual only and need a real backend or service (for example Formspree or a CRM).
- **Responsive breakpoints:** 1100px, 980px and 640px (see each file's `<style>`).

## Design tokens

### Draper Real Estate
- Cream ground `#FFF8EE`, oxblood text `#742530`, deep red `#8D2632`
- Bluebonnet `#2456D6` (primary accent), navy `#13296F`, brick `#E16F4F`
- Brand red bar `#D42A2A`, sky `#C9D6F7`, lavender wash `#F3E8DC`
- Type: **Cormorant Garamond** (500/600, italics for emphasis) for headings; **Jost** (400/500/600) for body. Eyebrows are 12px Jost, weight 500, letter-spacing .24em, uppercase, in bluebonnet.
- Radii: pills `999px`, large cards 28–56px (`clamp(32px,5vw,56px)`), arched photo tops.

### Living in the Heights
- Ground `#FBF4EA`, alt band `#FFF1E6`, white cards `#FFFFFF`
- Red `#A51F26` (headlines, links; hover `#7E141A`), rust `#C2492F` (kickers), ink `#3A1A17`, secondary text `#5A2A24`, muted `#8A4A40`, rules `#EAD3C6`
- Electric blue pill buttons `#174BFF` (hover `#0D36D1`)
- Type: **Playfair Display** (700/800) for headings, **Lora** for body and italic deks, **DM Sans** (700, uppercase, .14–.24em tracking) for labels, **Caveat** for hand-lettered accents.
- Card radius 22px. Card shadow `0 1px 0 #EAD3C6, 0 24px 48px -40px rgba(110,40,25,.35)`.
- Page width `max-width:1240px`, side padding 40px (20px on mobile).

### Brand rule
Never use tilted or rotated elements anywhere.

## Assets
- `img/`: Draper logo, Lauren portrait (`realtor-portrait.png`), bluebonnet watercolors (`illo-bluebonnets.png`, `bonnet-*.webp`), skyline strips, icons, hand-lettered neighborhood names.
- `living-in-the-heights/assets/`: Living in the Heights logos, neighborhood art, food, events, history and school photos.
- Many photos are hot-linked from outside sites (HAR, CultureMap, Houston Chronicle, Click2Houston and others). `image-credits.csv` lists sources. Before launch, get permission or replace these, and self-host everything.
- `images-still-needed.md` lists about 25 open items: Lauren's portrait, family photos and three vertical videos; 12 school logos; 4 event performer photos; 4 history portraits; listing photos; and market data for the Journal.

## Files
- Draper pages: root `*.dc.html` + `support.js` (renderer) + `image-slot.js` (drop-in image placeholder component)
- Living in the Heights pages: `living-in-the-heights/`
- `_ds/organic-…/styles.css`: base design-system tokens that the Draper pages layer over
- `image-credits.csv`, `images-still-needed.md`
