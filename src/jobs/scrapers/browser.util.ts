import { CSJ_SELECTORS } from '../constants/civil-service-jobs.selectors';
import { BROWSER_USER_AGENT, delay } from './http.util';
import type { Browser, Page } from 'puppeteer';

import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import puppeteer from 'puppeteer-extra';

puppeteer.use(StealthPlugin());

let browserPromise: Promise<Browser> | null = null;

const launchBrowser = (): Promise<Browser> =>
  puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-blink-features=AutomationControlled'],
  });

export const getBrowser = (): Promise<Browser> => {
  if (!browserPromise) {
    browserPromise = launchBrowser();
  }
  return browserPromise;
};

export const closeBrowser = async (): Promise<void> => {
  if (browserPromise) {
    const browser = await browserPromise;
    await browser.close();
    browserPromise = null;
  }
};

export const resetBrowser = async (): Promise<void> => {
  await closeBrowser();
  browserPromise = launchBrowser();
};

export const newPage = async (): Promise<Page> => {
  const browser = await getBrowser();
  const page = await browser.newPage();
  // Match http.util — avoids HeadlessChrome fingerprint (see ANTI_BOT.md).
  await page.setUserAgent(BROWSER_USER_AGENT);
  return page;
};

const isPastChallenge = async (page: Page): Promise<boolean> => {
  const title = await page.title();
  if (!title.includes('Quick Check')) {
    return true;
  }
  if (await page.$(CSJ_SELECTORS.searchForm)) {
    return true;
  }
  if (await page.$(CSJ_SELECTORS.jobBox)) {
    return true;
  }
  return false;
};

export const passCivilServiceChallenge = async (page: Page): Promise<void> => {
  if (await isPastChallenge(page)) {
    return;
  }

  const deadline = Date.now() + 90_000;

  while (Date.now() < deadline) {
    if (await isPastChallenge(page)) {
      return;
    }

    const widget = await page.$(CSJ_SELECTORS.altchaWidget);
    if (widget) {
      await widget.click().catch(() => undefined);
    }

    const submitBtn = await page.$(CSJ_SELECTORS.submitButton);
    if (submitBtn) {
      const canClick = await submitBtn.evaluate((el) => {
        const style = window.getComputedStyle(el);
        return style.display !== 'none' && !el.disabled;
      });
      if (canClick) {
        await Promise.all([
          page
            .waitForNavigation({ waitUntil: 'networkidle2', timeout: 60_000 })
            .catch(() => undefined),
          submitBtn.click(),
        ]);
      }
    }

    await delay(1500);
  }

  throw new Error(
    'Civil Service Jobs ALTCHA challenge did not complete in time',
  );
};
