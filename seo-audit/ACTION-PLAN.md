# SEO Action Plan — TB Test Results Explorer
**Priority order: Critical → High → Medium → Low**
**Date:** 2026-03-31

---

## CRITICAL — Fix immediately

### C1. Add robots.ts
**Effort: 15 min | Impact: Crawlability, AI search visibility**

Create `src/app/robots.ts`:

```ts
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/" },
      { userAgent: "GPTBot", allow: "/" },
      { userAgent: "OAI-SearchBot", allow: "/" },
      { userAgent: "ClaudeBot", allow: "/" },
      { userAgent: "PerplexityBot", allow: "/" },
    ],
    sitemap: "https://tb-data-xi.vercel.app/sitemap.xml",
  };
}
```

---

### C2. Deploy sitemap.ts (already written)
**Effort: 0 min (push & deploy) | Impact: Google & AI crawler URL discovery**

`src/app/sitemap.ts` is already written covering 667 URLs. Push and deploy.

---

### C3. Add generateMetadata() to all dynamic routes
**Effort: 2–3 hours | Impact: Every page gets a unique title + description**

**`src/app/tests/[slug]/page.tsx`** — add:
```ts
export async function generateMetadata({ params }: { params: { slug: string } }) {
  const sheet = getTestBySlug(params.slug);
  if (!sheet) return {};
  const topResult = sheet.rows[0];
  return {
    title: `${sheet.name} Test Results — Real-World EV Data | TB Test Results`,
    description: `Real-world EV ${sheet.name.toLowerCase()} benchmarks from Bjørn Nyland's tests. ${sheet.rows.length} vehicles tested. Top result: ${topResult?.vehicle} at ${topResult?.value} ${sheet.unit}.`,
    openGraph: {
      title: `${sheet.name} Test Results — Bjørn Nyland EV Data`,
      description: `${sheet.rows.length} EVs tested. Top: ${topResult?.vehicle}.`,
      type: "website",
    },
  };
}
```

**`src/app/vehicles/[slug]/page.tsx`** — add:
```ts
export async function generateMetadata({ params }: { params: { slug: string } }) {
  const profile = getVehicleProfile(params.slug);
  if (!profile) return {};
  return {
    title: `${profile.name} — EV Test Results | TB Test Results`,
    description: `Bjørn Nyland's real-world test results for the ${profile.name}: range, acceleration, braking, noise, cargo and more across all test categories.`,
    openGraph: {
      title: `${profile.name} EV Test Results`,
      description: `All test data for the ${profile.name} from Bjørn Nyland's standardised EV tests.`,
      type: "website",
    },
  };
}
```

---

### C4. Add WebSite + Dataset JSON-LD to layout
**Effort: 1 hour | Impact: Google Dataset Search indexing, site entity, E-E-A-T**

Add to `src/app/layout.tsx` inside `<head>`:

```tsx
<Script
  id="schema-website"
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "TB Test Results Explorer",
      "url": "https://tb-data-xi.vercel.app",
      "potentialAction": {
        "@type": "SearchAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": "https://tb-data-xi.vercel.app/vehicles/{search_term_string}"
        },
        "query-input": "required name=search_term_string"
      }
    })
  }}
/>
<Script
  id="schema-dataset"
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Dataset",
      "name": "Bjørn Nyland EV Test Results",
      "description": "1,986 real-world EV test entries across 14 test categories for 663 distinct electric vehicle models, collected by Bjørn Nyland.",
      "url": "https://tb-data-xi.vercel.app",
      "keywords": ["electric vehicle", "EV range test", "EV acceleration", "Bjørn Nyland", "battery degradation"],
      "creator": {
        "@type": "Person",
        "name": "Bjørn Nyland",
        "url": "https://docs.google.com/spreadsheets/d/1V6ucyFGKWuSQzvI8lMzvvWJHrBS82echMVJH37kwgjE/"
      },
      "isAccessibleForFree": true,
      "measurementTechnique": "Standardized real-world road tests"
    })
  }}
/>
```

---

### C5. Add About/Methodology page
**Effort: 2–3 hours | Impact: E-E-A-T, AI citability, trust signals**

Create `src/app/about/page.tsx`. Content must cover:
- Who Bjørn Nyland is and his YouTube channel
- What makes his test methodology distinct (fixed speeds, same banana box, consistent conditions)
- Description of each test type
- Who built this site and why
- Data provenance (Google Sheets link, update frequency)
- Contact information or GitHub link

This single page would do more for E-E-A-T than all schema changes combined.

---

## HIGH — Fix within 1 week

### H1. Add llms.txt
**Effort: 30 min | Impact: AI search citability, dataset description**

Create `public/llms.txt`:

```
# TB Test Results Explorer
> A structured dataset of Bjørn Nyland's real-world EV test results across 14 test categories and 663+ electric vehicle models.

## Data Source
Raw data by Bjørn Nyland (YouTube: @bjornnyland). Original spreadsheet: https://docs.google.com/spreadsheets/d/1V6ucyFGKWuSQzvI8lMzvvWJHrBS82echMVJH37kwgjE/

## Coverage
- 1,986 test entries across 663 distinct EV models
- 14 test categories: range (90 km/h), acceleration (0–100 km/h), braking, interior noise, weight, cargo (banana box), 1000 km challenge, 500 km challenge, Sunday drive, battery degradation, zero-mile buffer, Arctic Circle, Bangkok heat, Geilo mountain
- Updated periodically from source spreadsheet

## Citing this data
Cite as: Bjørn Nyland EV Test Data, aggregated at https://tb-data-xi.vercel.app
Original data by Bjørn Nyland.
```

---

### H2. Add security headers to next.config.ts
**Effort: 30 min | Impact: Security, trust signals**

```ts
const nextConfig: NextConfig = {
  reactCompiler: true,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};
```

---

### H3. Fix H1/H2 hierarchy
**Effort: 1 hour | Impact: Heading structure, keyword signals**

- Change sidebar "TB Test Results" from `<h1>` to a styled `<p>` or `<div>`
- Make each page's main content heading the true `<h1>`
- Enrich headings: "Range" → "Real-World EV Range Test Results", "Banana" → "EV Cargo Volume Test (Banana Box)"

---

### H4. Add prose summaries to test pages
**Effort: 3–4 hours | Impact: Thin content, AI citability, E-E-A-T**

Each `/tests/[slug]` page needs a 150–200 word server-rendered paragraph above the data table. Example for Range:

> "Bjørn Nyland's range test drives each EV at a constant 90 km/h on public roads until the battery reaches 0%, measuring real-world range under controlled conditions. As of March 2026, the Lucid Air Dream Edition Performance holds the top result at 714 km. The average across all tested configurations is approximately 380 km. Winter conditions reduce range by 20–40% depending on the vehicle. All results link to Bjørn Nyland's original YouTube test videos."

This prose is what AI systems will quote when answering "which EV has the longest range."

---

### H5. Add OG image + root Open Graph tags
**Effort: 1–2 hours | Impact: Social sharing, click-through rates**

Add to root `layout.tsx` metadata:
```ts
openGraph: {
  siteName: "TB Test Results Explorer",
  type: "website",
  images: [{ url: "/og-image.png", width: 1200, height: 630 }],
},
twitter: {
  card: "summary_large_image",
  title: "TB Test Results Explorer",
  description: "Interactive explorer for Bjørn Nyland's EV test data",
},
robots: {
  index: true,
  follow: true,
  "max-snippet": -1,
  "max-image-preview": "large",
},
```

Create a 1200×630px OG image in `/public/og-image.png`.

---

### H6. Add internal links from test tables to vehicle pages
**Effort: 2 hours | Impact: Crawlability, PageRank distribution**

In `TestSheetView`, make vehicle names in the results table clickable links to `/vehicles/[slug]`. This connects 14 test pages to 663 vehicle pages, dramatically improving crawl depth.

---

### H7. Lazy-load Recharts
**Effort: 1 hour | Impact: LCP improvement (Critical path)**

Wrap all chart components with `next/dynamic`:
```ts
const DashboardRadar = dynamic(() => import("@/components/DashboardRadar"), { ssr: false });
```
This removes ~180KB from the initial JS bundle and unblocks first paint.

---

## MEDIUM — Fix within 1 month

### M1. Add BreadcrumbList + CollectionPage schema to test pages
**Effort: 2 hours | Impact: Rich snippets, navigation signals**

Add server-rendered JSON-LD to each `/tests/[slug]/page.tsx` using the pattern from the schema audit. Include top 10 vehicles in `ItemList`.

### M2. Add data freshness timestamps
**Effort: 1 hour | Impact: Freshness signals, trust**

Surface "Last updated: [date]" on each test page. Read from the data files or Git. Add `dateModified` to page metadata.

### M3. Add FAQ content
**Effort: 2 hours | Impact: Informational search queries, AI citations**

Create an FAQ section or page covering:
- "What is the banana test?"
- "How does Bjørn Nyland measure EV range?"
- "What EV has the longest real-world range?"
- "What does the 1000 km challenge measure?"

Add `FAQPage` JSON-LD schema to the FAQ page.

### M4. Memoize chart data transforms
**Effort: 2 hours | Impact: INP improvement**

Wrap filter/sort/aggregate operations in `useMemo`. Use `startTransition` for filter state updates.

### M5. Move EV data to server-only, pass minimal props to client
**Effort: 4 hours | Impact: LCP, bundle size, AI crawlability**

The core architectural fix: keep page-level data fetch as Server Component, extract a static summary Server Component (top result, count, prose paragraph), and pass only the filtered/paginated data slice the client needs for interaction.

### M6. Switch font display to `optional`
**Effort: 15 min | Impact: CLS, LCP**

In Inter and Space Grotesk font config, change `display: 'swap'` to `display: 'optional'`.

---

## LOW — Backlog

### L1. Add canonical tags
Add `alternates: { canonical: url }` to all `generateMetadata()` exports once C3 is done.

### L2. Virtualize data tables
For routes rendering 650+ rows, add `react-window` or `react-virtual`.

### L3. Tree-shake Recharts imports
Import only specific components used to save 20–40KB.

### L4. Add `<meta name="author">` and `rel="author"` link
Point to Bjørn Nyland's YouTube or the Google Sheets source.

### L5. Add `<figure>/<figcaption>` around charts
Adds semantic context for crawlers and accessibility.

---

## Implementation Roadmap

| Week | Items | Expected Score Gain |
|---|---|---|
| Week 1 | C1, C2 (deploy sitemap), C3, C4 | +15 pts (Technical + On-Page) |
| Week 2 | C5, H1, H2, H3, H4 | +12 pts (Content + E-E-A-T) |
| Week 3 | H5, H6, H7, M1 | +8 pts (Performance + Schema) |
| Week 4 | M2–M6 | +5 pts (refinement) |
| **Target score after 1 month** | | **~68 / 100** |
