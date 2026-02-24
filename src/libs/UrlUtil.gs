var UrlUtil = {
  normalize: function (rawUrl, options) {
    if (!rawUrl) return null;

    var opt = options || {};
    var includeQuery = !!opt.include_query_urls;
    var includeHash = !!opt.include_hash_urls;

    var parsed;
    try {
      parsed = new URL(String(rawUrl).trim());
    } catch (e) {
      return null;
    }

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }

    if (!includeHash) parsed.hash = '';
    if (!includeQuery) parsed.search = '';

    if (opt.force_https && parsed.protocol === 'http:' && parsed.hostname === opt.domain_host) {
      parsed.protocol = 'https:';
    }

    if (!opt.keep_trailing_slash && parsed.pathname.length > 1) {
      parsed.pathname = parsed.pathname.replace(/\/$/, '');
    }

    return parsed.toString();
  },

  toRow: function (index, url, meta, sourceSitemap) {
    var parsed = new URL(url);
    var segments = parsed.pathname.split('/').filter(function (x) { return !!x; });
    var depth = segments.length;

    return [
      index + 1,
      url,
      parsed.pathname || '/',
      depth,
      segments[0] || '',
      segments[1] || '',
      segments[2] || '',
      segments[segments.length - 1] || '',
      meta && meta.status ? meta.status : '',
      meta && meta.title ? meta.title : '',
      meta && meta.pageType ? meta.pageType : '',
      meta && typeof meta.includeFlag !== 'undefined' ? meta.includeFlag : true,
      meta && meta.excludeReason ? meta.excludeReason : '',
      meta && meta.notes ? meta.notes : '',
      sourceSitemap || ''
    ];
  }
};
