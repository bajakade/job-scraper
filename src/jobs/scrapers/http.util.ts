import axios, { AxiosInstance } from 'axios';

/** Chrome-like UA — avoids Axios/Node defaults that trigger NHS CloudFront 403s. */
export const BROWSER_USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) ' +
  'AppleWebKit/537.36 (KHTML, like Gecko) ' +
  'Chrome/124.0.0.0 Safari/537.36';

/** HTTP client for NHS Jobs. Headers documented in ANTI_BOT.md. */
export const createHttpClient = (): AxiosInstance =>
  axios.create({
    timeout: 30_000,
    maxRedirects: 5,
    headers: {
      'User-Agent': BROWSER_USER_AGENT,
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-GB,en;q=0.9',
    },
    validateStatus: (status) => status >= 200 && status < 400,
  });

export const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const cleanText = (value: string): string =>
  value.replace(/\s+/g, ' ').trim();
