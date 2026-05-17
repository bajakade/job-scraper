import * as cheerio from 'cheerio';

import {
  NHS_SELECTORS,
  NHS_TEST_IDS,
  byTestId,
} from '../constants/nhs-jobs.selectors';
import { cleanText, createHttpClient } from './http.util';

import type { AnyNode } from 'domhandler';
import { JobListing } from '../types/job-listing.types';
import { JobSource } from '../enums/job-source.enum';

type ResultCard = cheerio.Cheerio<AnyNode>;

const NHS_BASE = 'https://www.jobs.nhs.uk';
const NHS_SEARCH_URL = `${NHS_BASE}/candidate/search/results?sort=publicationDateDesc&page=1`;

const parseField = ($card: ResultCard, testId: string): string => {
  const strong = $card.find(`${byTestId(testId)} strong`).first();
  if (strong.length) {
    return cleanText(strong.text());
  }
  const li = $card.find(byTestId(testId)).first();
  return cleanText(li.text().replace(/^[^:]+:\s*/i, ''));
};

const parseLocation = ($card: ResultCard): string => {
  const block = $card.find(NHS_SELECTORS.location).first();
  if (!block.length) {
    return 'N/A';
  }
  const employer = cleanText(
    block.find('h3').first().contents().first().text(),
  );
  const place = cleanText(block.find(NHS_SELECTORS.locationPlace).text());
  if (employer && place) {
    return `${employer}, ${place}`;
  }
  return employer || place || cleanText(block.text());
};

export const scrapeNhsJobs = async (limit = 10): Promise<JobListing[]> => {
  const client = createHttpClient();
  const { data: html } = await client.get<string>(NHS_SEARCH_URL);
  const $ = cheerio.load(html);
  const jobs: JobListing[] = [];

  $(NHS_SELECTORS.resultCard).each((_, element) => {
    if (jobs.length >= limit) {
      return false;
    }

    const $card = $(element);
    const titleLink = $card.find(NHS_SELECTORS.jobTitle).first();
    const href = titleLink.attr('href') ?? '';
    const url = href.startsWith('http') ? href : `${NHS_BASE}${href}`;
    const refMatch = href.match(/jobadvert\/([^?]+)/);
    const reference = refMatch?.[1];

    jobs.push({
      source: JobSource.Nhs,
      title: cleanText(titleLink.text()),
      location: parseLocation($card),
      salary: parseField($card, NHS_TEST_IDS.salary),
      closingDate: parseField($card, NHS_TEST_IDS.closingDate),
      url,
      reference,
    });
  });

  return jobs;
};
