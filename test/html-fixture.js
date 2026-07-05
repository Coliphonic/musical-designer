'use strict';
// A minimal HTML-fragment -> fake-DOM-node parser, scoped to exactly the tag
// vocabulary emphToHtml() produces (b, i, u, s, mark, br) plus text/entities.
// Not a general HTML parser — just enough structure (nodeType, nodeName,
// childNodes, dataset, nodeValue) for emphFromNode() to walk, so the
// text -> emphToHtml -> (parse) -> emphFromNode round trip is a genuine
// end-to-end check rather than two isolated assertions.
function decodeEntities(s) {
  return s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
}

function parseAttrs(attrStr) {
  const dataset = {};
  const re = /data-([a-z-]+)="([^"]*)"/g;
  let m;
  while ((m = re.exec(attrStr))) {
    const key = m[1].replace(/-([a-z])/g, (_x, c) => c.toUpperCase());
    dataset[key] = m[2];
  }
  return dataset;
}

function htmlToFakeNode(html) {
  const root = { nodeType: 1, nodeName: 'DIV', dataset: {}, childNodes: [] };
  const stack = [root];
  const tokenRe = /<(\/?)([a-zA-Z]+)([^>]*)>|([^<]+)/g;
  let m;
  while ((m = tokenRe.exec(html))) {
    const [, closing, tag, attrs, text] = m;
    const top = stack[stack.length - 1];
    if (text !== undefined) {
      top.childNodes.push({ nodeType: 3, nodeValue: decodeEntities(text) });
    } else if (closing) {
      if (stack.length > 1) stack.pop();
    } else {
      const node = { nodeType: 1, nodeName: tag.toUpperCase(), dataset: parseAttrs(attrs || ''), childNodes: [] };
      top.childNodes.push(node);
      if (!/\/>$/.test(attrs || '') && tag.toLowerCase() !== 'br') stack.push(node);
    }
  }
  return root;
}

module.exports = { htmlToFakeNode };
