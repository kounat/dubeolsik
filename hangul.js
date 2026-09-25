// 초성 — 19 leading consonants, index 0–18.
export const CHOSEONG = [
  "ㄱ",
  "ㄲ",
  "ㄴ",
  "ㄷ",
  "ㄸ",
  "ㄹ",
  "ㅁ",
  "ㅂ",
  "ㅃ",
  "ㅅ",
  "ㅆ",
  "ㅇ",
  "ㅈ",
  "ㅉ",
  "ㅊ",
  "ㅋ",
  "ㅌ",
  "ㅍ",
  "ㅎ",
];

// 중성 — 21 middle vowels, index 0–20.
export const JUNGSEONG = [
  "ㅏ",
  "ㅐ",
  "ㅑ",
  "ㅒ",
  "ㅓ",
  "ㅔ",
  "ㅕ",
  "ㅖ",
  "ㅗ",
  "ㅘ",
  "ㅙ",
  "ㅚ",
  "ㅛ",
  "ㅜ",
  "ㅝ",
  "ㅞ",
  "ㅟ",
  "ㅠ",
  "ㅡ",
  "ㅢ",
  "ㅣ",
];

// 종성 — 28 trailing consonants, index 0–27.
// Index 0 is "no final" (e.g., a bare cho+jung block like 가); the empty string keeps the array index-aligned.
export const JONGSEONG = [
  "",
  "ㄱ",
  "ㄲ",
  "ㄳ",
  "ㄴ",
  "ㄵ",
  "ㄶ",
  "ㄷ",
  "ㄹ",
  "ㄺ",
  "ㄻ",
  "ㄼ",
  "ㄽ",
  "ㄾ",
  "ㄿ",
  "ㅀ",
  "ㅁ",
  "ㅂ",
  "ㅄ",
  "ㅅ",
  "ㅆ",
  "ㅇ",
  "ㅈ",
  "ㅊ",
  "ㅋ",
  "ㅌ",
  "ㅍ",
  "ㅎ",
];

// Create reverse mapping of jamo to index.
function indexMap(table) {
  const map = {};
  table.forEach((jamo, i) => {
    map[jamo] = i;
  });
  return map;
}

export const CHO_INDEX = indexMap(CHOSEONG);
export const JUNG_INDEX = indexMap(JUNGSEONG);
export const JONG_INDEX = indexMap(JONGSEONG);

const SYLLABLE_BASE = 0xac00; // 가
const N_JUNG = JUNGSEONG.length; // 21
const N_JONG = JONGSEONG.length; // 28

function assertIndex(value, count, name) {
  if (!Number.isInteger(value) || value < 0 || value >= count) {
    throw new RangeError(
      `${name} index out of range: ${value} (expected 0-${count - 1})`,
    );
  }
}

// Combine 초성/중성/종성 indices into one character.
// Throws RangeError on an out-of-range index so we can fail loudly.
export function compose(cho, jung, jong = 0) {
  assertIndex(cho, CHOSEONG.length, "choseong");
  assertIndex(jung, JUNGSEONG.length, "jungseong");
  assertIndex(jong, JONGSEONG.length, "jongseong");
  const code = SYLLABLE_BASE + (cho * N_JUNG + jung) * N_JONG + jong;
  return String.fromCodePoint(code);
}

// The base composing block.
export const EMPTY = Object.freeze({ cho: null, jung: null, jong: null });

function block(cho = null, jung = null, jong = null) {
  return { cho, jung, jong };
}

export function render(state) {
  const { cho, jung, jong } = state;
  if (cho !== null && jung !== null) return compose(cho, jung, jong ?? 0);
  if (cho !== null) return CHOSEONG[cho];
  if (jung !== null) return JUNGSEONG[jung];
  return "";
}

// Step machine for composing hangul.
// Returns committed as the finished block, and state as what's currently composing.
export function step(state, jamo) {
  const asCho = jamo in CHO_INDEX ? CHO_INDEX[jamo] : null;
  const asJung = jamo in JUNG_INDEX ? JUNG_INDEX[jamo] : null;
  const asJong = jamo in JONG_INDEX ? JONG_INDEX[jamo] : null;

  // Non-korean input entered; flush what we have.
  if (asCho === null && asJung === null) {
    return { committed: render(state), state: EMPTY };
  }

  const { cho, jung, jong } = state;
  const filled = render(state);

  // A vowel.
  if (asJung !== null) {
    if (cho !== null && jung === null) {
      // Leading consonant was waiting for its vowel: 가 forms.
      return { committed: "", state: block(cho, asJung, null) };
    }
    if (cho === null && jung === null) {
      // Empty block: the vowel stands by itself.
      return { committed: "", state: block(null, asJung, null) };
    }
    // The block already has a vowel: commit and start the vowel fresh.
    return { committed: filled, state: block(null, asJung, null) };
  }

  // A consonant.
  if (cho === null && jung === null) {
    // Empty block: it becomes the leading consonant.
    return { committed: "", state: block(asCho, null, null) };
  }
  if (cho !== null && jung === null) {
    // Two consonants with no vowel between: commit the first, start the second.
    return { committed: filled, state: block(asCho, null, null) };
  }
  if (cho !== null && jung !== null && jong === null && asJong !== null) {
    // cho+jung waiting for a final, and this consonant is a valid one: 각 / 간.
    return { committed: "", state: block(cho, jung, asJong) };
  }
  // The block already has a final, the consonant can't be one (ㄸㅃㅉ), or the
  // block is a lone vowel: commit and begin a new block.
  return { committed: filled, state: block(asCho, null, null) };
}
