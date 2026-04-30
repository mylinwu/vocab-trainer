// Helpers to parse the kajweb/dict word JSON.

export interface ParsedWord {
  headWord: string;
  usphone?: string;
  ukphone?: string;
  trans: { tranCn?: string; tranOther?: string }[];
  sentences: { sContent: string; sCn?: string }[];
  phrases: { pContent: string; pCn?: string }[];
  rels: { word: string }[];
  synos: { word: string }[];
}

interface RawTrans { tranCn?: string; tranOther?: string }
interface RawSentence { sContent?: string; sCn?: string }
interface RawPhrase { pContent?: string; pCn?: string }
interface RawRels { wordId?: string; words?: { hwd?: string }[] }

interface RawContent {
  usphone?: string;
  ukphone?: string;
  trans?: RawTrans[];
  sentence?: { sentences?: RawSentence[] };
  phrase?: { phrases?: RawPhrase[] };
  relWord?: { rels?: RawRels[] };
  syno?: { synos?: { tranCn?: string; pos?: string; hwds?: { w: string }[] }[] };
}

interface RawRoot {
  word?: { content?: RawContent };
  content?: RawContent;
}

export function parseWordContent(headWord: string, contentJson: string): ParsedWord {
  let raw: RawRoot = {};
  try {
    raw = JSON.parse(contentJson) as RawRoot;
  } catch {
    raw = {};
  }
  const c = raw?.word?.content ?? raw?.content ?? {};
  const sentences = c?.sentence?.sentences ?? [];
  const phrases = c?.phrase?.phrases ?? [];
  const rels = c?.relWord?.rels ?? [];
  const synos = c?.syno?.synos ?? [];
  return {
    headWord,
    usphone: c?.usphone,
    ukphone: c?.ukphone,
    trans: c?.trans ?? [],
    sentences: sentences
      .filter((s) => s?.sContent)
      .map((s) => ({ sContent: s.sContent!, sCn: s.sCn })),
    phrases: phrases
      .filter((p) => p?.pContent)
      .map((p) => ({ pContent: p.pContent!, pCn: p.pCn })),
    rels: rels.flatMap(
      (r) => r?.words?.filter((w) => w?.hwd).map((w) => ({ word: w.hwd! })) ?? [],
    ),
    synos: synos.flatMap(
      (s) => s?.hwds?.filter((h) => h?.w).map((h) => ({ word: h.w! })) ?? [],
    ),
  };
}

export function quickTranslation(contentJson: string): string {
  try {
    const raw = JSON.parse(contentJson) as RawRoot;
    const c = raw?.word?.content ?? raw?.content;
    const t = c?.trans?.[0]?.tranCn;
    if (t) return t;
  } catch {
    // ignore
  }
  return "";
}
