# read-aloud

## Repository workflow

- Use jj for agent version control in this `track/.../sts-0/` workspace. The
  enclosing project's root `.git` is for humans; the sibling `.repo/`
  directory holds metadata and must not be edited or used for development.

## How the code is kept

- **No build step.** Every file in `src/` is served as written, so apps
  without a bundler can copy `src/` in with their page. Keep it plain
  JavaScript modules with relative imports and no dependencies.
- **`text.js` and `voices.js` need no DOM**, so `node --test` covers them.
  Keep logic that can be there, there, and test it.
- **Never change the page being read.** Highlights go through
  `CSS.highlights`, never through wrapping text in elements: apps re-render
  their pages, and an inserted element would fight that.
- **Never `innerHTML`.** The page's text is untrusted. The controls build
  their DOM with `createElement` and `textContent`.
- **Stored settings are untrusted.** Anything on the page's origin could have
  written them; `readSettings` checks every field before use.
- **Nothing goes over the network.** The Web Speech engine uses on-device
  voices where the system offers them. An engine that sends text anywhere
  must be one an app chooses explicitly, never a default.
- **Check changes in the engine apps use.** projj, the first user, draws its
  page with CEF; the Web Speech API differs between engines. Say which
  engines a change was tried in, and record untried ones as such.
