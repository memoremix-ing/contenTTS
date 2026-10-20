// Run with `node --test`. Needs nothing but Node.

import assert from "node:assert/strict";
import { test } from "node:test";

import { pointAt, sentences, wordAt, words } from "../src/text.js";

/** The text of each found span, which reads better than offsets. */
const texts = (text, spans) => spans.map(({ start, end }) => text.slice(start, end));

test("splits sentences, trimmed, leaving out ones with nothing to say", () => {
  const text = "  Marking a hunk stages it.   Sending it back unstages it!\n\n…\n\nDone?  ";
  assert.deepEqual(texts(text, sentences(text, "en")), ["Marking a hunk stages it.", "Sending it back unstages it!", "Done?"]);
});

test("does not end a sentence at an abbreviation's full stop", () => {
  const text = "Ask Dr. Moore, e.g. by mail. Mr. Smith met Mrs. Jones at 3 p.m. on Main St. yesterday. Then wait.";
  assert.deepEqual(texts(text, sentences(text, "en")), [
    "Ask Dr. Moore, e.g. by mail.",
    "Mr. Smith met Mrs. Jones at 3 p.m. on Main St. yesterday.",
    "Then wait.",
  ]);
  // Only English titles are known; elsewhere the browser's breaks stand.
  assert.equal(sentences("Dr. Moore.", "de").length, 2);
});

test("cuts a long sentence at word boundaries, none longer than the limit", () => {
  const text = Array.from({ length: 40 }, (_, i) => `word${i}`).join(" ");
  const found = sentences(text, "en", 50);
  assert.ok(found.length > 1);
  for (const piece of texts(text, found)) {
    assert.ok(piece.length <= 50, piece);
    assert.match(piece, /^word\d+( word\d+)*$/);
  }
  assert.equal(texts(text, found).join(" "), text);
});

test("keeps a single word longer than the limit whole", () => {
  const text = "a".repeat(80);
  assert.deepEqual(texts(text, sentences(text, "en", 50)), [text]);
});

test("finds words, and the word at or after an offset", () => {
  const text = "projj never commits: ever.";
  assert.deepEqual(texts(text, words(text, "en")), ["projj", "never", "commits", "ever"]);
  assert.equal(texts(text, [wordAt(text, 6, "en")])[0], "never");
  assert.equal(texts(text, [wordAt(text, 19, "en")])[0], "ever");
  assert.equal(wordAt(text, 26, "en"), null);
});

test("maps offsets to nodes, stepping over breaks the right way", () => {
  // "Hello" + <b>"world"</b> + <br> + "again"
  const [a, b, c] = ["a", "b", "c"];
  const pieces = [
    { node: a, start: 0, length: 5 },
    { node: b, start: 5, length: 5 },
    { node: null, start: 10, length: 1 },
    { node: c, start: 11, length: 5 },
  ];
  assert.deepEqual(pointAt(pieces, 0), { node: a, offset: 0 });
  assert.deepEqual(pointAt(pieces, 7), { node: b, offset: 2 });
  // Where two nodes meet, a range starts in the later one and ends in the earlier one.
  assert.deepEqual(pointAt(pieces, 5, "start"), { node: b, offset: 0 });
  assert.deepEqual(pointAt(pieces, 5, "end"), { node: a, offset: 5 });
  // In a break: forward to start, back to end.
  assert.deepEqual(pointAt(pieces, 10, "start"), { node: c, offset: 0 });
  assert.deepEqual(pointAt(pieces, 10, "end"), { node: b, offset: 5 });
  assert.deepEqual(pointAt(pieces, 16, "end"), { node: c, offset: 5 });
});
