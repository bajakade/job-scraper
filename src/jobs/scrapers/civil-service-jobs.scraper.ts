import * as cheerio from 'cheerio';
import {
  CSJ_SELECTORS,
  CSJ_SORT_MOST_RECENT,
} from '../constants/civil-service-jobs.selectors';
import { JobSource } from '../enums/job-source.enum';
import { JobListing } from '../types/job-listing.types';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { BROWSER_USER_AGENT, cleanText, delay } from './http.util';
import { passCivilServiceChallenge } from './browser.util';

puppeteer.use(StealthPlugin());

const CSJ_INDEX = 'https://www.civilservicejobs.service.gov.uk/csr/index.cgi';
const CSJ_BASE = 'https://www.civilservicejobs.service.gov.uk';

const parseResultsHtml = (html: string, limit: number): JobListing[] => {
  const $ = cheerio.load(html);
  const jobs: JobListing[] = [];

  $(CSJ_SELECTORS.jobBox).each((_, element) => {
    if (jobs.length >= limit) {
      return false;
    }

    const $box = $(element);
    const titleLink = $box.find(CSJ_SELECTORS.titleLink).first();
    const href = titleLink.attr('href') ?? '';
    const url = href.startsWith('http') ? href : `${CSJ_BASE}${href}`;
    const refText = cleanText($box.find(CSJ_SELECTORS.refcode).text());
    const reference = refText.replace(/^Reference\s*:\s*/i, '');

    jobs.push({
      source: JobSource.CivilService,
      title: cleanText(titleLink.text()),
      location: cleanText($box.find(CSJ_SELECTORS.location).text()).replace(
        /^Location\s*:\s*/i,
        '',
      ),
      salary: cleanText($box.find(CSJ_SELECTORS.salary).text()).replace(
        /^Salary\s*:\s*/i,
        '',
      ),
      closingDate: cleanText($box.find(CSJ_SELECTORS.closingDate).text()).replace(
        /^Closes\s*:\s*/i,
        '',
      ),
      url,
      reference: reference || undefined,
    });
  });

  return jobs;
};

const submitSearch = async (page: import('puppeteer').Page) => {
  await page.waitForSelector(CSJ_SELECTORS.searchForm, {
    timeout: 60_000,
  });
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 90_000 }),
    page.evaluate((searchFormSelector) => {
      const form = document.querySelector<HTMLFormElement>(searchFormSelector);
      form?.submit();
    }, CSJ_SELECTORS.searchForm),
  ]);
};

const sortByMostRecent = async (page: import('puppeteer').Page) => {
  const hasSort = await page.$(CSJ_SELECTORS.sortSelect);
  if (!hasSort) {
    return;
  }

  await page.select(CSJ_SELECTORS.sortSelect, CSJ_SORT_MOST_RECENT);
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 90_000 }),
    page.evaluate((sortFormSelector) => {
      const form = document.querySelector<HTMLFormElement>(sortFormSelector);
      form?.submit();
    }, CSJ_SELECTORS.sortForm),
  ]);
};

const scrapeWithPage = async (
  page: import('puppeteer').Page,
  limit: number,
): Promise<JobListing[]> => {
  await page.goto(CSJ_INDEX, {
    waitUntil: 'networkidle2',
    timeout: 120_000,
  });
  await passCivilServiceChallenge(page);
  await submitSearch(page);
  await passCivilServiceChallenge(page);

  await page
    .waitForSelector(CSJ_SELECTORS.jobBox, { timeout: 60_000 })
    .catch(() => undefined);

  await sortByMostRecent(page);
  await page
    .waitForSelector(CSJ_SELECTORS.jobBox, { timeout: 60_000 })
    .catch(() => undefined);

  await delay(500);
  return parseResultsHtml(await page.content(), limit);
};

export const scrapeCivilServiceJobs = async (
  limit = 10,
): Promise<JobListing[]> => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-blink-features=AutomationControlled'],
  });

  try {
    const page = await browser.newPage();
    // See ANTI_BOT.md — browser-like UA for Puppeteer / ALTCHA flow.
    await page.setUserAgent(BROWSER_USER_AGENT);
    return await scrapeWithPage(page, limit);
  } finally {
    await browser.close();
  }
};
