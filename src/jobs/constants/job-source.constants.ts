import { JobSource } from '../enums/job-source.enum';

export const ALL_JOB_SOURCES = Object.values(JobSource);

/** Maps query `source` tokens to JobSource (canonical keys from enum values). */
export const SOURCE_QUERY_ALIASES: Record<string, JobSource> = {
  ...Object.fromEntries(ALL_JOB_SOURCES.map((source) => [source, source])),
  // Accept ?source=civilservice without the hyphen
  civilservice: JobSource.CivilService,
};
