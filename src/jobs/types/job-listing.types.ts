import { JobSource } from '../enums/job-source.enum';

export { JobSource };

export type JobListing = {
  source: JobSource;
  title: string;
  location: string;
  salary: string;
  closingDate: string;
  url?: string;
  reference?: string;
};

export type ScrapeResponse = {
  scrapedAt: string;
  limit: number;
  sources: JobSource[];
  nhsJobs: JobListing[];
  civilServiceJobs: JobListing[];
  antiBotNotes: string[];
};
