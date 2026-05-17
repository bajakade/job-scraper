import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { JobSource } from '../src/jobs/enums/job-source.enum';
import { JobsService } from '../src/jobs/jobs.service';
import { AppModule } from '../src/app.module';

describe('Jobs scrape (e2e)', () => {
  let app: INestApplication<App>;
  const scrapeAll = jest.fn();

  beforeEach(async () => {
    scrapeAll.mockResolvedValue({
      scrapedAt: '2026-01-01T00:00:00.000Z',
      limit: 2,
      sources: [JobSource.Nhs],
      nhsJobs: [],
      civilServiceJobs: [],
      antiBotNotes: [],
    });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(JobsService)
      .useValue({
        scrapeAll,
        onModuleDestroy: jest.fn(),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('passes limit and source query params to scrapeAll', async () => {
    await request(app.getHttpServer())
      .get('/jobs/scrape?source=nhs&limit=2')
      .expect(200);

    expect(scrapeAll).toHaveBeenCalledWith({
      limit: 2,
      sources: [JobSource.Nhs],
    });
  });

  it('defaults when query params are omitted', async () => {
    await request(app.getHttpServer()).get('/jobs/scrape').expect(200);

    expect(scrapeAll).toHaveBeenCalledWith({
      limit: 10,
      sources: [JobSource.Nhs, JobSource.CivilService],
    });
  });
});
