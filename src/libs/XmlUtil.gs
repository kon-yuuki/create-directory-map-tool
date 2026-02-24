var XmlUtil = {
  parse: function (xmlText) {
    return XmlService.parse(xmlText);
  },

  getDescendantsByLocalName: function (root, localName) {
    var out = [];

    function walk(node) {
      if (!node || node.getType() !== XmlService.ContentTypes.ELEMENT) return;
      var el = node.asElement();
      if (el.getName() === localName) out.push(el);
      var children = el.getContent();
      for (var i = 0; i < children.length; i++) {
        walk(children[i]);
      }
    }

    walk(root);
    return out;
  },

  firstText: function (element, localName) {
    var children = XmlUtil.getDescendantsByLocalName(element, localName);
    if (!children.length) return '';
    return String(children[0].getText() || '').trim();
  }
};
