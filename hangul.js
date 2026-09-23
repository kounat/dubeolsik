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
