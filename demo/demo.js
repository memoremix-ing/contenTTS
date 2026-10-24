import { mountContenTTS, selectionShortcutLabel, shortcutLabel } from "../src/contentts.js";

const { reader, shortcut, selectionShortcut } = mountContenTTS({ root: document.querySelector("main") });

const mac = /mac/i.test(navigator.userAgentData?.platform || navigator.platform || "");
document.querySelector("#shortcut").textContent = shortcutLabel(shortcut, mac);
document.querySelector("#selection-shortcut").textContent = selectionShortcutLabel(selectionShortcut, mac);

const button = document.querySelector("#read");
button.addEventListener("click", () => reader.toggle());
reader.addEventListener("change", () => {
  button.textContent = reader.state === "idle" ? "Speech Mode" : reader.state === "paused" ? "Resume" : "Pause";
});

// For trying things from the console.
window.reader = reader;
