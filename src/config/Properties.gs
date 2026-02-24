var PropertiesStore = {
  getScriptDefaults: function () {
    var raw = PropertiesService.getScriptProperties().getProperty('DEFAULT_CONFIG_JSON');
    if (!raw) return {};
    try {
      return JSON.parse(raw);
    } catch (e) {
      return {};
    }
  }
};
