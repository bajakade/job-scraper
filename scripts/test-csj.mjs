import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';

puppeteer.use(StealthPlugin());

const CSJ_INDEX = 'https://www.civilservicejobs.service.gov.uk/csr/index.cgi';
const jar = new CookieJar();
const client = wrapper(axios.create({ jar, timeout: 30000 }));

const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.goto(CSJ_INDEX, { waitUntil: 'networkidle2', timeout: 120000 });

for (let i = 0; i < 30; i++) {
  if (await page.$('form[id="ID_context_search_form"]')) break;
  const w = await page.$('altcha-widget');
  if (w) await w.click().catch(() => {});
  const btn = await page.$('button[type="submit"]');
  if (btn) {
    const ok = await btn.evaluate((el) => {
      const s = getComputedStyle(el);
      return s.display !== 'none' && !el.disabled;
    });
    if (ok) {
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 }).catch(() => {}),
        btn.click(),
      ]);
    }
  }
  await new Promise((r) => setTimeout(r, 1500));
}

const cookies = await page.cookies();
for (const c of cookies) {
  await jar.setCookie(`${c.name}=${c.value}`, 'https://www.civilservicejobs.service.gov.uk');
}

const indexHtml = await page.content();
const $index = cheerio.load(indexHtml);
const form = $index('form[id="ID_context_search_form"]');
const action = form.attr('action') || CSJ_INDEX;
const actionUrl = action.startsWith('http')
  ? action
  : `https://www.civilservicejobs.service.gov.uk${action.startsWith('/') ? action : `/csr/${action}`}`;

const params = new URLSearchParams();
form.find('input, select').each((_, el) => {
  const $el = $index(el);
  const name = $el.attr('name');
  if (!name) return;
  params.append(name, $el.attr('value') ?? '');
});

console.log('posting to', actionUrl);
const { data: resultsHtml } = await client.post(actionUrl, params.toString(), {
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  },
});

const $r = cheerio.load(resultsHtml);
console.log('title tag:', $r('title').text());
console.log('jobs:', $r('li.search-results-job-box').length);

await browser.close();
