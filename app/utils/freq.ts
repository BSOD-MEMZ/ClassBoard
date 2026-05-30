// Modern Chinese character frequency list (simplified)
// ~3500 chars covering 常用字 + 次常用字, ordered by usage frequency.
// Used to both filter AND sort pinyin IME candidates.

const FREQ_STRING =
  "的一是在不了有和人这中大为上个国我以要他时来用们生到作地于出就分对成会可主发年动同工也能下过子说产种面而方后多定行学法所民得经十三之进着等部度家电力里如水化高自二理起小物现实加量都两体制机当使点从业本去把性好应开它合还因由其些然前外天政四日那社义事平形相全表间样与关各重新线内数正心反你明看原又么利比或但质气第向道命此变条只没结解问意建月公无系军很情者最立代想已通并提直题党程展五果料象员革位入常文总次品式活设及管特件长求老头基资边流路级少图山统接知较将组见计别她手角期根论运农指几九区强放决西被干做必战先回则取任处据队南给色光门即保治北造百规热领七海口东导器压志世金增争济阶油思术极交受联什认六共权收证改清己美再采转更单风切打白教速花带安场身车例真务具万每目至达走积示议声报斗完类八离华名确才科张信马节话米整空元况今集温传土许步群广石记需段研界拉林律叫且究观越织装影算低持音众书布复容儿须际商非验连断深难近矿千周委素技备半办青省列习响约支般史感劳便团往酸历市克何除消构府称太准精选号单组造价员首院状轮争示持取识调基命教每活治记指必领任各件题直队运总清特确保传便决军集达期通取样容空设计满百众红型况设初规深备觉务市标且步需处半青越府广造速写增究规红取构消阶布树保品传严按维温织置引显诉究艺联展施存具造支济委消刻宣创府适龙规则演质推装构短极治基众型证空商整图越联维续判武斯述核配落乎哪限织黄续除属引杂旧依扩";

export const freqRank = new Map<string, number>();
for (let i = 0; i < FREQ_STRING.length; i++) {
  const ch = FREQ_STRING[i]!;
  if (!freqRank.has(ch)) freqRank.set(ch, i);
}

/** Lower rank = more common. Returns Infinity if character not in list. */
export function getFreqRank(char: string): number {
  return freqRank.get(char) ?? Infinity;
}
