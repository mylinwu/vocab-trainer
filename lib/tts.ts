// Youdao TTS direct URL builder.
export type Accent = "uk" | "us";
export function ttsUrl(word: string, accent: Accent = "us"): string {
  const type = accent === "uk" ? 1 : 2;
  return `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(word)}&type=${type}`;
}
