import {
  ALL_JOB_SOURCES,
  SOURCE_QUERY_ALIASES,
} from '../constants/job-source.constants';
import {
  DEFAULT_SCRAPE_LIMIT,
  MAX_SCRAPE_LIMIT,
} from '../constants/scrape-query.constants';
import {
  JobSource,
  ScrapeOptions,
  ScrapeQueryParams,
  ScrapeQueryValue,
} from '../types/scrape-query.types';

import { BadRequestException } from '@nestjs/common';

const readFirst = (value?: ScrapeQueryValue): string | undefined => {
  if (!value) {
    return;
  }
  return Array.isArray(value) ? value[0] : value;
};

const parseLimit = (query: ScrapeQueryParams = {}): number => {
  const raw = query.limit ?? query.count;
  const value = readFirst(raw);

  if (!value) {
    return DEFAULT_SCRAPE_LIMIT;
  }

  const limit = Number.parseInt(value, 10);

  if (!Number.isFinite(limit) || limit < 1) {
    throw new BadRequestException(
      'limit must be a positive integer (query: limit or count)',
    );
  }

  if (limit > MAX_SCRAPE_LIMIT) {
    throw new BadRequestException(`limit must not exceed ${MAX_SCRAPE_LIMIT}`);
  }

  return limit;
};

const parseSourceToken = (token: string): JobSource => {
  const source = SOURCE_QUERY_ALIASES[token.trim().toLowerCase()];

  if (!source) {
    throw new BadRequestException(
      `Unknown source "${token}". Use: ${ALL_JOB_SOURCES.join(', ')}`,
    );
  }

  return source;
};

const parseSources = (query: ScrapeQueryParams = {}): JobSource[] => {
  const raw = query.source ?? query.sources ?? query.scope;

  if (!raw) {
    return [...ALL_JOB_SOURCES];
  }

  const tokens = (Array.isArray(raw) ? raw : [raw])
    .flatMap((entry) => entry.split(','))
    .map((entry) => entry.trim())
    .filter(Boolean);

  if (!tokens.length) {
    return [...ALL_JOB_SOURCES];
  }

  return [...new Set(tokens.map(parseSourceToken))];
};

export const parseScrapeQuery = (
  query: ScrapeQueryParams = {},
): ScrapeOptions => ({
  limit: parseLimit(query),
  sources: parseSources(query),
});
