var RuleService = {
  loadRules: function (spreadsheet, rulesSheetName) {
    var sh = spreadsheet.getSheetByName(rulesSheetName);
    if (!sh) return [];
    var values = sh.getDataRange().getValues();
    var rows = [];

    for (var i = 1; i < values.length; i++) {
      var type = String(values[i][0] || '').trim();
      var pattern = String(values[i][1] || '');
      var value = String(values[i][2] || '');
      var enabled = ConfigService.toBool(values[i][3], true);
      var priority = Number(values[i][4] || 9999);
      if (!type || !enabled) continue;
      rows.push({ type: type, pattern: pattern, value: value, priority: priority });
    }

    return rows.sort(function (a, b) { return a.priority - b.priority; });
  },

  apply: function (normalizedUrls, rules) {
    var out = [];

    for (var i = 0; i < normalizedUrls.length; i++) {
      var url = normalizedUrls[i];
      var parsed = new URL(url);
      var path = parsed.pathname || '/';
      var includeFlag = true;
      var excludeReason = '';
      var pageType = '';

      for (var j = 0; j < rules.length; j++) {
        var r = rules[j];
        if (r.type === CONSTANTS.RULE_TYPES.EXCLUDE_CONTAINS && url.indexOf(r.pattern) >= 0) {
          includeFlag = false;
          excludeReason = 'exclude_contains:' + r.pattern;
          break;
        }
        if (r.type === CONSTANTS.RULE_TYPES.EXCLUDE_REGEX) {
          try {
            if (new RegExp(r.pattern).test(url)) {
              includeFlag = false;
              excludeReason = 'exclude_regex:' + r.pattern;
              break;
            }
          } catch (e) {}
        }
      }

      if (includeFlag) {
        for (var k = 0; k < rules.length; k++) {
          var rr = rules[k];
          if (rr.type === CONSTANTS.RULE_TYPES.PAGE_TYPE_PREFIX && path.indexOf(rr.pattern) === 0) {
            pageType = rr.value;
            break;
          }
          if (rr.type === CONSTANTS.RULE_TYPES.PAGE_TYPE_EXACT && path === rr.pattern) {
            pageType = rr.value;
            break;
          }
        }
      }

      out.push({
        url: url,
        includeFlag: includeFlag,
        excludeReason: excludeReason,
        pageType: pageType
      });
    }

    return out;
  }
};
