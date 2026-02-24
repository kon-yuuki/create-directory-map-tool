function doGet() {
  return HtmlService.createTemplateFromFile('ui/Index')
    .evaluate()
    .setTitle('Site Map Inventory Tool');
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function runFromWeb(formData) {
  return executeSiteMapInventory(formData || {});
}

function executeSiteMapInventory(input) {
  var lock = LockService.getScriptLock();
  var locked = lock.tryLock(1000);

  if (!locked) {
    return {
      ok: false,
      result: 'FAILED',
      code: CONSTANTS.ERROR_CODES.LOCKED_BY_OTHER_JOB,
      message: '現在ほかの実行が進行中です。'
    };
  }

  var spreadsheet = null;
  var options = null;

  try {
    spreadsheet = SheetService.openSpreadsheet(String(input.sheet || input.spreadsheet || input.spreadsheetId || ''));
    options = ConfigService.fromSheet(spreadsheet, input);

    var initialSitemaps = RobotsService.getSitemapUrls(options.domain, options.manual_sitemap_urls, options.sitemap_mode);
    var collected = SitemapService.collectUrls(initialSitemaps, options.max_url_count);

    var host = new URL(options.domain).hostname;
    var normalizedUrls = collected.urls
      .map(function (u) {
        return UrlUtil.normalize(u, {
          include_query_urls: options.include_query_urls,
          include_hash_urls: options.include_hash_urls,
          force_https: true,
          domain_host: host,
          keep_trailing_slash: false
        });
      })
      .filter(function (u) { return !!u; });

    normalizedUrls = ArrayUtil.unique(normalizedUrls);

    var rules = RuleService.loadRules(spreadsheet, options.rules_sheet_name);
    var ruleAppliedRows = RuleService.apply(normalizedUrls, rules);

    var metaByUrl = PageFetchService.fetchPageMeta(ruleAppliedRows, options);

    var rows = [];
    var errorCount = 0;
    for (var i = 0; i < ruleAppliedRows.length; i++) {
      var item = ruleAppliedRows[i];
      var meta = metaByUrl[item.url] || item;
      if (meta.notes) errorCount += 1;
      rows.push(UrlUtil.toRow(i, item.url, meta, collected.sourceMap[item.url] || ''));
    }

    SheetService.writePages(spreadsheet, rows, options);

    var result = errorCount > 0 ? 'PARTIAL' : 'SUCCESS';
    var message = 'Processed ' + rows.length + ' URLs';

    LogService.append(spreadsheet, options, {
      spreadsheetId: spreadsheet.getId(),
      sitemapCount: collected.sitemapCount,
      extractedUrlCount: collected.urls.length,
      outputUrlCount: rows.length,
      errorCount: errorCount,
      result: result,
      code: '',
      message: message
    });

    return {
      ok: true,
      result: result,
      message: message,
      outputUrlCount: rows.length,
      errorCount: errorCount
    };
  } catch (e) {
    var code = e.code || CONSTANTS.ERROR_CODES.UNKNOWN;
    var msg = e.message || 'unexpected error';

    if (spreadsheet && options) {
      try {
        LogService.append(spreadsheet, options, {
          spreadsheetId: spreadsheet.getId(),
          result: 'FAILED',
          errorCount: 1,
          code: code,
          message: msg
        });
      } catch (ignore) {}
    }

    return {
      ok: false,
      result: 'FAILED',
      code: code,
      message: msg
    };
  } finally {
    lock.releaseLock();
  }
}
