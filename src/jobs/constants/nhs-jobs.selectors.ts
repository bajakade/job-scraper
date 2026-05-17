export const NHS_SELECTORS = {
  resultCard: 'li[data-test="search-result"]',
  jobTitle: '[data-test="search-result-job-title"]',
  location: '[data-test="search-result-location"]',
  locationPlace: '.location-font-size',
} as const;

export const NHS_TEST_IDS = {
  salary: 'search-result-salary',
  closingDate: 'search-result-closingDate',
} as const;

export const byTestId = (testId: string): string => `[data-test="${testId}"]`;
