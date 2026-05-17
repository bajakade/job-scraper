import { Controller, Get, Query } from '@nestjs/common';
import { parseScrapeQuery } from './parsers/scrape-query.parser';
import type { ScrapeResponse } from './types/job-listing.types';
import type { ScrapeQueryParams } from './types/scrape-query.types';
import { JobsService } from './jobs.service';

@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Get('scrape')
  scrape(@Query() query: ScrapeQueryParams = {}): Promise<ScrapeResponse> {
    return this.jobsService.scrapeAll(parseScrapeQuery(query));
  }
}
