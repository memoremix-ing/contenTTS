import { mountContenTTS } from "../src/contentts.js";

const { reader } = mountContenTTS({ root: document.querySelector("main") });

const button = document.querySelector("#read");
button.addEventListener("click", () => reader.toggle());
reader.addEventListener("change", () => {
  button.textContent = reader.state === "idle" ? "Speech Mode" : reader.state === "paused" ? "Resume" : "Pause";
});

// For trying things from the console.
window.reader = reader;
