import { cookies } from 'next/headers';
import { isLang, type Lang } from '../langs.ts';

export const LANG_COOKIE = 'ls_lang';

/** Language for a public page: an explicit ?lang= wins, then the visitor's saved choice, else English. */
export async function pageLang(param?: string | string[]): Promise<Lang> {
  const p = Array.isArray(param) ? param[0] : param;
  if (isLang(p)) return p;
  const saved = (await cookies()).get(LANG_COOKIE)?.value;
  return isLang(saved) ? saved : 'en';
}
