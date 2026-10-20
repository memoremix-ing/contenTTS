// Run with `node --test`. Needs nothing but Node.

import assert from "node:assert/strict";
import { test } from "node:test";

import { choose, couldBeBetter, groups, label, languages, rank, tier } from "../src/voices.js";

// As Chromium lists them on macOS (seen in CEF 147), plus one of Edge's online voices.
const voice = (name, lang, extra = {}) => ({ name, lang, voiceURI: name, localService: true, default: false, ...extra });
const ava = voice("Ava (Premium)", "en-US");
const zoe = voice("Zoe (Enhanced)", "en-US");
const samantha = voice("Samantha", "en-US", { default: true });
const daniel = voice("Daniel", "en-GB");
const eddy = voice("Eddy (English (United States))", "en-US");
const fred = voice("Fred", "en-US");
const bubbles = voice("Bubbles", "en-US");
const natural = voice("Microsoft Ava Online (Natural) - English (United States)", "en-US", { localService: false });
const thomas = voice("Thomas", "fr-FR");
const all = [bubbles, thomas, fred, daniel, eddy, samantha, zoe, ava, natural];

const names = (voices) => voices.map((v) => v.name);

test("sorts voices into tiers", () => {
  assert.equal(tier(ava), "premium");
  assert.equal(tier(natural), "premium");
  assert.equal(tier(zoe), "enhanced");
  assert.equal(tier(samantha), "standard");
  assert.equal(tier(daniel), "standard");
  assert.equal(tier(eddy), "basic");
  assert.equal(tier(fred), "basic");
  assert.equal(tier(bubbles), "novelty");
});

test("ranks by tier, then region, default, and on-device", () => {
  assert.deepEqual(names(rank([daniel, samantha, eddy, zoe], "en-US")), ["Zoe (Enhanced)", "Samantha", "Daniel", "Eddy (English (United States))"]);
  assert.deepEqual(names(rank([daniel, samantha], "en-GB")), ["Daniel", "Samantha"]);
  // Both premium: the on-device one first.
  assert.deepEqual(names(rank([natural, ava], "en-US")), ["Ava (Premium)", natural.name]);
});

test("groups a language's voices by tier, leaving out other languages", () => {
  assert.deepEqual(
    groups(all, "en-US").map((group) => [group.label, names(group.voices)]),
    [
      ["Premium", ["Ava (Premium)", natural.name]],
      ["Enhanced", ["Zoe (Enhanced)"]],
      ["Standard", ["Samantha", "Daniel"]],
      ["Basic", ["Eddy (English (United States))", "Fred"]],
      ["Novelty", ["Bubbles"]],
    ],
  );
  assert.deepEqual(groups(all, "fr").map((group) => names(group.voices)), [["Thomas"]]);
});

test("chooses the voice chosen before, else the best for the language", () => {
  assert.equal(choose(all, "en-US", "Daniel"), daniel);
  assert.equal(choose(all, "en-US", "Gone"), ava);
  assert.equal(choose(all, "en-US"), ava);
  assert.equal(choose(all, "fr-FR"), thomas);
  // Nothing for the language: the system's default.
  assert.equal(choose(all, "de-DE"), samantha);
  // Never a novelty voice, even alone.
  assert.equal(choose([bubbles, samantha], "en-US"), samantha);
  assert.equal(choose([], "en-US"), null);
});

test("says when better voices could be installed", () => {
  assert.equal(couldBeBetter(all, "en-US"), false);
  assert.equal(couldBeBetter([samantha, daniel], "en-US"), true);
  assert.equal(couldBeBetter(all, "fr-FR"), true);
});

test("labels voices with their region, without a language in the name", () => {
  assert.equal(label(eddy, "en"), "Eddy — United States");
  assert.equal(label(daniel, "en"), "Daniel — United Kingdom");
  assert.equal(label(ava, "en"), "Ava (Premium) — United States");
  assert.equal(label(voice("Kyoko", "ja"), "en"), "Kyoko");
});

test("lists the languages there are voices for, by name", () => {
  assert.deepEqual(languages(all, "en"), [{ code: "en", label: "English" }, { code: "fr", label: "French" }]);
});
