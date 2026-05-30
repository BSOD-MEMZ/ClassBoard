declare module "pinyin-data" {
  const data: {
    "带音调拼音": Record<string, string>;
    "多音字词表": Record<string, string>;
  };
  export default data;
}
