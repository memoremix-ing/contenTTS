# voice-overlay

voice-overlay reads pages in webviews to you: it highlights each sentence
and the word being spoken, keeps them on screen, and lets you pause, skip by
sentence, change the speed, and pick a voice. It is heavily inspired by Read
Aloud in Microsoft's Edge web browser, whose shortcut it borrows too. It is
made for apps built with [Electrobun](https://framework.blackboard.sh/electrobun),
but it is plain JavaScript for any page, with no build step and no
dependencies.

It speaks with the voices the system already has, through the Web Speech API
(`speechSynthesis`). So nothing is downloaded, nothing leaves the device, and
the voices are as good as the system's: on a Mac, download a Premium voice
(free, from Apple) and it sounds close to Edge's online voices.

## Use

```js
import { mountVoiceOverlay } from "voice-overlay";

const { reader } = mountVoiceOverlay({ root: document.querySelector("main") });
```

That adds the controls, which appear while reading, and Edge's shortcut:
⌘⇧U on a Mac, Ctrl+Shift+U elsewhere. Give the app a way in too, such as a
button or a menu item calling `reader.toggle()`. Reading starts from the
selection if there is one, else from the first sentence on screen. To move
reading elsewhere while it goes on, select some text and press the controls'
Read from selection button.

Pages without a bundler can load the files as they are. In an Electrobun app,
copy `src/` in with the page; nothing else is needed, and it works under a
Content-Security-Policy as strict as `default-src 'self'`. Electrobun copies
only from inside the project, so link it in first, as projj does with its
`web` folder:

```sh
ln -s ../../voice-overlay.git/sts-0/src voice-overlay   # in an app at track/<host>/<tenant>/<app>.git/sts-0/
```

```ts
// electrobun.config.ts
build: {
  copy: {
    "voice-overlay": "views/app/voice-overlay",
  },
},
```

```js
import { mountVoiceOverlay } from "/voice-overlay/voice-overlay.js";
```

### What is read

Everything under `root` the page shows, except form controls, buttons,
code that is not text (`script`, `style`, `svg`…), and anything hidden,
`inert`, `aria-hidden="true"`, or marked `data-voice-overlay="skip"`. Pass
`skip: "selector"` to leave out more. Each block (a paragraph, a list item, a
table cell) is read on its own, sentence by sentence.

The page's DOM is never changed: highlights use the CSS Custom Highlight API.
If the page renders again while being read, reading carries on from the same
sentence in the new DOM, or stops if that sentence is gone.

### Options

`mountVoiceOverlay(options)` takes these, and `container` (where the
controls go, default `document.body`) and `shortcut` (default `true`).
`new VoiceOverlay(options)` takes these alone, for apps that make their own
controls.

| Option | Default | |
| --- | --- | --- |
| `root` | `document.body` | What to read. |
| `lang` | the nearest `lang` attribute, else the browser's | The text's language, as in `en-US`. Picks the voice and splits sentences. |
| `skip` | none | A selector for more to leave unread. |
| `paragraph` | none | `(element) => value`: groups text into paragraphs other than by layout. Text whose elements give the same value is read as one paragraph, its parts joined with spaces; `undefined` goes by layout. For text the page breaks into lines that should read as prose, such as a diff of a Markdown file. |
| `storage` | `localStorage`, key `voice-overlay` | `{ load(), save(value) }` for the voice and speed, or `null` to keep them only while the page is open. |
| `follow` | `true` | Scroll to what is being read. Scrolling by hand holds the page for a few seconds. |
| `engine` | `new WebSpeech()` | Where speech comes from (see below). |

### The reader

`reader.start({ from, within })`, `pause()`, `resume()`, `toggle()`,
`next()`, `previous()`, `stop()`, `destroy()`. `start` reads from `from` (a
Range or Node) if given, else from the selection, else from the first
sentence on screen: within `within` (an element, such as the pane last
used) if given and it has any, else anywhere under `root`. Starting while
reading moves reading there. `reader.selection` is the text selected under
`root`, as a Range, or `null`.

`reader.state` is `"idle"`, `"starting"`, `"speaking"` or `"paused"`;
`reader.error` says why reading last stopped short, if it did. `reader.rate`
(0.5–3) can be set at any time, as can the voice with `reader.setVoice(voiceURI)`;
either starts again from the word being spoken. `reader.voices` lists the
system's voices, and `reader.voice` is the one in use.

It fires `change` whenever any of that changes, and `voices` when the system's
voices do.

### The controls

`<voice-overlay-controls>`, given a reader as its `reader` property. It shows
while reading, floating at the foot of the window. Add `placement="inline"`
to have it sit where it is put instead, without a frame, as in a toolbar,
and `persistent` to show it always. Its Read from selection button moves
reading to the selected text; it listens to the page only for
`selectionchange`, and leaves the selection as it was.

The voice picker lists the voices for a language (English by default, for an
English page), best first, grouped Premium, Enhanced, Standard, Basic and
Novelty. Picking one says a few words in it. Where a language has nothing
better than Standard, it explains how to get better voices on macOS and
Windows.

Highlights can be recolored with custom properties on the page:
`--voice-overlay-sentence`, `--voice-overlay-word` and `--voice-overlay-word-text`.

## Engines

An engine is anything with `voices()`, `speak(text, { voice, rate, lang,
onStart, onWord })`, `pause()`, `resume()` and `cancel()`; see `src/speech.js`.
The one there is the Web Speech API, which is enough wherever the system's
voices are. Tried on macOS:

- **CEF 147** (Electrobun 2.0.2, as in projj): voices including Premium ones,
  a boundary for every word, pause and resume. The first sentence can take
  about 2 seconds to start, the rest about 0.1 seconds.
- **Headless Chrome 154**: the same.

Not yet tried: WKWebView (Electrobun's native renderer on macOS), WebView2 on
Windows, and WebKitGTK on Linux. Siri voices are kept from other apps by
macOS, so they never appear.

Other engines could come from the app's main process, over its message
bridge, for voices a page cannot reach (cloud voices with the app's key, or a
local model).

## Develop

```sh
node --test                                     # needs nothing but Node
python3 -m http.server --bind 127.0.0.1 8000    # then open http://127.0.0.1:8000/demo/
```

`demo/` is a page with a CSP stricter than projj's, and text that must and
must not be read.
