import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { closeBrowser } from './scrapers/browser.util';
import { scrapeCivilServiceJobs } from './scrapers/civil-service-jobs.scraper';
import { scrapeNhsJobs } from './scrapers/nhs-jobs.scraper';
import { JobSource } from './enums/job-source.enum';
import type { ScrapeResponse } from './types/job-listing.types';
import type { ScrapeOptions } from './types/scrape-query.types';

@Injectable()
export class JobsService implements OnModuleDestroy {
  async scrapeAll(options: ScrapeOptions): Promise<ScrapeResponse> {
    const antiBotNotes: string[] = [];
    const { limit, sources } = options;
    const includeNhs = sources.includes(JobSource.Nhs);
    const includeCivilService = sources.includes(JobSource.CivilService);

    const nhsJobs = includeNhs
      ? await scrapeNhsJobs(limit).catch((error: Error) => {
          antiBotNotes.push(`NHS Jobs: ${error.message}`);
          return [];
        })
      : [];

    const civilServiceJobs = includeCivilService
      ? await scrapeCivilServiceJobs(limit).catch((error: Error) => {
          antiBotNotes.push(`Civil Service Jobs: ${error.message}`);
          return [];
        })
      : [];

    if (!antiBotNotes.length) {
      if (includeNhs) {
        antiBotNotes.push(
          'NHS Jobs: fetched with Axios/Cheerio (SSR HTML, sort=publicationDateDesc).',
        );
      }
      if (includeCivilService) {
        antiBotNotes.push(
          'Civil Service Jobs: Puppeteer with stealth plugin passes ALTCHA ' +
            'challenge, then Cheerio parse (sort=opening / Most recent).',
        );
      }
    }

    return {
      scrapedAt: new Date().toISOString(),
      limit,
      sources,
      nhsJobs,
      civilServiceJobs,
      antiBotNotes,
    };
  }

  async onModuleDestroy(): Promise<void> {
    await closeBrowser();
  }
}
