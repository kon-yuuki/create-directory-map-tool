var CONSTANTS = {
  DEFAULTS: {
    sitemap_mode: 'auto',
    output_sheet_name: 'Pages',
    log_sheet_name: 'Logs',
    rules_sheet_name: 'Rules',
    fetch_title: true,
    fetch_status: true,
    include_query_urls: false,
    include_hash_urls: false,
    clear_before_write: true,
    max_url_count: 5000,
    request_method: 'get'
  },
  EXECUTION_MODES: {
    SITEMAP_ONLY: 'sitemap_only',
    SITEMAP_PLUS_PAGE_FETCH: 'sitemap_plus_page_fetch'
  },
  PAGE_HEADERS: [
    'No', 'URL', 'Path', 'Depth', 'Level1', 'Level2', 'Level3', 'LastSegment',
    'Status', 'Title', 'PageType', 'IncludeFlag', 'ExcludeReason', 'Notes', 'SourceSitemap'
  ],
  LOG_HEADERS: [
    'ExecutedAt', 'Executor', 'Domain', 'SpreadsheetId', 'SitemapCount',
    'ExtractedUrlCount', 'OutputUrlCount', 'ErrorCount', 'Result', 'Code', 'Message'
  ],
  RULE_TYPES: {
    EXCLUDE_CONTAINS: 'exclude_contains',
    EXCLUDE_REGEX: 'exclude_regex',
    PAGE_TYPE_PREFIX: 'page_type_prefix',
    PAGE_TYPE_EXACT: 'page_type_exact'
  },
  ERROR_CODES: {
    ROBOTS_FETCH_FAILED: 'E001_ROBOTS_FETCH_FAILED',
    SITEMAP_NOT_FOUND: 'E002_SITEMAP_NOT_FOUND',
    SITEMAP_PARSE_FAILED: 'E003_SITEMAP_PARSE_FAILED',
    SHEET_ACCESS_DENIED: 'E004_SHEET_ACCESS_DENIED',
    URLFETCH_TIMEOUT: 'E005_URLFETCH_TIMEOUT',
    HTTP_FETCH_FAILED: 'E006_HTTP_FETCH_FAILED',
    QUOTA_EXCEEDED: 'E007_QUOTA_EXCEEDED',
    EXECUTION_TIMEOUT: 'E008_EXECUTION_TIMEOUT',
    LOCKED_BY_OTHER_JOB: 'E009_LOCKED_BY_OTHER_JOB',
    UNKNOWN: 'E010_UNKNOWN'
  }
};
