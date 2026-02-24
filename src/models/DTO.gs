var AppError = {
  fatal: function (code, message) {
    var err = new Error(message);
    err.code = code;
    err.fatal = true;
    return err;
  }
};
