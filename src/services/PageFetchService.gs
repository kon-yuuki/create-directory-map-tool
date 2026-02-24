var PageFetchService = {
  fetchPageMeta: function (ruleAppliedRows, options) {
    var out = {};

    for (var i = 0; i < ruleAppliedRows.length; i++) {
      var row = ruleAppliedRows[i];
      var url = row.url;
      var meta = {
        includeFlag: row.includeFlag,
        excludeReason: row.excludeReason,
        pageType: row.pageType,
        status: '',
        title: ''
      };

      if (!row.includeFlag || (!options.fetch_status && !options.fetch_title)) {
        out[url] = meta;
        continue;
      }

      try {
        var res = UrlFetchApp.fetch(url, {
          method: options.request_method === 'head' ? 'head' : 'get',
          muteHttpExceptions: true,
          followRedirects: true
        });

        if (options.fetch_status) {
          meta.status = res.getResponseCode();
        }

        if (options.fetch_title && options.request_method !== 'head') {
          var html = String(res.getContentText() || '');
          var m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
          if (m && m[1]) meta.title = m[1].replace(/\s+/g, ' ').trim();
        }
      } catch (e) {
        meta.notes = CONSTANTS.ERROR_CODES.HTTP_FETCH_FAILED + ':' + e.message;
      }

      out[url] = meta;
    }

    return out;
  }
};
