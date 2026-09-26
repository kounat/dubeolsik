import { backspace, EMPTY, render, step } from "./hangul.js";

// 60% ANSI keyboard - 두벌식 reference.
//
// code  - KeyboardEvent.code, defined in https://www.w3.org/TR/uievents-code/#key-alphanumeric-section
// label - 자모
// width - keycap width in "u" units; default is 1u. Reference from the presets in https://www.keyboard-layout-editor.com/#/
// shift - Optional references for keys when Shift is pressed
//
// Every row's widths should sum to 15u.

const KEYBOARD = [
  // 13 numbers (1u) + Backspace (2u)
  [
    { code: "Backquote", label: "`", shift: "~" },
    { code: "Digit1", label: "1", shift: "!" },
    { code: "Digit2", label: "2", shift: "@" },
    { code: "Digit3", label: "3", shift: "#" },
    { code: "Digit4", label: "4", shift: "$" },
    { code: "Digit5", label: "5", shift: "%" },
    { code: "Digit6", label: "6", shift: "^" },
    { code: "Digit7", label: "7", shift: "&" },
    { code: "Digit8", label: "8", shift: "*" },
    { code: "Digit9", label: "9", shift: "(" },
    { code: "Digit0", label: "0", shift: ")" },
    { code: "Minus", label: "-", shift: "_" },
    { code: "Equal", label: "=", shift: "+" },
    { code: "Backspace", label: "Delete", width: 2 },
  ],
  // Tab (1.5u) + 12 Letters (12u) + Backslash (1.5u)
  [
    { code: "Tab", label: "Tab", width: 1.5 },
    { code: "KeyQ", label: "ㅂ", shift: "ㅃ" },
    { code: "KeyW", label: "ㅈ", shift: "ㅉ" },
    { code: "KeyE", label: "ㄷ", shift: "ㄸ" },
    { code: "KeyR", label: "ㄱ", shift: "ㄲ" },
    { code: "KeyT", label: "ㅅ", shift: "ㅆ" },
    { code: "KeyY", label: "ㅛ" },
    { code: "KeyU", label: "ㅕ" },
    { code: "KeyI", label: "ㅑ" },
    { code: "KeyO", label: "ㅐ", shift: "ㅒ" },
    { code: "KeyP", label: "ㅔ", shift: "ㅖ" },
    { code: "BracketLeft", label: "[", shift: "{" },
    { code: "BracketRight", label: "]", shift: "}" },
    { code: "Backslash", label: "\\", shift: "|", width: 1.5 },
  ],
  // Caps (1.75u) + 11 Letters (11u) + Enter (2.25u)
  [
    { code: "CapsLock", label: "Caps", width: 1.75 },
    { code: "KeyA", label: "ㅁ" },
    { code: "KeyS", label: "ㄴ" },
    { code: "KeyD", label: "ㅇ" },
    { code: "KeyF", label: "ㄹ" },
    { code: "KeyG", label: "ㅎ" },
    { code: "KeyH", label: "ㅗ" },
    { code: "KeyJ", label: "ㅓ" },
    { code: "KeyK", label: "ㅏ" },
    { code: "KeyL", label: "ㅣ" },
    { code: "Semicolon", label: ";", shift: ":" },
    { code: "Quote", label: "'", shift: '"' },
    { code: "Enter", label: "Return", width: 2.25 },
  ],
  // LShift (2.25u) + 10 Letters (10u) + RShift (2.75u)
  [
    { code: "ShiftLeft", label: "Shift", width: 2.25 },
    { code: "KeyZ", label: "ㅋ" },
    { code: "KeyX", label: "ㅌ" },
    { code: "KeyC", label: "ㅊ" },
    { code: "KeyV", label: "ㅍ" },
    { code: "KeyB", label: "ㅠ" },
    { code: "KeyN", label: "ㅜ" },
    { code: "KeyM", label: "ㅡ" },
    { code: "Comma", label: ",", shift: "<" },
    { code: "Period", label: ".", shift: ">" },
    { code: "Slash", label: "/", shift: "?" },
    { code: "ShiftRight", label: "Shift", width: 2.75 },
  ],
  // 3 Controls (3.75u) + Space (6.25u) + 4 Controls (5u)
  [
    { code: "ControlLeft", label: "⌃", width: 1.25 },
    { code: "AltLeft", label: "⌥", width: 1.25 },
    { code: "MetaLeft", label: "⌘", width: 1.25 },
    { code: "Space", label: "", width: 6.25 },
    { code: "MetaRight", label: "⌘", width: 1.25 },
    { code: "AltRight", label: "⌥", width: 1.25 },
    { code: "ContextMenu", label: "", width: 1.25 },
    { code: "ControlRight", label: "⌃", width: 1.25 },
  ],
];

const KEYBOARD_DIV_ID = "keyboard";
const INPUT_ID = "input";
const IME_TOGGLE_ID = "ime-toggle";
const keyByCode = {};
let inputEl = null;
let imeEnabled = true;

let committedNode = null;
let composingSpan = null;
let caretEl = null;
let block = EMPTY;

// Checks if the character is in the Hangul Compatibility Jamo Unicode block.
function isJamo(label) {
  if (label.length !== 1) return false;
  const cp = label.codePointAt(0);
  return cp >= 0x3130 && cp <= 0x318f;
}

const jamoByCode = {};
for (const row of KEYBOARD) {
  for (const keyData of row) {
    if (!isJamo(keyData.label)) continue;
    jamoByCode[keyData.code] = {
      base: keyData.label,
      shift: keyData.shift ?? keyData.label,
    };
  }
}

function createKeyboard() {
  const root = document.getElementById(KEYBOARD_DIV_ID);
  for (const rowData of KEYBOARD) {
    const row = document.createElement("div");
    row.className = "row";
    root.append(row);

    for (const keyData of rowData) {
      const key = document.createElement("div");
      key.className = "key";
      key.textContent = BLANK_KEYS.has(keyData.code) ? "" : keyData.label;
      if (keyData.width) key.style.setProperty("--width", keyData.width);
      key.dataset.code = keyData.code;
      key.dataset.base = keyData.label;
      if (keyData.shift) key.dataset.shift = keyData.shift;
      keyByCode[keyData.code] = key;
      row.append(key);
    }
  }
}

function clearActiveKeys() {
  for (const key of Object.values(keyByCode)) {
    key.classList.remove("active");
  }
}

// Remove noise so that the 자모 stands out.
const BLANK_KEYS = new Set([
  "Backquote",
  "Digit1",
  "Digit2",
  "Digit3",
  "Digit4",
  "Digit5",
  "Tab",
  "Digit6",
  "Digit7",
  "Digit8",
  "Digit9",
  "Digit0",
  "Minus",
  "Equal",
  "CapsLock",
  "BracketLeft",
  "BracketRight",
  "Backslash",
  "Enter",
  "Semicolon",
  "Quote",
  "Comma",
  "Period",
  "Slash",
]);
const SHIFT_KEYS = new Set(["ShiftLeft", "ShiftRight"]);

// Caps is remapped to switch input source and never sends a clean keyup, so I'm ignoring it.
const IGNORE_KEYS = new Set(["CapsLock"]);

function setShiftLabels(showShift) {
  for (const key of Object.values(keyByCode)) {
    if (!key.dataset.shift) continue;
    if (BLANK_KEYS.has(key.dataset.code)) continue;
    key.textContent = showShift ? key.dataset.shift : key.dataset.base;
  }
}

function resetKeyboard() {
  clearActiveKeys();
  setShiftLabels(false);
}

function caretToEnd() {
  const range = document.createRange();
  range.selectNodeContents(inputEl);
  range.collapse(false);
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
  restartCaretBlink();
}

function restartCaretBlink() {
  for (const animation of caretEl.getAnimations()) animation.currentTime = 0;
}

function textOffset(node, offset) {
  const range = document.createRange();
  range.setStart(inputEl, 0);
  range.setEnd(node, offset);
  return range.toString().length;
}

function deleteSelection() {
  const selection = window.getSelection();
  if (selection.rangeCount === 0 || selection.isCollapsed) return false;
  const range = selection.getRangeAt(0);
  if (!inputEl.contains(range.commonAncestorContainer)) return false;

  const start = textOffset(range.startContainer, range.startOffset);
  const end = textOffset(range.endContainer, range.endOffset);
  const committed = committedNode.textContent;
  if (end <= committed.length) {
    committedNode.textContent =
      committed.slice(0, start) + committed.slice(end);
  } else {
    committedNode.textContent = committed.slice(0, start);
    composingSpan.textContent = "";
    block = EMPTY;
  }
  caretToEnd();
  return true;
}

function insertJamo(jamo) {
  if (document.activeElement !== inputEl) inputEl.focus();
  const { committed, state } = step(block, jamo);
  if (committed) committedNode.textContent += committed;
  block = state;
  composingSpan.textContent = render(block);
  caretToEnd();
}

function insertLiteral(ch) {
  if (document.activeElement !== inputEl) inputEl.focus();
  committedNode.textContent += render(block) + ch;
  composingSpan.textContent = "";
  block = EMPTY;
  caretToEnd();
}

function deleteBlock() {
  if (document.activeElement !== inputEl) inputEl.focus();
  const { state, deletedCommitted } = backspace(block);
  if (deletedCommitted) {
    const chars = [...committedNode.textContent];
    chars.pop();
    committedNode.textContent = chars.join("");
  }
  block = state;
  composingSpan.textContent = render(block);
  caretToEnd();
}

function commitBlock() {
  const text = render(block);
  if (text) committedNode.textContent += text;
  composingSpan.textContent = "";
  block = EMPTY;
  if (document.activeElement === inputEl) caretToEnd();
}

function addListeners() {
  window.addEventListener("keydown", (event) => {
    if (IGNORE_KEYS.has(event.code)) return;
    const key = keyByCode[event.code];
    if (key) key.classList.add("active");
    if (SHIFT_KEYS.has(event.code)) setShiftLabels(true);

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

  window.addEventListener("keyup", (event) => {
    // MacOS suppresses keyup for other keys while Command is held.
    if (event.code === "MetaLeft" || event.code === "MetaRight") {
      clearActiveKeys();
      return;
    }
    if (SHIFT_KEYS.has(event.code)) setShiftLabels(false);
    const key = keyByCode[event.code];
    if (key) key.classList.remove("active");
  });

  window.addEventListener("blur", resetKeyboard);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) resetKeyboard();
  });
}

function prepareInput() {
  inputEl = document.getElementById(INPUT_ID);
  inputEl.textContent = "";
  committedNode = document.createTextNode("");
  composingSpan = document.createElement("span");
  composingSpan.className = "composing";
  caretEl = document.createElement("span");
  caretEl.className = "caret";
  caretEl.contentEditable = "false";
  inputEl.append(committedNode, composingSpan, caretEl);
  block = EMPTY;
  inputEl.addEventListener("blur", commitBlock);
  document.addEventListener("selectionchange", () => {
    inputEl.classList.toggle("selecting", !window.getSelection().isCollapsed);
  });
  inputEl.focus();
}

function prepareToggle() {
  const toggle = document.getElementById(IME_TOGGLE_ID);
  toggle.checked = true;
  imeEnabled = toggle.checked;
  toggle.addEventListener("change", () => {
    imeEnabled = toggle.checked;
    inputEl.focus();
  });
}

createKeyboard();
addListeners();
prepareInput();
prepareToggle();
