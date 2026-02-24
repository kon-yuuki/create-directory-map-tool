var ConfigService = {
  fromSheet: function (spreadsheet, overrides) {
    var configSheet = spreadsheet.getSheetByName('Config');
    var values = configSheet ? configSheet.getDataRange().getValues() : [];
    var cfg = {};

    for (var i = 1; i < values.length; i++) {
      var key = values[i][0];
      var value = values[i][1];
      if (!key) continue;
      cfg[String(key).trim()] = value;
    }

    var scriptDefaults = PropertiesStore.getScriptDefaults();
    var merged = {};
    var defaults = CONSTANTS.DEFAULTS;
    var k;

    for (k in defaults) merged[k] = defaults[k];
    for (k in scriptDefaults) merged[k] = scriptDefaults[k];
    for (k in cfg) merged[k] = cfg[k];
    for (k in (overrides || {})) merged[k] = overrides[k];

    merged.domain = String(merged.domain || '').trim();
    merged.output_sheet_name = String(merged.output_sheet_name || defaults.output_sheet_name);
    merged.log_sheet_name = String(merged.log_sheet_name || defaults.log_sheet_name);
    merged.rules_sheet_name = String(merged.rules_sheet_name || defaults.rules_sheet_name);
    merged.sitemap_mode = String(merged.sitemap_mode || defaults.sitemap_mode);
    merged.fetch_title = ConfigService.toBool(merged.fetch_title, defaults.fetch_title);
    merged.fetch_status = ConfigService.toBool(merged.fetch_status, defaults.fetch_status);
    merged.include_query_urls = ConfigService.toBool(merged.include_query_urls, defaults.include_query_urls);
    merged.include_hash_urls = ConfigService.toBool(merged.include_hash_urls, defaults.include_hash_urls);
    merged.clear_before_write = ConfigService.toBool(merged.clear_before_write, defaults.clear_before_write);
    merged.max_url_count = Number(merged.max_url_count || defaults.max_url_count);
    merged.request_method = String(merged.request_method || defaults.request_method).toLowerCase();
    merged.manual_sitemap_urls = ConfigService.parseMultiline(merged.manual_sitemap_urls);

    if (!merged.domain) throw AppError.fatal(CONSTANTS.ERROR_CODES.SITEMAP_NOT_FOUND, 'Config.domain is required');

    return merged;
  },

  toBool: function (value, fallback) {
    if (typeof value === 'boolean') return value;
    if (value === 'TRUE' || value === 'true' || value === 1 || value === '1') return true;
    if (value === 'FALSE' || value === 'false' || value === 0 || value === '0') return false;
    return fallback;
  },

  parseMultiline: function (value) {
    if (!value) return [];
    return String(value)
      .split(/\r?\n/)
      .map(function (x) { return x.trim(); })
      .filter(function (x) { return !!x; });
  }
};
