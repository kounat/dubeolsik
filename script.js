import {
  commitBlock,
  deleteBlock,
  deleteForward,
  deleteSelection,
  focusField,
  insertJamo,
  insertLiteral,
  moveCaret,
  prepareField,
} from "./field.js";
import {
  addKeyboardListeners,
  createKeyboard,
  IGNORE_KEYS,
  jamoByCode,
} from "./keyboard.js";

const IME_TOGGLE_ID = "ime-toggle";
const NAVIGATION_KEYS = new Set([
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "ArrowDown",
  "Home",
  "End",
  "PageUp",
  "PageDown",
]);
let imeEnabled = true;

// We handle every printable key plus Backspace/Delete/arrows so the field state and custom caret stay in sync (rather than letting the browser handle it natively).
// Anything we let through (e.g., System IME) is folded back in by `syncFromDOM` in field.js.
// This listens on `window`, so Backspace with focus elsewhere still edits the field.
function addInputListeners() {
  window.addEventListener("keydown", (event) => {
    if (IGNORE_KEYS.has(event.code)) return;

    // event.keyCode is deprecated, but there's no alternative.
    if (event.isComposing || event.keyCode === 229) {
      if (!event.isComposing) commitBlock();
      return;
    }

    if (event.code === "Enter") {
      event.preventDefault();
      commitBlock();
      return;
    }

    if (
      (event.code === "Backspace" || event.code === "Delete") &&
      deleteSelection()
    ) {
      event.preventDefault();
      return;
    }

    if (
      (event.code === "ArrowLeft" || event.code === "ArrowRight") &&
      !event.shiftKey &&
      !event.metaKey &&
      !event.ctrlKey &&
      !event.altKey &&
      moveCaret(event.code === "ArrowLeft" ? -1 : 1)
    ) {
      event.preventDefault();
      return;
    }

    if (NAVIGATION_KEYS.has(event.code)) {
      commitBlock();
      return;
    }

    if (
      event.code === "Delete" &&
      !event.metaKey &&
      !event.ctrlKey &&
      !event.altKey
    ) {
      event.preventDefault();
      deleteForward();
      return;
    }

    if (
      event.code === "Backspace" &&
      !event.metaKey &&
      !event.ctrlKey &&
      !event.altKey
    ) {
      event.preventDefault();
      deleteBlock();
      return;
    }

    if (
      event.key.length === 1 &&
      !event.metaKey &&
      !event.ctrlKey &&
      !event.altKey
    ) {
      event.preventDefault();
      deleteSelection();
      const jamo = imeEnabled ? jamoByCode[event.code] : null;
      if (jamo) {
        insertJamo(event.shiftKey ? jamo.shift : jamo.base);
      } else {
        insertLiteral(event.key);
      }
    }
  });
}

function prepareToggle() {
  const toggle = document.getElementById(IME_TOGGLE_ID);
  toggle.checked = true;
  imeEnabled = toggle.checked;
  toggle.addEventListener("change", () => {
    imeEnabled = toggle.checked;
    focusField();
  });
}

createKeyboard();
addKeyboardListeners();
addInputListeners();
prepareField();
prepareToggle();
