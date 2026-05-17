import { JobSource } from '../enums/job-source.enum';

export { JobSource };

/** Raw query-string value from Express (single or repeated param). */
export type ScrapeQueryValue = string | string[];

/**
 * Accepted query parameters for GET /jobs/scrape.
 * All fields optional — omit entirely for defaults (limit 10, all sources).
 */
export interface ScrapeQueryParams {
  limit?: string;
  count?: string;
  source?: ScrapeQueryValue;
  sources?: ScrapeQueryValue;
  scope?: ScrapeQueryValue;
}

/** Parsed, validated scrape request (used by JobsService). */
export interface ScrapeOptions {
  limit: number;
  sources: JobSource[];
}
