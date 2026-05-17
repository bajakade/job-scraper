# Anti-bot measures

## User-Agent and HTTP headers

HTTP does not require a `User-Agent`, but this app sets a browser-like value
(`BROWSER_USER_AGENT` in `src/jobs/scrapers/http.util.ts`) on purpose.

### Why not rely on defaults?

- **Axios / Node** sends a library-specific agent (e.g. `axios/1.x`) if unset.
  That is easy for CDNs and WAFs to treat as a bot.
- **Puppeteer (headless)** defaults to a string containing `HeadlessChrome`,
  which bot checks often flag even when other stealth measures are enabled.

### Where it is used

| Location | Purpose |
|----------|---------|
| `createHttpClient()` | NHS Jobs via Axios — reduces CloudFront 403s |
| `page.setUserAgent()` | Civil Service Jobs via Puppeteer — aligns with stealth plugin |
| `Accept` / `Accept-Language` | Makes NHS requests look like a normal browser visit |

### Can we remove it?

- **NHS:** risky; scraping may still work from some networks, but 403s are more
  likely without a realistic agent.
- **Civil Service:** Puppeteer + stealth is the main defence; custom UA is extra
  hardening, not a substitute for passing the ALTCHA challenge.

## NHS Jobs (jobs.nhs.uk)

- **Protection:** AWS CloudFront may return 403 for some automated clients (IP or
  header dependent). Search results are server-rendered HTML.
- **Approach:** Axios with a browser-like `User-Agent` and Cheerio parsing.
  Sort uses `publicationDateDesc` (“Date Posted (newest)”). One page returns 10
  jobs.
- **Mitigation:** Browser-like `User-Agent` and headers (see above), 30s timeout,
  no aggressive parallel requests.

## Civil Service Jobs (civilservicejobs.service.gov.uk)

- **Protection:** “Quick Check Needed” gate with **ALTCHA** (`/protect/main.js`).
  Plain Axios receives 403 or the challenge page without a session.
- **Approach:** Puppeteer + `puppeteer-extra-plugin-stealth`. Click **Continue**
  after the challenge button is enabled, submit `ID_context_search_form`, then
  set sort to `opening` (“Most recent”) and parse `li.search-results-job-box`
  with Cheerio.
- **Mitigation:** Puppeteer stealth + shared `BROWSER_USER_AGENT`, wait up to
  120s for challenge completion, one page at a time.

## Rate limiting

Scrapers run sequentially per source inside each request. Avoid scheduling
frequent calls against these public sites.
