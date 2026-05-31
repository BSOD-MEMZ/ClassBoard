// Chinese IME 联想 (next-character prediction)
// Builds bigram data from pinyin-data's 多音字词表 and a curated common-bigram list.
// When user commits a character, this returns the most likely following characters.

import pinyinData from "pinyin-data";

const bigramMap = new Map<string, string[]>();

// ── 1. Extract bigrams from 多音字词表 (polyphone word table) ──
const wordTable: Record<string, string> = (pinyinData as any)["多音字词表"] || {};

for (const word of Object.keys(wordTable)) {
  if (!word || word.length < 2) continue;
  for (let i = 0; i < word.length - 1; i++) {
    const prev = word[i]!;
    const next = word[i + 1]!;
    if (!bigramMap.has(prev)) bigramMap.set(prev, []);
    const arr = bigramMap.get(prev)!;
    if (!arr.includes(next)) arr.push(next);
  }
}

// ── 2. Curated common bigrams for top-frequency characters ──
// These supplement the word-table data for better coverage.
const CURATED_BIGRAMS: Record<string, string> = {
  // 的
  的: "一人们是我他要你在这那不有来大上和到也说个",
  // 一
  一: "个种些样定下切点步天年直切生次半致般",
  // 是
  是: "的不是一我在们他有你这什么个那也要为",
  // 不
  不: "是过会能要人得可同少断但一了知大",
  // 了
  了: "一这不我他一们就人你那个也大是到",
  // 在
  在: "这一我不他人是们你中大上那到下学地",
  // 有
  有: "一些人这我他不是限那了可多大你关",
  // 人
  人: "们民类是就也生大一不我他有这和工",
  // 我
  我: "们的不一人是也就这有你了要他想大",
  // 他
  他: "们的不一人是也就有你这了要我想大",
  // 这
  这: "个样些里是不种一人我就也有那大会",
  // 中
  中: "国华人学不心一这大是我有你就了生",
  // 大
  大: "的家学不是一这人会我中有们了你生",
  // 为
  为: "了什不这人我一这有是那们你大个中",
  // 上
  上: "的是不一人这我有海来学到面大们中",
  // 个
  个: "人月不是一我了这多有中大你来学生",
  // 国
  国: "家内外人际的是不我有这一民大们中",
  // 来
  到: "了这是不一人我大有们也那你中就上",
};

for (const [prev, followers] of Object.entries(CURATED_BIGRAMS)) {
  if (!bigramMap.has(prev)) bigramMap.set(prev, []);
  const arr = bigramMap.get(prev)!;
  for (const ch of followers) {
    if (!arr.includes(ch)) arr.push(ch);
  }
}

// Remove any whitespace / non-CJK entries
for (const [key, arr] of bigramMap) {
  bigramMap.set(
    key,
    arr.filter((c) => {
      const cp = c.codePointAt(0);
      return cp != null && cp >= 0x4e00 && cp <= 0x9fff;
    }),
  );
}

/**
 * Get 联想 (prediction) candidates for the given character.
 * Returns up to `limit` characters that commonly follow `char`.
 */
export function getPredictions(char: string, limit = 12): string[] {
  const followers = bigramMap.get(char);
  if (!followers || !followers.length) return [];
  return followers.slice(0, limit);
}

/**
 * Check if predictions are available for a character.
 */
export function hasPredictions(char: string): boolean {
  const followers = bigramMap.get(char);
  return !!(followers && followers.length > 0);
}
