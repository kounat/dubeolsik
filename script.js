import {
  commitBlock,
  deleteBlock,
  deleteSelection,
  focusField,
  insertJamo,
  insertLiteral,
  prepareField,
} from "./field.js";
import {
  addKeyboardListeners,
  createKeyboard,
  IGNORE_KEYS,
  jamoByCode,
} from "./keyboard.js";

const IME_TOGGLE_ID = "ime-toggle";
let imeEnabled = true;

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
