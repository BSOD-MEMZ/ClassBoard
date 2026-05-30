// Pinyin → Hanzi IME lookup powered by pinyin-data (npm)
// Reverses hanzi→pinyin to pinyin→hanzi. Filters to CJK basic block.
// Sorts by usage frequency: common chars first, rare chars last.

import pinyinData from "pinyin-data";
import { getFreqRank } from "./freq";

type PinyinTable = Record<string, string>;
const rawTable: PinyinTable = (pinyinData as any)["带音调拼音"] || {};

const pinyinMap = new Map<string, string[]>();

function stripTone(py: string): string {
  return py
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[āáǎà]/g, "a")
    .replace(/[ēéěè]/g, "e")
    .replace(/[īíǐì]/g, "i")
    .replace(/[ōóǒò]/g, "o")
    .replace(/[ūúǔù]/g, "u")
    .replace(/[ǖǘǚǜ]/g, "v")
    .replace(/[ńňǹ]/g, "n")
    .replace(/[ḿ]/g, "m")
    .replace(/ü/g, "v")
    .replace(/u:/g, "v")   // Some datasets use "u:" notation for ü
    .replace(/U:/g, "v");
}

// CJK Unified Ideographs basic block (simplified Chinese)
function isCJK(char: string): boolean {
  const cp = char.codePointAt(0);
  return cp != null && cp >= 0x4e00 && cp <= 0x9fff;
}

// Build reverse lookup: pinyin (no tone) → hanzi[]
for (const [hanzi, pinyin] of Object.entries(rawTable)) {
  if (!hanzi || hanzi.length !== 1) continue;
  if (!isCJK(hanzi)) continue;
  const syllables = pinyin.split(",");
  for (const syl of syllables) {
    const clean = stripTone(syl.trim()).toLowerCase();
    if (!clean) continue;
    if (!pinyinMap.has(clean)) pinyinMap.set(clean, []);
    const chars = pinyinMap.get(clean)!;
    if (!chars.includes(hanzi)) chars.push(hanzi);
  }
}

// Sort each syllable's candidates by frequency (common first, rare last)
for (const [, chars] of pinyinMap) {
  chars.sort((a, b) => getFreqRank(a) - getFreqRank(b));
}

// All known pinyin syllables (sorted by length descending for prefix matching)
const allSyllables = [...pinyinMap.keys()].sort((a, b) => b.length - a.length);

// Split chars into common (in freq list) and rare (not in freq list)
function splitCommonRare(chars: string[]): { common: string[]; rare: string[] } {
  const common: string[] = [];
  const rare: string[] = [];
  for (const c of chars) {
    (getFreqRank(c) < Infinity ? common : rare).push(c);
  }
  return { common, rare };
}

export function getCandidates(pinyin: string): string[] {
  const clean = pinyin.toLowerCase().trim();
  if (!clean) return [];

  const seen = new Set<string>();
  const results: string[] = [];

  const add = (chars: string[]) => {
    for (const c of chars) {
      if (!seen.has(c)) { seen.add(c); results.push(c); }
    }
  };

  // 1. Exact match: common chars
  if (pinyinMap.has(clean)) {
    add(splitCommonRare(pinyinMap.get(clean)!).common);
  }

  // 2. Prefix match: common chars
  for (const py of allSyllables) {
    if (py === clean || !py.startsWith(clean)) continue;
    add(splitCommonRare(pinyinMap.get(py)!).common);
  }

  // 3. Exact match: rare chars
  if (pinyinMap.has(clean)) {
    add(splitCommonRare(pinyinMap.get(clean)!).rare);
  }

  // 4. Prefix match: rare chars
  for (const py of allSyllables) {
    if (py === clean || !py.startsWith(clean)) continue;
    add(splitCommonRare(pinyinMap.get(py)!).rare);
  }

  return results.slice(0, 24);
}

export function getExactCandidates(pinyin: string): string[] {
  const clean = pinyin.toLowerCase().trim();
  return pinyinMap.get(clean) || [];
}
