var RobotsService = {
  getSitemapUrls: function (domain, manualSitemapUrls, sitemapMode) {
    if (sitemapMode === 'manual' && manualSitemapUrls.length) {
      return ArrayUtil.unique(manualSitemapUrls);
    }

    var robotsUrl = domain.replace(/\/$/, '') + '/robots.txt';
    var res;

    try {
      res = UrlFetchApp.fetch(robotsUrl, { muteHttpExceptions: true, followRedirects: true });
    } catch (e) {
      throw AppError.fatal(CONSTANTS.ERROR_CODES.ROBOTS_FETCH_FAILED, 'failed to fetch robots.txt: ' + e.message);
    }

    if (res.getResponseCode() >= 400) {
      throw AppError.fatal(CONSTANTS.ERROR_CODES.ROBOTS_FETCH_FAILED, 'robots.txt status: ' + res.getResponseCode());
    }

    var lines = String(res.getContentText() || '').split(/\r?\n/);
    var urls = [];
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i].trim();
      if (!/^sitemap:/i.test(line)) continue;
      var sitemapUrl = line.replace(/^sitemap:\s*/i, '').trim();
      if (sitemapUrl) urls.push(sitemapUrl);
    }

    urls = urls.concat(manualSitemapUrls || []);
    urls = ArrayUtil.unique(urls);

    if (!urls.length) {
      throw AppError.fatal(CONSTANTS.ERROR_CODES.SITEMAP_NOT_FOUND, 'no sitemap urls found');
    }

    return urls;
  }
};
