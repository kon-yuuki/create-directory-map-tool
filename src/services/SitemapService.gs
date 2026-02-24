var SitemapService = {
  collectUrls: function (sitemapUrls, maxUrlCount) {
    var queue = sitemapUrls.slice();
    var visitedSitemaps = new Set();
    var urls = [];
    var urlToSource = {};
    var recursionLimit = 300;

    while (queue.length && visitedSitemaps.size < recursionLimit && urls.length < maxUrlCount) {
      var sitemapUrl = queue.shift();
      if (visitedSitemaps.has(sitemapUrl)) continue;
      visitedSitemaps.add(sitemapUrl);

      var xml;
      try {
        var res = UrlFetchApp.fetch(sitemapUrl, { muteHttpExceptions: true, followRedirects: true });
        if (res.getResponseCode() >= 400) continue;
        xml = res.getContentText();
      } catch (e) {
        continue;
      }

      var parsed;
      try {
        parsed = XmlUtil.parse(xml);
      } catch (e2) {
        throw AppError.fatal(CONSTANTS.ERROR_CODES.SITEMAP_PARSE_FAILED, 'failed to parse sitemap xml: ' + sitemapUrl);
      }

      var root = parsed.getRootElement();
      var rootName = root.getName();

      if (rootName === 'sitemapindex') {
        var sitemapNodes = XmlUtil.getDescendantsByLocalName(root, 'sitemap');
        for (var i = 0; i < sitemapNodes.length; i++) {
          var childLoc = XmlUtil.firstText(sitemapNodes[i], 'loc');
          if (childLoc && !visitedSitemaps.has(childLoc)) queue.push(childLoc);
        }
      }

      if (rootName === 'urlset') {
        var urlNodes = XmlUtil.getDescendantsByLocalName(root, 'url');
        for (var j = 0; j < urlNodes.length && urls.length < maxUrlCount; j++) {
          var loc = XmlUtil.firstText(urlNodes[j], 'loc');
          if (!loc) continue;
          if (!urlToSource[loc]) {
            urlToSource[loc] = sitemapUrl;
            urls.push(loc);
          }
        }
      }
    }

    return {
      urls: urls,
      sourceMap: urlToSource,
      sitemapCount: visitedSitemaps.size
    };
  }
};
