import assert from "node:assert/strict";
import test from "node:test";

import { DEFAULT_KEY, accelerator, matchesShortcut, shortcutKey, shortcutLabel } from "../src/shortcut.js";

const press = (key, mods = {}, code = `Key${key.toUpperCase()}`) => ({
  key, code, shiftKey: true, altKey: false, metaKey: false, ctrlKey: false, ...mods,
});

test("the option names a letter, the default, or none", () => {
  assert.equal(DEFAULT_KEY, "K");
  assert.equal(shortcutKey(), "K");
  assert.equal(shortcutKey(true), "K");
  assert.equal(shortcutKey("u"), "U");
  assert.equal(shortcutKey("J"), "J");
  assert.equal(shortcutKey(false), null);
  assert.equal(shortcutKey(null), null);
});

test("anything else is refused where it is set", () => {
  for (const bad of ["", "KK", "1", "Shift+K", "⌘", 75, {}, "é"]) {
    assert.throws(() => shortcutKey(bad), TypeError, JSON.stringify(bad));
  }
});

test("⌘⇧ and the letter on a Mac, Ctrl+Shift elsewhere", () => {
  assert.ok(matchesShortcut(press("K", { metaKey: true }), "K", true));
  assert.ok(matchesShortcut(press("K", { ctrlKey: true }), "K", false));
  // The other platform's modifier, or both, or Alt too, or no Shift: not it.
  assert.ok(!matchesShortcut(press("K", { ctrlKey: true }), "K", true));
  assert.ok(!matchesShortcut(press("K", { metaKey: true }), "K", false));
  assert.ok(!matchesShortcut(press("K", { metaKey: true, ctrlKey: true }), "K", true));
  assert.ok(!matchesShortcut(press("K", { metaKey: true, altKey: true }), "K", true));
  assert.ok(!matchesShortcut(press("k", { metaKey: true, shiftKey: false }), "K", true));
  assert.ok(!matchesShortcut(press("J", { metaKey: true }), "K", true));
  assert.ok(!matchesShortcut(press("K", { metaKey: true }), null, true));
});

test("the letter as the layout types it, else by its place", () => {
  // Dvorak types K where QWERTY has V: the letter typed is what counts.
  assert.ok(matchesShortcut(press("K", { ctrlKey: true }, "KeyV"), "K", false));
  assert.ok(!matchesShortcut(press("V", { ctrlKey: true }, "KeyK"), "K", false));
  // Cyrillic types Л there: no Latin letter, so the place counts.
  assert.ok(matchesShortcut(press("Л", { ctrlKey: true }, "KeyK"), "K", false));
});

test("labels and menu accelerators", () => {
  assert.equal(shortcutLabel("K", true), "⌘⇧K");
  assert.equal(shortcutLabel("K", false), "Ctrl+Shift+K");
  assert.equal(accelerator("K"), "CommandOrControl+Shift+K");
});
