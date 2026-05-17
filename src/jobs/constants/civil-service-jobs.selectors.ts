export const CSJ_SELECTORS = {
  jobBox: 'li.search-results-job-box',
  titleLink: '.search-results-job-box-title a',
  location: '.search-results-job-box-location',
  salary: '.search-results-job-box-salary',
  closingDate: '.search-results-job-box-closingdate',
  refcode: '.search-results-job-box-refcode',
  searchForm: 'form[id="ID_context_search_form"]',
  sortForm: '#results_sort_form',
  sortSelect: '#results_sort_form select[name="sort"]',
  altchaWidget: 'altcha-widget',
  submitButton: 'button[type="submit"]',
} as const;

export const CSJ_SORT_MOST_RECENT = 'opening';
