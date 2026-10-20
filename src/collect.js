// Finding the text to read on a page, and the DOM ranges it came from.

import { pointAt, sentences } from "./text.js";

/** Never read: code that is not text, form controls, media, and the reader's own controls. */
const SKIP_TAGS = new Set([
  "script", "style", "noscript", "template", "head", "title", "textarea", "input", "select", "option",
  "button", "svg", "math", "canvas", "video", "audio", "iframe", "object", "embed", "read-aloud-controls",
]);

/** Never read either, whatever the tag. Apps add their own with the `skip` option. */
const SKIP_SELECTOR = '[hidden], [inert], [aria-hidden="true"], [data-read-aloud="skip"]';

/**
 * The readable text under `root`, as blocks, one per run of text the page
 * lays out as a block (a paragraph, a list item, a table cell…):
 * `[{ text, pieces, sentences }]`. `pieces` maps the block's text back to
 * text nodes (see `pointAt` in text.js); `sentences` are offsets into `text`.
 */
export function collect(root, { lang, skip } = {}) {
  const selector = skip ? `${SKIP_SELECTOR}, ${skip}` : SKIP_SELECTOR;
  const blockOf = blockFinder(root);
  const blocks = [];
  let block = null;

  const walker = root.ownerDocument.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (node.nodeType === Node.TEXT_NODE) return node.data ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      if (SKIP_TAGS.has(node.localName) || node.matches(selector) || !visible(node)) return NodeFilter.FILTER_REJECT;
      return node.localName === "br" ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
    },
  });

  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const owner = blockOf(node.nodeType === Node.TEXT_NODE ? node.parentElement : node);
    if (!block || block.owner !== owner) {
      block = { owner, text: "", pieces: [] };
      blocks.push(block);
    }
    if (node.nodeType === Node.TEXT_NODE) {
      block.pieces.push({ node, start: block.text.length, length: node.data.length });
      // Same length, so offsets still line up with the node: new lines and
      // tabs read as the spaces the page shows them as.
      block.text += node.data.replace(/\s/g, " ");
    } else {
      block.pieces.push({ node: null, start: block.text.length, length: 1 });
      block.text += " ";
    }
  }

  return blocks
    .map(({ text, pieces }) => ({ text, pieces, sentences: pieces.some((piece) => piece.node) ? sentences(text, lang) : [] }))
    .filter((found) => found.sentences.length);
}

function visible(element) {
  if (typeof element.checkVisibility === "function") return element.checkVisibility({ visibilityProperty: true });
  return getComputedStyle(element).display !== "none";
}

/** Finds an element's block: the nearest element, itself included, that the page does not lay out inline. */
function blockFinder(root) {
  const known = new Map();
  return function blockOf(element) {
    const path = [];
    let found = root;
    for (let el = element; el && el !== root; el = el.parentElement) {
      if (known.has(el)) {
        found = known.get(el);
        break;
      }
      path.push(el);
      const display = getComputedStyle(el).display;
      if (!/^(inline|contents|ruby)/.test(display)) {
        found = el;
        break;
      }
    }
    // Every element on the way was laid out inline, or was the block itself.
    for (const el of path) known.set(el, found);
    return found;
  };
}

/** The DOM range for offsets `[start, end)` of a block, or `null` if its nodes have gone. */
export function rangeOf(block, start, end) {
  const from = pointAt(block.pieces, start, "start");
  const to = pointAt(block.pieces, end, "end");
  if (!from || !to || !from.node.isConnected || !to.node.isConnected) return null;
  const range = from.node.ownerDocument.createRange();
  range.setStart(from.node, from.offset);
  range.setEnd(to.node, to.offset);
  return range;
}

/** Whether a block still reads as it did when collected: all its nodes on the page, with the same text. */
export function intact(block) {
  return block.pieces.every((piece) => !piece.node || (piece.node.isConnected && piece.node.data.length === piece.length));
}
