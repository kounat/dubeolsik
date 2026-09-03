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
const keyByCode = {};

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

function addListeners() {
  window.addEventListener("keydown", (event) => {
    if (IGNORE_KEYS.has(event.code)) return;
    const key = keyByCode[event.code];
    if (key) key.classList.add("active");
    if (SHIFT_KEYS.has(event.code)) setShiftLabels(true);
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
  const input = document.getElementById(INPUT_ID);
  input.value = "";
  input.focus();
}

createKeyboard();
addListeners();
prepareInput();
