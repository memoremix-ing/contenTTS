import { mountReadAloud } from "../src/read-aloud.js";

const { reader } = mountReadAloud({ root: document.querySelector("main") });

const button = document.querySelector("#read");
button.addEventListener("click", () => reader.toggle());
reader.addEventListener("change", () => {
  button.textContent = reader.state === "idle" ? "Read aloud" : reader.state === "paused" ? "Resume" : "Pause";
});

// For trying things from the console.
window.reader = reader;
