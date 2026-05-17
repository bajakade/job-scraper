# scrape-app

NestJS API that scrapes the latest job listings from [NHS Jobs](https://www.jobs.nhs.uk)
and [Civil Service Jobs](https://www.civilservicejobs.service.gov.uk), returning
structured JSON (title, location, salary, closing date, and more).

## What it does

- Fetches the **10 most recently posted** jobs per source (configurable via query).
- **NHS Jobs** — Axios + Cheerio on server-rendered search results (`sort=publicationDateDesc`).
- **Civil Service Jobs** — Puppeteer (stealth) to pass the ALTCHA challenge, then Cheerio parse (`sort=opening`).

Each job includes: `source`, `title`, `location`, `salary`, `closingDate`, optional `url` and `reference`.

## API

### `GET /jobs/scrape`

| Query param | Aliases | Default | Description |
|-------------|---------|---------|-------------|
| `limit` | `count` | `10` | Jobs per source (max `50`) |
| `source` | `sources`, `scope` | both | `nhs`, `civil-service`, or comma-separated |

**Examples**

```bash
# Default: 10 jobs from NHS + Civil Service
curl http://localhost:3000/jobs/scrape

# NHS only, 5 jobs
curl 'http://localhost:3000/jobs/scrape?limit=5&source=nhs'

# Civil Service only
curl 'http://localhost:3000/jobs/scrape?source=civil-service'
```

**Sample response**

```json
{
  "scrapedAt": "2026-05-16T12:00:00.000Z",
  "limit": 10,
  "sources": ["nhs", "civil-service"],
  "nhsJobs": [
    {
      "source": "nhs",
      "title": "District Nurse",
      "location": "Reading RG18 3HD",
      "salary": "£39,959 to £48,117 a year",
      "closingDate": "22 May 2026",
      "url": "https://www.jobs.nhs.uk/candidate/jobadvert/...",
      "reference": "C9371-26-0259"
    }
  ],
  "civilServiceJobs": [],
  "antiBotNotes": []
}
```

Invalid `limit` or `source` values return `400 Bad Request`.

## Clone

Repository: [github.com/bajakade/jop-scraper](https://github.com/bajakade/jop-scraper)

**SSH** (recommended if you use GitHub SSH keys):

```bash
git clone git@github.com:bajakade/jop-scraper.git
cd jop-scraper
```

**HTTPS**:

```bash
git clone https://github.com/bajakade/jop-scraper.git
cd jop-scraper
```

Then install dependencies and start the API (see [Setup](#setup) and [Run locally](#run-locally)).

## Prerequisites

- **Node.js** 20+ (22 recommended)
- **npm**
- For Civil Service scraping: Chromium (installed automatically with `puppeteer` on most setups; Linux servers may need [extra dependencies](https://pptr.dev/troubleshooting#chrome-not-found))

## Setup

```bash
npm install
```

## Run locally

```bash
# Development (watch mode)
npm run start:dev

# Production build + run
npm run build
npm run start:prod
```

The server listens on port **3000** unless `PORT` is set:

```bash
PORT=4000 npm run start:prod
```

## Test

**Unit tests** (query parser, no live scraping):

```bash
npm test
```

**Single suite:**

```bash
npm test -- --testPathPatterns=scrape-query
```

**Coverage:**

```bash
npm run test:cov
```

**Manual smoke** (requires network; Civil Service can take 1–2 minutes):

```bash
npm run start:dev
curl -s http://localhost:3000/jobs/scrape | jq .
curl -s 'http://localhost:3000/jobs/scrape?source=nhs&limit=3' | jq .
```

**E2E** — the default [`test/app.e2e-spec.ts`](test/app.e2e-spec.ts) only hits `GET /`; it does not exercise `/jobs/scrape`.

## Deploy

1. Build on the target machine (or in CI):

   ```bash
   npm ci
   npm run build
   ```

2. Run the compiled app:

   ```bash
   NODE_ENV=production PORT=3000 node dist/main
   ```

   Or use the npm script:

   ```bash
   npm run start:prod
   ```

3. **Process manager** — use systemd, PM2, or your platform’s Node hosting so the process restarts on failure.

4. **Puppeteer on Linux** — install Chromium dependencies if headless Chrome fails at runtime (see Puppeteer troubleshooting link above).

5. **Rate limiting** — avoid hammering the public job sites; scrape on demand or on a modest schedule. See [ANTI_BOT.md](ANTI_BOT.md).

There is no Dockerfile in this repo yet; container deploys should use a Node image with Chromium deps for Puppeteer.

## Project layout

```
src/jobs/
  constants/     # limits, selectors, source aliases
  enums/         # JobSource
  parsers/       # query string → ScrapeOptions
  scrapers/      # NHS (Axios/Cheerio), Civil Service (Puppeteer)
  types/         # JobListing, ScrapeResponse, query types
  jobs.controller.ts
  jobs.service.ts
```

DOM selectors live in `constants/*.selectors.ts` — update these if the sites change markup.

## Scraping notes

Bot protection, headers, and known limitations are documented in [ANTI_BOT.md](ANTI_BOT.md).

## License

UNLICENSED (private project).
