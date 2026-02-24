var SheetService = {
  openSpreadsheet: function (sheetInput) {
    try {
      if (/^https?:\/\//.test(sheetInput)) return SpreadsheetApp.openByUrl(sheetInput);
      return SpreadsheetApp.openById(sheetInput);
    } catch (e) {
      throw AppError.fatal(CONSTANTS.ERROR_CODES.SHEET_ACCESS_DENIED, 'failed to open spreadsheet: ' + e.message);
    }
  },

  ensureSheet: function (spreadsheet, name) {
    var sh = spreadsheet.getSheetByName(name);
    if (!sh) sh = spreadsheet.insertSheet(name);
    return sh;
  },

  writePages: function (spreadsheet, rows, options) {
    var sh = SheetService.ensureSheet(spreadsheet, options.output_sheet_name);

    if (options.clear_before_write) {
      sh.clearContents();
    }

    var allRows = [CONSTANTS.PAGE_HEADERS].concat(rows);
    sh.getRange(1, 1, allRows.length, CONSTANTS.PAGE_HEADERS.length).setValues(allRows);
  }
};
