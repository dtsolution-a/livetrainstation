/** The eight languages the app (and now the blog) is available in. */
export const LANGS = [
  { code: 'en', name: 'English', native: 'English' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
  { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી' },
  { code: 'mr', name: 'Marathi', native: 'मराठी' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు' },
  { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
  { code: 'or', name: 'Odia', native: 'ଓଡ଼ିଆ' },
] as const;

export type Lang = (typeof LANGS)[number]['code'];

export const LANG_CODES: Lang[] = LANGS.map((l) => l.code);

export const isLang = (v: unknown): v is Lang => typeof v === 'string' && (LANG_CODES as string[]).includes(v);

export const langNative = (code: string) => LANGS.find((l) => l.code === code)?.native ?? code;
export const langName = (code: string) => LANGS.find((l) => l.code === code)?.name ?? code;
