/**
 * Voice-search understanding (no AI service, no API key):
 *   "जयपुर से कानपुर 13 दिसंबर"  /  "Jaipur to Kanpur tomorrow"  /  "જયપુરથી કાનપુર પરમદિવસે"
 *   → { from: JP, to: CNB, date: 2026-12-13 }
 *
 *  - stations are found by matching the spoken text against the station names in English and the
 *    seven Indian-language name tables the mobile app ships (same data, so spelling matches what the
 *    phone's speech recogniser writes);
 *  - direction (from/to) comes from the little words around each station ("se", "tak", "to", "થી"…),
 *    falling back to the order they were spoken;
 *  - dates are resolved here, in code, in India time — never guessed.
 *
 * Pure module: no Next.js imports, so it can be unit-tested with `node --test`.
 */
import fs from 'node:fs';
import path from 'node:path';

/* ───────────────────────── text helpers ───────────────────────── */

const DIGIT_ZEROS = [0x660, 0x6f0, 0x966, 0x9e6, 0xa66, 0xae6, 0xb66, 0xbe6, 0xc66, 0xce6, 0xd66];

/** Lowercase, strip Latin accents, unify all digit scripts to 0-9, drop punctuation/zero-width marks. */
export function normalize(input: string): string {
  let s = String(input ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .normalize('NFC')
    .toLowerCase()
    .replace(/[​-‍﻿]/g, '');
  s = s.replace(/\p{Nd}/gu, (ch) => {
    const cp = ch.codePointAt(0)!;
    for (const z of DIGIT_ZEROS) if (cp >= z && cp <= z + 9) return String(cp - z);
    return ch;
  });
  // keep / - . between digits (dates), turn every other punctuation into a space
  s = s.replace(/(\d)[./-](?=\d)/g, '$1/').replace(/[^\p{L}\p{M}\p{Nd}/\s]/gu, ' ');
  return s.replace(/\s+/g, ' ').trim();
}

const tokensOf = (norm: string) => (norm ? norm.split(' ') : []);

function editDistance(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    let cur = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      rowMin = Math.min(rowMin, cur[j]);
    }
    if (rowMin > max) return max + 1;
    for (let j = 0; j <= b.length; j++) prev[j] = cur[j];
    cur = [];
  }
  return prev[b.length];
}

/* ───────────────────────── word lists ───────────────────────── */

// All entries are written naturally and normalised when the sets are built.
const FROM_AFTER = ['se', 'से', 'થી', 'पासून', 'থেকে', 'হতে', 'నుండి', 'నుంచి', 'ਤੋਂ', 'ରୁ', 'ଠାରୁ'];
const FROM_BEFORE = ['from', 'frm'];
const TO_AFTER = ['tak', 'तक', 'સુધી', 'पर्यंत', 'পর্যন্ত', 'వరకు', 'ਤੱਕ', 'ପର୍ଯ୍ୟନ୍ତ', 'tk', 'liye', 'लिए', 'लिये', 'सुधी'];
const TO_BEFORE = ['to', 'ते', 'towards', 'till'];
const ATTACHED_FROM = ['થી', 'ରୁ', 'ଠାରୁ', 'हून'];
const GENITIVE = ['ke', 'के', 'ki', 'की', 'ka', 'का'];

const FILLER = [
  'ticket', 'tickets', 'train', 'trains', 'ki', 'ka', 'ke', 'को', 'की', 'का', 'के', 'on', 'at', 'for', 'dikhao', 'dikha', 'batao',
  'show', 'me', 'mujhe', 'muje', 'mera', 'search', 'find', 'please', 'tarikh', 'tareekh', 'date', 'ko', 'mein', 'me', 'में', 'से',
  'चाहिए', 'दिखाओ', 'दिखाइए', 'बताओ', 'ट्रेन', 'तारीख', 'को', 'the', 'a', 'an', 'i', 'want', 'need', 'trains',
];

const RELATIVE: { words: string[]; days: number }[] = [
  { words: ['today', 'aaj', 'आज', 'આજે', 'આજ', 'আজ', 'ఈరోజు', 'ఇవాళ', 'ਅੱਜ', 'ଆଜି'], days: 0 },
  { words: ['tomorrow', 'tmrw', 'tommorow', 'tomorow', 'kal', 'कल', 'કાલે', 'કાલ', 'उद्या', 'আগামীকাল', 'কাল', 'రేపు', 'ਕੱਲ੍ਹ', 'ਕੱਲ', 'କାଲି'], days: 1 },
  { words: ['parso', 'parson', 'parsoon', 'परसों', 'परसो', 'પરમદિવસે', 'પરમદિવસ', 'परवा', 'পরশু', 'ఎల్లుండి', 'ਪਰਸੋਂ', 'ପରଦିନ'], days: 2 },
];
const DAY_AFTER_PHRASES = ['day after tomorrow', 'day after', 'પરમ દિવસે', 'પરમ દિવસ'];

const MONTHS: string[][] = [
  ['january', 'jan', 'जनवरी', 'जानेवारी', 'જાન્યુઆરી', 'জানুয়ারি', 'జనవరి', 'ਜਨਵਰੀ', 'ଜାନୁଆରୀ'],
  ['february', 'feb', 'फरवरी', 'फेब्रुवारी', 'ફેબ્રુઆરી', 'ফেব্রুয়ারি', 'ఫిబ్రవరి', 'ਫਰਵਰੀ', 'ਫ਼ਰਵਰੀ', 'ଫେବୃଆରୀ'],
  ['march', 'mar', 'मार्च', 'માર્ચ', 'মার্চ', 'మార్చి', 'ਮਾਰਚ', 'ମାର୍ଚ୍ଚ'],
  ['april', 'apr', 'अप्रैल', 'एप्रिल', 'એપ્રિલ', 'এপ্রিল', 'ఏప్రిల్', 'ਅਪ੍ਰੈਲ', 'ਅਪਰੈਲ', 'ଅପ୍ରେଲ'],
  ['may', 'मई', 'मे', 'મે', 'মে', 'మే', 'ਮਈ', 'ମଇ'],
  ['june', 'jun', 'जून', 'જૂન', 'জুন', 'జూన్', 'ਜੂਨ', 'ଜୁନ'],
  ['july', 'jul', 'जुलाई', 'जुलै', 'જુલાઈ', 'জুলাই', 'జూలై', 'ਜੁਲਾਈ', 'ଜୁଲାଇ'],
  ['august', 'aug', 'अगस्त', 'ऑगस्ट', 'ઓગસ્ટ', 'ઑગસ્ટ', 'আগস্ট', 'ఆగస్టు', 'ਅਗਸਤ', 'ଅଗଷ୍ଟ'],
  ['september', 'sep', 'sept', 'सितंबर', 'सितम्बर', 'सप्टेंबर', 'સપ્ટેમ્બર', 'সেপ্টেম্বর', 'సెప్టెంబర్', 'ਸਤੰਬਰ', 'ସେପ୍ଟେମ୍ବର'],
  ['october', 'oct', 'अक्टूबर', 'अक्तूबर', 'ऑक्टोबर', 'ઓક્ટોબર', 'ઑક્ટોબર', 'অক্টোবর', 'అక్టోబర్', 'ਅਕਤੂਬਰ', 'ଅକ୍ଟୋବର'],
  ['november', 'nov', 'नवंबर', 'नवम्बर', 'नोव्हेंबर', 'નવેમ્બર', 'নভেম্বর', 'నవంబర్', 'ਨਵੰਬਰ', 'ନଭେମ୍ବର'],
  ['december', 'dec', 'दिसंबर', 'दिसम्बर', 'डिसेंबर', 'डिसेम्बर', 'ડિસેમ્બર', 'ডিসেম্বর', 'డిసెంబర్', 'ਦਸੰਬਰ', 'ଡିସେମ୍ବର'],
];

// Names a speaker uses that differ from the station list's name.
const ALIASES: Record<string, string> = {
  delhi: 'NDLS', dilli: 'NDLS', 'दिल्ली': 'NDLS', 'ਦਿੱਲੀ': 'NDLS', 'દિલ્હી': 'NDLS', 'দিল্লি': 'NDLS', 'ఢిల్లీ': 'NDLS', 'ଦିଲ୍ଲୀ': 'NDLS',
  kolkata: 'HWH', calcutta: 'HWH', 'कोलकाता': 'HWH', 'কলকাতা': 'HWH', 'કોલકાતા': 'HWH',
  bangalore: 'SBC', bengaluru: 'SBC', bengalooru: 'SBC', 'बेंगलुरु': 'SBC', 'बैंगलोर': 'SBC', 'बंगलौर': 'SBC', 'బెంగళూరు': 'SBC',
  banaras: 'BSB', kashi: 'BSB', varanasi: 'BSB', 'बनारस': 'BSB', 'काशी': 'BSB', 'वाराणसी': 'BSB',
  allahabad: 'PRYJ', prayagraj: 'PRYJ', 'इलाहाबाद': 'PRYJ', 'प्रयागराज': 'PRYJ',
  trivandrum: 'TVC', cochin: 'ERS', kochi: 'ERS', vizag: 'VSKP', madras: 'MAS', bombay: 'BCT',
  'मुंबई': 'BCT', 'मुम्बई': 'BCT', 'मुंबइ': 'BCT', 'મુંબઈ': 'BCT', 'মুম্বই': 'BCT', 'ముంబై': 'BCT', 'ਮੁੰਬਈ': 'BCT', 'ମୁମ୍ବଇ': 'BCT',
};

// Stations people actually mean when they only say the city (breaks ties between many "X Junction/Cantt/Road").
const POPULAR = new Set(
  'NDLS BCT LTT HWH MAS SBC YPR PUNE ADI ST BRC CNB LKO PRYJ BSB DDU PNBE GHY BBS VSKP BZA SC HYB NGP BPL INDB AGC GWL JAT ASR CDG UMB MDU ERS TVC MAQ CBE TATA RNC GKP JHS JP JU UJN BKN AII'.split(' '),
);

const norm1 = (w: string) => normalize(w);
const toSet = (list: string[]) => new Set(list.map(norm1));
const SET = {
  fromAfter: toSet(FROM_AFTER),
  fromBefore: toSet(FROM_BEFORE),
  toAfter: toSet(TO_AFTER),
  toBefore: toSet(TO_BEFORE),
  attachedFrom: ATTACHED_FROM.map(norm1),
  genitive: toSet(GENITIVE),
  filler: toSet(FILLER),
};
const MONTH_OF = new Map<string, number>();
MONTHS.forEach((names, i) => names.forEach((n) => MONTH_OF.set(norm1(n), i + 1)));
const REL_OF = new Map<string, number>();
RELATIVE.forEach((r) => r.words.forEach((w) => REL_OF.set(norm1(w), r.days)));

const isStop = (t: string) =>
  SET.fromAfter.has(t) || SET.fromBefore.has(t) || SET.toAfter.has(t) || SET.toBefore.has(t) ||
  SET.filler.has(t) || MONTH_OF.has(t) || REL_OF.has(t) || /^\d+(st|nd|rd|th)?$/.test(t);

/* ───────────────────────── dates ───────────────────────── */

export interface Ymd { y: number; m: number; d: number }
export type DateKind = 'relative' | 'full' | 'day_month' | 'day_only' | 'assumed_today';
export interface ParsedDate { date: string; kind: DateKind; assumed: boolean }

/** Today's calendar date in India (IST, UTC+5:30), whatever the server's own timezone is. */
export function todayIST(now: number = Date.now()): Ymd {
  const t = new Date(now + 5.5 * 3600_000);
  return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate() };
}

const daysIn = (y: number, m: number) => new Date(Date.UTC(y, m, 0)).getUTCDate();
const pad = (n: number) => String(n).padStart(2, '0');
const fmt = (y: number, m: number, d: number) => `${y}-${pad(m)}-${pad(d)}`;
const cmp = (a: Ymd, b: Ymd) => a.y - b.y || a.m - b.m || a.d - b.d;

function addDays(t: Ymd, n: number): Ymd {
  const x = new Date(Date.UTC(t.y, t.m - 1, t.d + n));
  return { y: x.getUTCFullYear(), m: x.getUTCMonth() + 1, d: x.getUTCDate() };
}

/**
 * Rules (all in IST):
 *  - "today / kal / parso …"        → today + 0/1/2
 *  - only a day number ("13")       → this month if that day hasn't passed yet, else the next month that has such a day
 *  - day + month, no year ("13 dec")→ this year, or next year if that date has already passed
 *  - day + month + year             → exactly that
 *  - nothing recognisable           → today, flagged as assumed
 */
export function parseDate(text: string, now: number = Date.now()): ParsedDate {
  const today = todayIST(now);
  const n = normalize(text);
  const toks = tokensOf(n);

  // relative words (phrases first: "day after tomorrow")
  if (DAY_AFTER_PHRASES.some((p) => n.includes(norm1(p)))) {
    const t = addDays(today, 2);
    return { date: fmt(t.y, t.m, t.d), kind: 'relative', assumed: false };
  }
  for (const tok of toks) {
    const days = REL_OF.get(tok);
    if (days !== undefined) {
      const t = addDays(today, days);
      return { date: fmt(t.y, t.m, t.d), kind: 'relative', assumed: false };
    }
  }

  // 13/12 or 13/12/2026
  const slash = /(?:^|\s)(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?(?=\s|$)/.exec(n);
  if (slash) {
    const d = +slash[1], m = +slash[2];
    let y = slash[3] ? +slash[3] : 0;
    if (y && y < 100) y += 2000;
    const r = resolveDayMonth(d, m, y || null, today);
    if (r) return { date: r, kind: y ? 'full' : 'day_month', assumed: false };
  }

  // "13 dec", "dec 13", "13th of december 2026"
  const monthIdx = toks.findIndex((t) => MONTH_OF.has(t));
  const dayTokens = toks
    .map((t, i) => ({ t, i, m: /^(\d{1,2})(st|nd|rd|th)?$/.exec(t) }))
    .filter((x) => x.m && +x.m[1] >= 1 && +x.m[1] <= 31);
  if (monthIdx >= 0 && dayTokens.length) {
    const near = dayTokens.sort((a, b) => Math.abs(a.i - monthIdx) - Math.abs(b.i - monthIdx))[0];
    const yearTok = toks.find((t) => /^(20\d{2})$/.test(t));
    const y = yearTok ? +yearTok : null;
    const r = resolveDayMonth(+near.m![1], MONTH_OF.get(toks[monthIdx])!, y, today);
    if (r) return { date: r, kind: y ? 'full' : 'day_month', assumed: false };
  }

  // only a day number
  if (dayTokens.length) {
    const day = +dayTokens[0].m![1];
    let y = today.y, m = today.m;
    for (let i = 0; i < 13; i++) {
      if (day <= daysIn(y, m) && (i > 0 || day >= today.d)) return { date: fmt(y, m, day), kind: 'day_only', assumed: false };
      m += 1;
      if (m > 12) { m = 1; y += 1; }
    }
  }

  return { date: fmt(today.y, today.m, today.d), kind: 'assumed_today', assumed: true };
}

function resolveDayMonth(d: number, m: number, y: number | null, today: Ymd): string | null {
  if (m < 1 || m > 12 || d < 1) return null;
  if (y) return d <= daysIn(y, m) ? fmt(y, m, d) : null;
  for (const yy of [today.y, today.y + 1]) {
    if (d > daysIn(yy, m)) continue;
    if (cmp({ y: yy, m, d }, today) >= 0) return fmt(yy, m, d);
  }
  return null;
}

/* ───────────────────────── stations ───────────────────────── */

export const LANGS = ['en', 'hi', 'gu', 'mr', 'bn', 'te', 'pa', 'or'] as const;
export type Lang = (typeof LANGS)[number];

interface Cand { code: string; tokens: number; full: boolean; popular: boolean }
interface Index {
  keys: Map<string, Cand[]>;
  fuzzy: string[]; // keys eligible for fuzzy matching (single-word first keys)
  english: Map<string, string>;
  local: Record<string, Map<string, string>>;
}

const g = globalThis as unknown as { __lsVoiceIdx?: Index };

function readJson<T>(rel: string): T {
  return JSON.parse(fs.readFileSync(path.join(process.cwd(), rel), 'utf8')) as T;
}

function buildIndex(): Index {
  const english = new Map<string, string>();
  const keys = new Map<string, Cand[]>();
  const fuzzy = new Set<string>();
  const local: Record<string, Map<string, string>> = {};

  const add = (code: string, name: string) => {
    const toks = tokensOf(normalize(name));
    if (!toks.length) return;
    for (let k = 1; k <= Math.min(3, toks.length); k++) {
      const key = toks.slice(0, k).join(' ');
      const list = keys.get(key) ?? [];
      list.push({ code, tokens: toks.length, full: k === toks.length, popular: POPULAR.has(code) });
      keys.set(key, list);
      if (k === 1) fuzzy.add(key);
    }
  };

  for (const s of readJson<{ code: string; name: string }[]>('public/data/stations.json')) {
    english.set(s.code, s.name);
    add(s.code, s.name);
  }
  for (const l of LANGS.filter((x) => x !== 'en')) {
    const table = readJson<Record<string, string>>(`lib/voice/data/stations_${l}.json`);
    local[l] = new Map(Object.entries(table));
    for (const [code, name] of Object.entries(table)) add(code, name);
  }
  for (const [alias, code] of Object.entries(ALIASES)) {
    const key = normalize(alias);
    const list = keys.get(key) ?? [];
    list.unshift({ code, tokens: 1, full: true, popular: true });
    keys.set(key, list);
    fuzzy.add(key);
  }
  return { keys, fuzzy: [...fuzzy], english, local };
}

const index = () => (g.__lsVoiceIdx ??= buildIndex());

function best(list: Cand[]): string {
  // exact name beats prefix; then well-known stations; then the shortest (main) station name
  return [...list].sort(
    (a, b) => Number(b.full) - Number(a.full) || Number(b.popular) - Number(a.popular) || a.tokens - b.tokens || a.code.localeCompare(b.code),
  )[0].code;
}

function lookup(idx: Index, gram: string): string | null {
  const hit = idx.keys.get(gram);
  return hit ? best(hit) : null;
}

function fuzzyLookup(idx: Index, gram: string): string | null {
  if (gram.length < 5 || gram.includes(' ')) return null;
  const max = gram.length >= 7 ? 2 : 1; // 1 slip for short names, 2 for long ones
  let bestKey: string | null = null;
  let bestD = max + 1;
  for (const k of idx.fuzzy) {
    if (k[0] !== gram[0] || Math.abs(k.length - gram.length) > max) continue;
    const d = editDistance(gram, k, max);
    if (d === 2 && k[k.length - 1] !== gram[gram.length - 1]) continue; // 2 slips only if the ending agrees
    if (d < bestD) { bestD = d; bestKey = k; if (d === 0) break; }
  }
  return bestKey ? lookup(idx, bestKey) : null;
}

interface Match { code: string; start: number; end: number; fromSignal: boolean; toSignal: boolean }

function findStations(idx: Index, toks: string[]): Match[] {
  const run = (fuzzy: boolean): Match[] => {
    const out: Match[] = [];
    let i = 0;
    while (i < toks.length) {
      let found: { code: string; len: number; attached: boolean } | null = null;
      if (!isStop(toks[i])) {
        for (let n = Math.min(4, toks.length - i); n >= 1 && !found; n--) {
          const slice = toks.slice(i, i + n);
          if (slice.some((t, j) => j > 0 && (SET.fromAfter.has(t) || SET.toAfter.has(t) || SET.toBefore.has(t)))) continue;
          const gram = slice.join(' ');
          let code = lookup(idx, gram) ?? (fuzzy ? fuzzyLookup(idx, gram) : null);
          if (code) { found = { code, len: n, attached: false }; break; }
          if (n === 1) {
            // marker glued to the name: "જયપુરથી", "ଜୟପୁରରୁ", "जयपूरहून"
            for (const suf of SET.attachedFrom) {
              if (gram.length > suf.length + 2 && gram.endsWith(suf)) {
                const base = gram.slice(0, -suf.length);
                code = lookup(idx, base) ?? (fuzzy ? fuzzyLookup(idx, base) : null);
                if (code) { found = { code, len: 1, attached: true }; break; }
              }
            }
          }
        }
      }
      if (found) {
        const end = i + found.len;
        const next = toks[end];
        const next2 = toks[end + 1];
        const marker = next && SET.genitive.has(next) ? next2 : next;
        out.push({
          code: found.code,
          start: i,
          end,
          fromSignal: found.attached || (!!next && SET.fromAfter.has(next)) || (i > 0 && SET.fromBefore.has(toks[i - 1])),
          toSignal: (!!marker && SET.toAfter.has(marker)) || (i > 0 && SET.toBefore.has(toks[i - 1])),
        });
        i = end;
      } else i += 1;
    }
    return out;
  };
  const exact = run(false);
  const distinct = new Set(exact.map((m) => m.code));
  return distinct.size >= 2 ? exact : run(true);
}

/* ───────────────────────── public API ───────────────────────── */

export interface StationRef { code: string; name: string; nameLocal?: string }

export type VoiceResult =
  | { ok: true; heard: string; from: StationRef; to: StationRef; date: string; dateKind: DateKind; dateAssumed: boolean }
  | { ok: false; retry: true; heard: string; reason: 'empty' | 'no_stations' | 'missing_from' | 'missing_to' | 'same_station'; missing: ('from' | 'to')[]; message: string };

const MESSAGES: Record<Lang, Record<'again' | 'from' | 'to' | 'same', string>> = {
  en: {
    again: 'I could not catch the stations. Please say it again, for example “Jaipur to Kanpur on 13 December”.',
    from: 'Which station are you travelling from? Please say it again.',
    to: 'Which station are you travelling to? Please say it again.',
    same: 'The from and to stations are the same. Please say it again.',
  },
  hi: {
    again: 'स्टेशन समझ नहीं आए। कृपया फिर से बोलें, जैसे “जयपुर से कानपुर 13 दिसंबर”।',
    from: 'आप किस स्टेशन से जा रहे हैं? कृपया फिर से बोलें।',
    to: 'आप किस स्टेशन तक जा रहे हैं? कृपया फिर से बोलें।',
    same: 'शुरू और अंतिम स्टेशन एक ही हैं। कृपया फिर से बोलें।',
  },
  gu: {
    again: 'સ્ટેશન સમજાયા નહીં. કૃપા કરીને ફરી બોલો, જેમ કે “જયપુરથી કાનપુર 13 ડિસેમ્બર”.',
    from: 'તમે કયા સ્ટેશનથી જઈ રહ્યા છો? કૃપા કરીને ફરી બોલો.',
    to: 'તમે કયા સ્ટેશન સુધી જઈ રહ્યા છો? કૃપા કરીને ફરી બોલો.',
    same: 'શરૂઆત અને અંતનું સ્ટેશન એક જ છે. કૃપા કરીને ફરી બોલો.',
  },
  mr: {
    again: 'स्टेशन समजले नाहीत. कृपया पुन्हा बोला, उदा. “जयपूर ते कानपूर 13 डिसेंबर”.',
    from: 'तुम्ही कोणत्या स्टेशनवरून जात आहात? कृपया पुन्हा बोला.',
    to: 'तुम्ही कोणत्या स्टेशनपर्यंत जात आहात? कृपया पुन्हा बोला.',
    same: 'सुरुवात आणि शेवटचे स्टेशन सारखेच आहे. कृपया पुन्हा बोला.',
  },
  bn: {
    again: 'স্টেশন বুঝতে পারিনি। অনুগ্রহ করে আবার বলুন, যেমন “জয়পুর থেকে কানপুর 13 ডিসেম্বর”।',
    from: 'আপনি কোন স্টেশন থেকে যাচ্ছেন? অনুগ্রহ করে আবার বলুন।',
    to: 'আপনি কোন স্টেশন পর্যন্ত যাচ্ছেন? অনুগ্রহ করে আবার বলুন।',
    same: 'শুরু এবং শেষ স্টেশন একই। অনুগ্রহ করে আবার বলুন।',
  },
  te: {
    again: 'స్టేషన్లు అర్థం కాలేదు. దయచేసి మళ్లీ చెప్పండి, ఉదా. “జైపూర్ నుండి కాన్పూర్ 13 డిసెంబర్”.',
    from: 'మీరు ఏ స్టేషన్ నుండి వెళ్తున్నారు? దయచేసి మళ్లీ చెప్పండి.',
    to: 'మీరు ఏ స్టేషన్ వరకు వెళ్తున్నారు? దయచేసి మళ్లీ చెప్పండి.',
    same: 'బయలుదేరే మరియు చేరే స్టేషన్ ఒకటే. దయచేసి మళ్లీ చెప్పండి.',
  },
  pa: {
    again: 'ਸਟੇਸ਼ਨ ਸਮਝ ਨਹੀਂ ਆਏ। ਕਿਰਪਾ ਕਰਕੇ ਦੁਬਾਰਾ ਬੋਲੋ, ਜਿਵੇਂ “ਜੈਪੁਰ ਤੋਂ ਕਾਨਪੁਰ 13 ਦਸੰਬਰ”।',
    from: 'ਤੁਸੀਂ ਕਿਸ ਸਟੇਸ਼ਨ ਤੋਂ ਜਾ ਰਹੇ ਹੋ? ਕਿਰਪਾ ਕਰਕੇ ਦੁਬਾਰਾ ਬੋਲੋ।',
    to: 'ਤੁਸੀਂ ਕਿਸ ਸਟੇਸ਼ਨ ਤੱਕ ਜਾ ਰਹੇ ਹੋ? ਕਿਰਪਾ ਕਰਕੇ ਦੁਬਾਰਾ ਬੋਲੋ।',
    same: 'ਸ਼ੁਰੂ ਅਤੇ ਅੰਤ ਦਾ ਸਟੇਸ਼ਨ ਇੱਕੋ ਹੈ। ਕਿਰਪਾ ਕਰਕੇ ਦੁਬਾਰਾ ਬੋਲੋ।',
  },
  or: {
    again: 'ଷ୍ଟେସନ ବୁଝିପାରିଲି ନାହିଁ। ଦୟାକରି ପୁଣି କୁହନ୍ତୁ, ଯେପରି “ଜୟପୁରରୁ କାନପୁର 13 ଡିସେମ୍ବର”।',
    from: 'ଆପଣ କେଉଁ ଷ୍ଟେସନରୁ ଯାଉଛନ୍ତି? ଦୟାକରି ପୁଣି କୁହନ୍ତୁ।',
    to: 'ଆପଣ କେଉଁ ଷ୍ଟେସନ ପର୍ଯ୍ୟନ୍ତ ଯାଉଛନ୍ତି? ଦୟାକରି ପୁଣି କୁହନ୍ତୁ।',
    same: 'ଆରମ୍ଭ ଏବଂ ଶେଷ ଷ୍ଟେସନ ଏକ। ଦୟାକରି ପୁଣି କୁହନ୍ତୁ।',
  },
};

export const asLang = (v: unknown): Lang => (LANGS as readonly string[]).includes(String(v)) ? (v as Lang) : 'en';

const titleCase = (s: string) => s.toLowerCase().replace(/(^|[\s.(-])(\p{L})/gu, (_m, p: string, c: string) => p + c.toUpperCase());

function ref(idx: Index, code: string, lang: Lang): StationRef {
  return {
    code,
    name: titleCase(idx.english.get(code) ?? code),
    ...(lang !== 'en' && idx.local[lang]?.get(code) ? { nameLocal: idx.local[lang].get(code) } : {}),
  };
}

export function parseVoice(text: string, langHint?: unknown, now: number = Date.now()): VoiceResult {
  const lang = asLang(langHint);
  const heard = String(text ?? '').replace(/\s+/g, ' ').trim().slice(0, 300);
  const retry = (reason: Extract<VoiceResult, { ok: false }>['reason'], missing: ('from' | 'to')[], key: 'again' | 'from' | 'to' | 'same'): VoiceResult => ({
    ok: false, retry: true, heard, reason, missing, message: MESSAGES[lang][key],
  });
  if (!heard) return retry('empty', ['from', 'to'], 'again');

  const idx = index();
  const toks = tokensOf(normalize(heard));
  const found = findStations(idx, toks);

  // keep each station once, in the order spoken
  const seen = new Set<string>();
  const uniq = found.filter((m) => (seen.has(m.code) ? false : (seen.add(m.code), true)));
  if (uniq.length === 0) return retry('no_stations', ['from', 'to'], 'again');
  if (uniq.length === 1) {
    const only = uniq[0];
    // a lone station that is clearly the destination → the origin is missing, otherwise the destination is
    return only.toSignal && !only.fromSignal ? retry('missing_from', ['from'], 'from') : retry('missing_to', ['to'], 'to');
  }

  let [a, b] = uniq;
  // "Kanpur tak Jaipur se" / "to Kanpur from Jaipur": spoken in reverse
  if ((a.toSignal && !a.fromSignal && (b.fromSignal || !b.toSignal)) || (b.fromSignal && !b.toSignal && !a.fromSignal)) [a, b] = [b, a];
  if (a.code === b.code) return retry('same_station', ['to'], 'same');

  const d = parseDate(heard, now);
  return {
    ok: true,
    heard,
    from: ref(idx, a.code, lang),
    to: ref(idx, b.code, lang),
    date: d.date,
    dateKind: d.kind,
    dateAssumed: d.assumed,
  };
}
