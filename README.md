# TB Test Results Explorer

An interactive explorer for [Bjorn Nyland's](https://www.youtube.com/@bjornnyland) publicly available EV test data. Browse, compare, and visualize real-world electric vehicle performance data across 14 test categories and 650+ vehicles.

**Data source:** [TB Test Results spreadsheet](https://docs.google.com/spreadsheets/d/1V6ucyFGKWuSQzvI8lMzvvWJHrBS82echMVJH37kwgjE/edit?gid=244400016#gid=244400016)

## What's in here

- **Dashboard** -- overview stats and radar comparison across 6 key metrics
- **14 test categories** -- Range, Acceleration, Noise, Braking, Weight, Banana (cargo), Degradation, 1000 km challenge, 500 km challenge, Sunday drive, and route challenges (Arctic Circle, Bangkok, Geilo, Zero mile)
- **Vehicle profiles** -- every test result for a single car in one place, with rankings and percentiles
- **Find Your EV** -- set your priorities (range, cargo, noise, etc.) and get a ranked list of matches
- **Head-to-head comparison** -- side-by-side metrics for any two vehicles
- **YouTube video links** -- 113 vehicles link directly to Bjorn's test videos (sourced from Zerofy)

## Tech stack

- Next.js 16 (App Router) with React 19
- TypeScript
- Tailwind CSS 4
- Recharts for data visualizations
- Vitest for testing

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project structure

```
src/
  app/                    Route pages (dashboard, tests, vehicles, compare)
  components/
    dashboard/            Dashboard stats and radar chart
    tests/                Test sheet views and chart visualizations
    vehicles/             Vehicle profile page
    compare/              Weighted ranker and head-to-head comparison
  lib/
    data/                 Typed data access layer (tests, vehicles, comparison)
    utils/                Parsing, scoring, formatting helpers
    types.ts              Shared TypeScript interfaces
  data/
    tests/                JSON files per test category (generated)
    vehicles.json         Unified vehicle list (generated)
    video-links.json      YouTube video ID mappings
scripts/
  import-sheets.ts        Google Sheets CSV import pipeline
  scrape-zerofy-videos.ts Video link scraper
```

## Updating data

The test data lives as static JSON files in `src/data/`, generated from Bjorn's Google spreadsheet.

```bash
npm run import-data
```

A GitHub Action (`.github/workflows/update-data.yml`) runs this weekly and commits any changes automatically.

## Tests

```bash
npm test
```

## License

This project visualizes publicly available data collected and shared by Bjorn Nyland. The data itself belongs to him. This tool is an independent community project -- not affiliated with or endorsed by Bjorn Nyland.
