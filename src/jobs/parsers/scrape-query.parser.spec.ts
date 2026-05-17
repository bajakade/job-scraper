import { BadRequestException } from '@nestjs/common';
import { JobSource } from '../enums/job-source.enum';
import { parseScrapeQuery } from './scrape-query.parser';

describe('parseScrapeQuery', () => {
  it('defaults to all sources and limit 10 when query is omitted', () => {
    expect(parseScrapeQuery()).toEqual({
      limit: 10,
      sources: [JobSource.Nhs, JobSource.CivilService],
    });
    expect(parseScrapeQuery({})).toEqual({
      limit: 10,
      sources: [JobSource.Nhs, JobSource.CivilService],
    });
  });

  it('parses limit and single source', () => {
    expect(parseScrapeQuery({ limit: '5', source: 'nhs' })).toEqual({
      limit: 5,
      sources: [JobSource.Nhs],
    });
  });

  it('parses count alias and comma-separated sources', () => {
    expect(
      parseScrapeQuery({ count: '3', source: 'nhs,civil-service' }),
    ).toEqual({
      limit: 3,
      sources: [JobSource.Nhs, JobSource.CivilService],
    });
  });

  it('rejects unknown source', () => {
    expect(() => parseScrapeQuery({ source: 'indeed' })).toThrow(
      BadRequestException,
    );
  });
});
