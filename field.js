import { backspace, EMPTY, render, step } from "./hangul.js";

// The field is always `beforeNode - composingSpan - afterNode`, and the insertion point is always right after the composing block.
// The caret is drawn by `.composing::after` (see styles.css), so it follows the block wherever it goes.
// Native caret moves (clicks, Shift+Arrows) are picked up by `followSelection`, which re-splits the text there.

const INPUT_ID = "input";
const SCROLL_MARGIN = 12;
let inputEl = null;

let beforeNode = null;
let composingSpan = null;
let afterNode = null;
let block = EMPTY;
let nativeComposing = false;

function placeCaret() {
  const range = document.createRange();
  range.setStart(beforeNode, beforeNode.length);
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
  scrollCaretIntoView();
  restartCaretBlink();
}

// We set the caret ourselves, so the browser won't scroll to follow it like it does for native typing; keep it in view by hand.
function scrollCaretIntoView() {
  const x =
    composingSpan.getBoundingClientRect().right -
    inputEl.getBoundingClientRect().left -
    inputEl.clientLeft;
  if (x < SCROLL_MARGIN) {
    inputEl.scrollLeft += x - SCROLL_MARGIN;
  } else if (x > inputEl.clientWidth - SCROLL_MARGIN) {
    inputEl.scrollLeft += x - (inputEl.clientWidth - SCROLL_MARGIN);
  }
}

function restartCaretBlink() {
  for (const animation of composingSpan.getAnimations({ subtree: true })) {
    animation.currentTime = 0;
  }
}

function textOffset(node, offset) {
  const range = document.createRange();
  range.setStart(inputEl, 0);
  range.setEnd(node, offset);
  return range.toString().length;
}

function splitAt(offset) {
  const text = beforeNode.textContent + render(block) + afterNode.textContent;
  beforeNode.textContent = text.slice(0, offset);
  afterNode.textContent = text.slice(offset);
  composingSpan.textContent = "";
  block = EMPTY;
}

// Where placeCaret puts the caret; followSelection ignores it so our own moves don't reset the block.
function isOurCaret(selection) {
  return (
    selection.anchorNode === beforeNode &&
    selection.anchorOffset === beforeNode.length
  );
}

function followSelection() {
  if (nativeComposing) return;
  const selection = window.getSelection();
  if (selection.rangeCount === 0 || !selection.isCollapsed) return;
  if (!inputEl.contains(selection.anchorNode)) return;
  if (isOurCaret(selection)) return;
  splitAt(textOffset(selection.anchorNode, selection.anchorOffset));
  placeCaret();
}

export function deleteSelection() {
  const selection = window.getSelection();
  if (selection.rangeCount === 0 || selection.isCollapsed) return false;
  const range = selection.getRangeAt(0);
  if (!inputEl.contains(range.commonAncestorContainer)) return false;

  const start = textOffset(range.startContainer, range.startOffset);
  const end = textOffset(range.endContainer, range.endOffset);
  const text = inputEl.textContent;
  beforeNode.textContent = text.slice(0, start);
  afterNode.textContent = text.slice(end);
  composingSpan.textContent = "";
  block = EMPTY;
  placeCaret();
  return true;
}

export function insertJamo(jamo) {
  if (document.activeElement !== inputEl) inputEl.focus();
  const { committed, state } = step(block, jamo);
  if (committed) beforeNode.textContent += committed;
  block = state;
  composingSpan.textContent = render(block);
  placeCaret();
}

export function insertLiteral(ch) {
  if (document.activeElement !== inputEl) inputEl.focus();
  beforeNode.textContent += render(block) + ch;
  composingSpan.textContent = "";
  block = EMPTY;
  placeCaret();
}

export function deleteBlock() {
  if (document.activeElement !== inputEl) inputEl.focus();
  const { state, deletedCommitted } = backspace(block);
  if (deletedCommitted) {
    // Spread over code points so an astral char is removed whole.
    const chars = [...beforeNode.textContent];
    chars.pop();
    beforeNode.textContent = chars.join("");
  }
  block = state;
  composingSpan.textContent = render(block);
  placeCaret();
}

export function deleteForward() {
  if (document.activeElement !== inputEl) inputEl.focus();
  commitBlock();
  const chars = [...afterNode.textContent];
  chars.shift();
  afterNode.textContent = chars.join("");
  placeCaret();
}

// Firefox's native move can stop at the composing span's edge (same text offset), which followSelection would undo.
// Returns false when the browser should handle the key instead (field not focused, or a selection to collapse).
export function moveCaret(direction) {
  if (document.activeElement !== inputEl) return false;
  if (!window.getSelection().isCollapsed) return false;
  commitBlock();
  const before = [...beforeNode.textContent];
  const after = [...afterNode.textContent];
  if (direction < 0 && before.length > 0) after.unshift(before.pop());
  if (direction > 0 && after.length > 0) before.push(after.shift());
  beforeNode.textContent = before.join("");
  afterNode.textContent = after.join("");
  placeCaret();
  return true;
}

export function commitBlock() {
  const text = render(block);
  // Leave the selection alone when there's nothing to commit, so Shift+arrow can keep extending it.
  if (!text) return;
  beforeNode.textContent += text;
  composingSpan.textContent = "";
  block = EMPTY;
  if (document.activeElement === inputEl) placeCaret();
}

// Converts a native browser edit back into our three nodes, keeping the caret where the edit happened.
function syncFromDOM() {
  const selection = window.getSelection();
  const text = inputEl.textContent;
  const offset =
    selection.rangeCount > 0 && inputEl.contains(selection.anchorNode)
      ? textOffset(selection.anchorNode, selection.anchorOffset)
      : text.length;
  beforeNode.textContent = text.slice(0, offset);
  afterNode.textContent = text.slice(offset);
  composingSpan.textContent = "";
  block = EMPTY;
  inputEl.replaceChildren(beforeNode, composingSpan, afterNode);
  if (document.activeElement === inputEl) placeCaret();
}

export function focusField() {
  inputEl.focus();
}

export function prepareField() {
  inputEl = document.getElementById(INPUT_ID);
  inputEl.textContent = "";
  beforeNode = document.createTextNode("");
  composingSpan = document.createElement("span");
  composingSpan.className = "composing";
  afterNode = document.createTextNode("");
  inputEl.append(beforeNode, composingSpan, afterNode);
  block = EMPTY;
  inputEl.addEventListener("blur", commitBlock);
  // Commit before a click so the caret moves from after the block.
  inputEl.addEventListener("mousedown", commitBlock);
  // Our own edits never fire `input`, so any that arrives is the browser editing natively (system IME, paste, cut, Option-combos).
  // Wait for a composition before syncing.
  inputEl.addEventListener("input", (event) => {
    if (!event.isComposing) syncFromDOM();
  });
  inputEl.addEventListener("compositionstart", () => {
    nativeComposing = true;
  });
  inputEl.addEventListener("compositionend", () => {
    nativeComposing = false;
    syncFromDOM();
  });
  document.addEventListener("selectionchange", () => {
    inputEl.classList.toggle("selecting", !window.getSelection().isCollapsed);
    followSelection();
  });
  inputEl.focus();
}
