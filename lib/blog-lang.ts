import { isLang, LANG_CODES, type Lang } from './langs.ts';

/**
 * Language rules for blog posts. Pure functions, no I/O, so they are easy to test and are
 * shared by the admin editor, the public pages and the app API.
 *
 * A post has one translation per language it was written in. Who sees what:
 *  - someone using language L sees the post in L when it exists;
 *  - otherwise they get the English version, or failing that the Hindi one
 *    (English and Hindi posts are for everybody);
 *  - a post written only in other languages (say just Marathi) is shown only to people
 *    using one of those languages.
 */

export interface Translation {
  title: string;
  excerpt: string;
  content: string;
  seoTitle: string;
  seoDescription: string;
}

export type Translations = Partial<Record<Lang, Translation>>;

/** The legacy single-language fields every older post has. */
export interface LegacyFields {
  title: string;
  excerpt: string;
  content: string;
  seoTitle: string;
  seoDescription: string;
  translations?: Translations;
}

/** Languages that everybody can read: a post in one of these is never hidden. */
export const UNIVERSAL: Lang[] = ['en', 'hi'];

export const emptyTranslation = (): Translation => ({ title: '', excerpt: '', content: '', seoTitle: '', seoDescription: '' });

/** A translation counts once it has a title and a body. */
export const isFilled = (t?: Partial<Translation> | null): t is Translation =>
  !!t && typeof t.title === 'string' && t.title.trim().length > 0 && typeof t.content === 'string' && t.content.trim().length > 0;

/** Translations of a post; posts saved before translations existed are English. */
export function translationsOf(post: LegacyFields): Translations {
  if (post.translations && Object.keys(post.translations).length > 0) return post.translations;
  return {
    en: {
      title: post.title,
      excerpt: post.excerpt,
      content: post.content,
      seoTitle: post.seoTitle,
      seoDescription: post.seoDescription,
    },
  };
}

/** Languages this post is written in, in the standard order. */
export function availableLangs(post: LegacyFields): Lang[] {
  const t = translationsOf(post);
  return LANG_CODES.filter((l) => isFilled(t[l]));
}

/** The language whose text the legacy fields mirror: English, else Hindi, else the first one written. */
export function primaryLang(langs: Lang[]): Lang | undefined {
  return UNIVERSAL.find((l) => langs.includes(l)) ?? langs[0];
}

/** Should somebody using [lang] be shown this post in a list? */
export function isVisibleFor(post: LegacyFields, lang: string): boolean {
  const have = availableLangs(post);
  if (have.length === 0) return false;
  if (isLang(lang) && have.includes(lang)) return true;
  return UNIVERSAL.some((u) => have.includes(u));
}

/** Which of the post's languages to show somebody who asked for [lang]. */
export function resolveLang(post: LegacyFields, lang: string): Lang | undefined {
  const have = availableLangs(post);
  if (isLang(lang) && have.includes(lang)) return lang;
  return primaryLang(have);
}

export const readMinutesOf = (content: string) => Math.max(1, Math.round(content.split(/\s+/).filter(Boolean).length / 200));

/** The text to show for [lang] (falling back as above), or undefined if the post has no usable text. */
export function localize(post: LegacyFields, lang: string): (Translation & { lang: Lang; languages: Lang[]; readMinutes: number }) | undefined {
  const resolved = resolveLang(post, lang);
  if (!resolved) return undefined;
  const t = translationsOf(post)[resolved]!;
  return { ...t, lang: resolved, languages: availableLangs(post), readMinutes: readMinutesOf(t.content) };
}
