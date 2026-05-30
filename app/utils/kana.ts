// Romaji → Hiragana / Katakana conversion

const romajiMap: Record<string, string> = {
  a: "あ", i: "い", u: "う", e: "え", o: "お",
  ka: "か", ki: "き", ku: "く", ke: "け", ko: "こ",
  sa: "さ", shi: "し", su: "す", se: "せ", so: "そ",
  ta: "た", chi: "ち", tsu: "つ", te: "て", to: "と",
  na: "な", ni: "に", nu: "ぬ", ne: "ね", no: "の",
  ha: "は", hi: "ひ", fu: "ふ", he: "へ", ho: "ほ",
  ma: "ま", mi: "み", mu: "む", me: "め", mo: "も",
  ya: "や", yu: "ゆ", yo: "よ",
  ra: "ら", ri: "り", ru: "る", re: "れ", ro: "ろ",
  wa: "わ", wo: "を", n: "ん",
  ga: "が", gi: "ぎ", gu: "ぐ", ge: "げ", go: "ご",
  za: "ざ", ji: "じ", zu: "ず", ze: "ぜ", zo: "ぞ",
  da: "だ", di: "ぢ", du: "づ", de: "で", do: "ど",
  ba: "ば", bi: "び", bu: "ぶ", be: "べ", bo: "ぼ",
  pa: "ぱ", pi: "ぴ", pu: "ぷ", pe: "ぺ", po: "ぽ",
  kya: "きゃ", kyu: "きゅ", kyo: "きょ",
  sha: "しゃ", shu: "しゅ", sho: "しょ",
  cha: "ちゃ", chu: "ちゅ", cho: "ちょ",
  nya: "にゃ", nyu: "にゅ", nyo: "にょ",
  hya: "ひゃ", hyu: "ひゅ", hyo: "ひょ",
  mya: "みゃ", myu: "みゅ", myo: "みょ",
  rya: "りゃ", ryu: "りゅ", ryo: "りょ",
  gya: "ぎゃ", gyu: "ぎゅ", gyo: "ぎょ",
  ja: "じゃ", ju: "じゅ", jo: "じょ",
  bya: "びゃ", byu: "びゅ", byo: "びょ",
  pya: "ぴゃ", pyu: "ぴゅ", pyo: "ぴょ",
};

const kataMap: Record<string, string> = {
  a: "ア", i: "イ", u: "ウ", e: "エ", o: "オ",
  ka: "カ", ki: "キ", ku: "ク", ke: "ケ", ko: "コ",
  sa: "サ", shi: "シ", su: "ス", se: "セ", so: "ソ",
  ta: "タ", chi: "チ", tsu: "ツ", te: "テ", to: "ト",
  na: "ナ", ni: "ニ", nu: "ヌ", ne: "ネ", no: "ノ",
  ha: "ハ", hi: "ヒ", fu: "フ", he: "ヘ", ho: "ホ",
  ma: "マ", mi: "ミ", mu: "ム", me: "メ", mo: "モ",
  ya: "ヤ", yu: "ユ", yo: "ヨ",
  ra: "ラ", ri: "リ", ru: "ル", re: "レ", ro: "ロ",
  wa: "ワ", wo: "ヲ", n: "ン",
  ga: "ガ", gi: "ギ", gu: "グ", ge: "ゲ", go: "ゴ",
  za: "ザ", ji: "ジ", zu: "ズ", ze: "ゼ", zo: "ゾ",
  da: "ダ", di: "ヂ", du: "ヅ", de: "デ", do: "ド",
  ba: "バ", bi: "ビ", bu: "ブ", be: "ベ", bo: "ボ",
  pa: "パ", pi: "ピ", pu: "プ", pe: "ペ", po: "ポ",
};

// Longest match lookup for romaji → kana
export function romajiToHiragana(input: string): string {
  let remaining = input.toLowerCase();
  let result = "";
  while (remaining.length > 0) {
    let matched = false;
    for (let len = Math.min(4, remaining.length); len >= 1; len--) {
      const chunk = remaining.slice(0, len);
      if (romajiMap[chunk]) {
        result += romajiMap[chunk];
        remaining = remaining.slice(len);
        matched = true;
        break;
      }
    }
    if (!matched) {
      // Pass through unconvertible characters
      result += remaining[0];
      remaining = remaining.slice(1);
    }
  }
  return result;
}

export function romajiToKatakana(input: string): string {
  let remaining = input.toLowerCase();
  let result = "";
  while (remaining.length > 0) {
    let matched = false;
    for (let len = Math.min(4, remaining.length); len >= 1; len--) {
      const chunk = remaining.slice(0, len);
      if (kataMap[chunk]) {
        result += kataMap[chunk];
        remaining = remaining.slice(len);
        matched = true;
        break;
      }
    }
    if (!matched) {
      result += remaining[0];
      remaining = remaining.slice(1);
    }
  }
  return result;
}

// Double consonant (small tsu): "kka" → "っか"
export function romajiToHiraganaWithSokuon(input: string): string {
  let remaining = input.toLowerCase();
  let result = "";
  while (remaining.length > 0) {
    if (remaining.length >= 2 && remaining[0] === remaining[1] && remaining[0] !== "n") {
      result += "っ";
      remaining = remaining.slice(2);
      continue;
    }
    let matched = false;
    for (let len = Math.min(4, remaining.length); len >= 1; len--) {
      const chunk = remaining.slice(0, len);
      if (romajiMap[chunk]) {
        result += romajiMap[chunk];
        remaining = remaining.slice(len);
        matched = true;
        break;
      }
    }
    if (!matched) {
      result += remaining[0];
      remaining = remaining.slice(1);
    }
  }
  return result;
}
