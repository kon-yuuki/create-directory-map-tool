var LogService = {
  append: function (spreadsheet, options, payload) {
    var sh = SheetService.ensureSheet(spreadsheet, options.log_sheet_name);

    if (sh.getLastRow() === 0) {
      sh.getRange(1, 1, 1, CONSTANTS.LOG_HEADERS.length).setValues([CONSTANTS.LOG_HEADERS]);
    }

    var userEmail = '';
    try {
      userEmail = Session.getActiveUser().getEmail();
    } catch (e) {}

    sh.appendRow([
      new Date(),
      userEmail,
      options.domain,
      payload.spreadsheetId || '',
      payload.sitemapCount || 0,
      payload.extractedUrlCount || 0,
      payload.outputUrlCount || 0,
      payload.errorCount || 0,
      payload.result || '',
      payload.code || '',
      payload.message || ''
    ]);
  }
};
