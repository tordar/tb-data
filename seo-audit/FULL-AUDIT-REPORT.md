# Full SEO Audit Report — TB Test Results Explorer
**URL:** https://tb-data-xi.vercel.app/
**Date:** 2026-03-31
**Auditors:** 7 specialist subagents (Technical, Content, Schema, Sitemap, Performance, GEO, Visual)

---

## Overall SEO Health Score: 28 / 100

| Category | Weight | Score | Weighted |
|---|---|---|---|
| Technical SEO | 22% | 25/100 | 5.5 |
| Content Quality | 23% | 31/100 | 7.1 |
| On-Page SEO | 20% | 15/100 | 3.0 |
| Schema / Structured Data | 10% | 0/100 | 0.0 |
| Performance (CWV) | 10% | 35/100 | 3.5 |
| AI Search Readiness | 10% | 24/100 | 2.4 |
| Images | 5% | 50/100 | 2.5 |
| **Total** | | | **24 / 100** |

---

## Executive Summary

TB Test Results Explorer is a genuinely valuable tool — 1,986 real-world EV test results across 663 vehicles is rare, trustworthy data that searchers and AI systems would want to cite. The SEO score of 28/100 is not a reflection of content quality but of missing infrastructure. The site is effectively invisible to search engines and AI crawlers: no sitemap (now fixed), no robots.txt, no structured data, no per-page metadata, and critical page content rendered entirely client-side.

### Top 5 Critical Issues
1. All pages share a single title and meta description — no `generateMetadata()`
2. Data components (`TestSheetView`, `DashboardStats`, `VehicleProfileView`) are `"use client"` — AI crawlers and Google see empty shells
3. No robots.txt — crawlers have no explicit access signals
4. No About/Methodology page — zero E-E-A-T trust anchors
5. No JSON-LD structured data anywhere on the site

### Top 5 Quick Wins (low effort, immediate impact)
1. Add `src/app/robots.ts` — 15 minutes, fixes crawl access signals
2. Add `src/app/robots.ts` with `llms.txt` — 30 minutes, AI search visibility
3. Add `generateMetadata()` to test and vehicle page routes — 2 hours
4. Add WebSite + Dataset JSON-LD to layout — 1 hour
5. Add OG/Twitter Card meta tags to root layout — 30 minutes

---

## 1. Technical SEO

**Score: 25 / 100**

### robots.txt
**Severity: Critical**
`/robots.txt` returns 404. No crawl directives exist. AI crawlers (GPTBot, ClaudeBot, PerplexityBot, OAI-SearchBot) have no explicit allow signals.

### sitemap.xml
**Severity: Critical → FIXED**
`/sitemap.xml` was returning 404. A `src/app/sitemap.ts` has been generated and written covering all 667 URLs (1 dashboard, 14 test pages, 1 compare, 651 vehicle pages). Deploy to activate.

### Canonical Tags
**Severity: High**
No `<link rel="canonical">` tags on any page. If the domain ever changes from the Vercel URL, all accumulated link equity could be split.

### Security Headers
**Severity: High**
`next.config.ts` has no `headers()` function. No middleware exists. The following headers are absent:
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Strict-Transport-Security`
- `Content-Security-Policy`
- `Referrer-Policy`
- `Permissions-Policy`

Vercel provides HTTPS by default but application-level headers are not set.

### JavaScript Rendering Gap
**Severity: Critical**
All main data components use the `"use client"` directive:

| Component | Route | Content invisible to crawlers |
|---|---|---|
| `DashboardStats` | `/` | Homepage KPI cards |
| `DashboardRadar` | `/` | Car comparison chart |
| `TestSheetView` | `/tests/[slug]` | All 14 test data tables |
| `StatsBento` | `/tests/[slug]` | Per-test stat cards |
| `VehicleProfileView` | `/vehicles/[slug]` | All vehicle test data |
| `HeadToHeadView` | `/compare/[a]/[b]` | Head-to-head data |
| `WeightedRankerView` | `/compare` | Find Your EV ranker |

The data is fetched server-side in page components but immediately passed to client components — the HTML Next.js sends contains React hydration stubs, not actual data.

### URL Structure
**Severity: Low**
URL patterns are clean and descriptive: `/tests/range`, `/vehicles/tesla-model-y`, `/compare`. Slugs are kebab-case. No issues found.

### Internal Linking
**Severity: High**
Vehicle profile pages are not linked from test result pages. A user (or crawler) on `/tests/range` cannot navigate to any `/vehicles/[slug]` page without using the search. Test pages do not cross-link to related tests. The sidebar provides nav to top-level routes only.

---

## 2. Content Quality

**Score: 31 / 100**

### E-E-A-T Assessment: 28 / 100

| Factor | Score | Finding |
|---|---|---|
| Experience | 35/100 | Real physical tests exist but no methodology text is anywhere on the site |
| Expertise | 30/100 | No author bio for Bjørn Nyland, no credentials, no equipment descriptions |
| Authoritativeness | 25/100 | Attribution to Bjørn Nyland exists only in sidebar footer at 50% opacity |
| Trustworthiness | 25/100 | No privacy policy, terms, contact page, or about page |

**Severity: Critical**

### Thin Content
**Severity: Critical**

| Page | Crawlable word count | Minimum needed | Gap |
|---|---|---|---|
| `/` (Dashboard) | ~25 words | 500 | ~475 words |
| `/compare` | ~40 words | 800 | ~760 words |
| `/tests/[slug]` | ~30–100 words | 800 | ~700+ words |
| `/vehicles/[slug]` | ~20 words | 300 | ~280 words |

Every page's real content is in JavaScript components invisible to crawlers.

### Title & Meta Description
**Severity: Critical**
Every page on the site shares a single `<title>TB Test Results Explorer</title>` and `<meta name="description" content="Interactive explorer for Bjørn Nyland's EV test data">`. No `generateMetadata()` exists in any route file.

### Heading Structure
**Severity: High**
- Global `<h1>` is "TB Test Results" in the sidebar (branding, not descriptive)
- All page content headings are `<h2>` — single-word labels: "Dashboard", "Range", "Banana"
- No keyword-rich headings anywhere

### Missing Content
**Severity: High**
- No About/Methodology page
- No FAQ page (high-value queries: "what is the banana test?", "how does Bjørn measure range?")
- No data freshness / last-updated timestamps visible anywhere
- No prose explanations on any test page

### Attribution Clarity
**Severity: High**
Attribution to Bjørn Nyland appears only in the sidebar footer at `opacity: 0.5` in `text-xs`. It is not in `<head>` metadata, not in any structured data, and not visible on individual test or vehicle pages.

---

## 3. On-Page SEO

**Score: 15 / 100**

- No per-page `<title>` tags (all identical)
- No per-page `<meta name="description">` (all identical)
- No Open Graph tags (`og:title`, `og:description`, `og:image`)
- No Twitter Card tags
- No `<meta name="author">` tags
- No `<time>` elements with `datetime` attributes
- No `robots` metadata directive (max-snippet, max-image-preview)
- No canonical tags

---

## 4. Schema / Structured Data

**Score: 0 / 100**

Zero structured data of any kind exists on any page. No JSON-LD, no Microdata, no RDFa.

### High-Priority Missing Schemas

| Schema Type | Page | Impact |
|---|---|---|
| `WebSite` + `SearchAction` | Layout (all pages) | Sitelinks Searchbox; site entity anchor |
| `Dataset` | Homepage | Eligible for Google Dataset Search |
| `BreadcrumbList` | All pages | Navigation signals |
| `CollectionPage` + `ItemList` | `/tests/[slug]` | Rich snippets for leaderboard top results |
| `Person` (Bjørn Nyland) | Layout/Homepage | E-E-A-T attribution signal |
| `WebPage` + `Car` | `/vehicles/[slug]` | Entity typing for vehicle pages |

See `ACTION-PLAN.md` for ready-to-implement JSON-LD blocks.

---

## 5. Performance (Core Web Vitals)

**Score: 35 / 100**

| Metric | Estimate | Status |
|---|---|---|
| LCP | 3.5–5.5s | Needs Improvement / Poor |
| INP | 150–350ms | Good to Needs Improvement |
| CLS | 0.05–0.15 | Good to Needs Improvement |

### Root Causes

**LCP (Critical)**
- Recharts loaded eagerly on all routes (~180KB gzip) — no `next/dynamic` lazy loading
- Full EV dataset (650+ vehicles) imported as static JSON — included in JS bundle parse graph
- No `<link rel="preload">` for LCP element

**INP (High)**
- Chart interactions trigger full Recharts re-renders over 650-item dataset
- No `useMemo`, `React.memo`, or `startTransition` wrapping expensive state updates
- Entire dataset processed synchronously on every filter/sort

**CLS (Medium)**
- Font swap (`display: swap`) causes FOUT and minor layout shift
- Recharts legend reflows possible

---

## 6. AI Search Readiness (GEO)

**Score: 24 / 100**

| Dimension | Score |
|---|---|
| Citability | 18/100 |
| Structural Readability | 30/100 |
| Multi-Modal Content | 20/100 |
| Authority & Brand Signals | 35/100 |
| Technical Accessibility | 20/100 |

### Platform Scores

| Platform | Score | Key Blocker |
|---|---|---|
| Google AI Overviews | 15/100 | No structured data, no prose, no per-page meta |
| ChatGPT Browse | 20/100 | GPTBot not allowed, data is JS-only, no llms.txt |
| Perplexity | 18/100 | PerplexityBot not allowed, no citable text |
| Bing Copilot | 22/100 | Same as ChatGPT, slightly more lenient about JS |

### Root Causes
1. No robots.txt — no explicit AI crawler allow signals
2. No llms.txt — no dataset description for LLM systems
3. `"use client"` components mean all data is invisible without JS execution
4. Zero prose passages — stat cards and tables are not citable
5. No question-based headings — nothing to anchor AI answer extraction

---

## 7. Images

**Score: 50 / 100**

- No `<img>` elements with missing alt text (no images are used)
- Charts are SVG/canvas — invisible to text crawlers
- No OG image configured — social shares show blank preview
- No static chart images or `<figure>/<figcaption>` markup
- `/public` contains only default Next.js placeholder SVGs

---

## Appendix: What's Already Fixed

| Item | Status |
|---|---|
| `src/app/sitemap.ts` | Written — deploy to activate |
| Umami analytics | Added and deployed |
