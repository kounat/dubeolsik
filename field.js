import { backspace, EMPTY, render, step } from "./hangul.js";

const INPUT_ID = "input";
let inputEl = null;

let committedNode = null;
let composingSpan = null;
let caretEl = null;
let block = EMPTY;

function caretToEnd() {
  const range = document.createRange();
  range.setStart(committedNode, committedNode.length);
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
  inputEl.scrollLeft = inputEl.scrollWidth;
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

export function deleteSelection() {
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

export function insertJamo(jamo) {
  if (document.activeElement !== inputEl) inputEl.focus();
  const { committed, state } = step(block, jamo);
  if (committed) committedNode.textContent += committed;
  block = state;
  composingSpan.textContent = render(block);
  caretToEnd();
}

export function insertLiteral(ch) {
  if (document.activeElement !== inputEl) inputEl.focus();
  committedNode.textContent += render(block) + ch;
  composingSpan.textContent = "";
  block = EMPTY;
  caretToEnd();
}

export function deleteBlock() {
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

export function commitBlock() {
  const text = render(block);
  if (text) committedNode.textContent += text;
  composingSpan.textContent = "";
  block = EMPTY;
  if (document.activeElement === inputEl) caretToEnd();
}

function syncFromDOM() {
  committedNode.textContent = inputEl.textContent;
  composingSpan.textContent = "";
  block = EMPTY;
  inputEl.replaceChildren(committedNode, composingSpan, caretEl);
  if (document.activeElement === inputEl) caretToEnd();
}

export function focusField() {
  inputEl.focus();
}

export function prepareField() {
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
  // Our own edits never fire `input`, so any that arrives is the browser editing natively (system IME, paste, cut, Option-combos).
  // Wait for a composition before syncing.
  inputEl.addEventListener("input", (event) => {
    if (!event.isComposing) syncFromDOM();
  });
  inputEl.addEventListener("compositionend", syncFromDOM);
  document.addEventListener("selectionchange", () => {
    inputEl.classList.toggle("selecting", !window.getSelection().isCollapsed);
  });
  inputEl.focus();
}
