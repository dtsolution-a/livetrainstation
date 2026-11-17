import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  availableLangs, isVisibleFor, localize, primaryLang, readMinutesOf, resolveLang, translationsOf,
  type LegacyFields, type Translation,
} from './blog-lang.ts';

const t = (title: string, content = 'x '.repeat(30)): Translation => ({ title, excerpt: `${title} excerpt`, content, seoTitle: '', seoDescription: '' });
const post = (translations: LegacyFields['translations']): LegacyFields => ({
  title: 'legacy', excerpt: '', content: 'legacy body '.repeat(5), seoTitle: '', seoDescription: '', translations,
});

test('a post saved before translations existed is English', () => {
  const p = post(undefined);
  assert.deepEqual(availableLangs(p), ['en']);
  assert.equal(translationsOf(p).en?.title, 'legacy');
  assert.equal(localize(p, 'gu')?.lang, 'en');
});

test('English + Gujarati: Gujarati users get Gujarati, everyone else English', () => {
  const p = post({ en: t('Tatkal'), gu: t('તત્કાલ') });
  assert.equal(localize(p, 'gu')?.title, 'તત્કાલ');
  assert.equal(localize(p, 'gu')?.lang, 'gu');
  for (const l of ['en', 'hi', 'mr', 'bn', 'te', 'pa', 'or']) {
    assert.equal(isVisibleFor(p, l), true, l);
    assert.equal(resolveLang(p, l), 'en', l);
  }
});

test('a Marathi-only post is shown to Marathi users only', () => {
  const p = post({ mr: t('तत्काळ') });
  assert.equal(isVisibleFor(p, 'mr'), true);
  for (const l of ['en', 'hi', 'gu', 'bn', 'te', 'pa', 'or']) assert.equal(isVisibleFor(p, l), false, l);
  assert.equal(localize(p, 'mr')?.lang, 'mr');
});

test('English and Hindi posts are for everybody; English wins over Hindi', () => {
  const hiOnly = post({ hi: t('तत्काल') });
  assert.equal(isVisibleFor(hiOnly, 'te'), true);
  assert.equal(resolveLang(hiOnly, 'te'), 'hi');
  const both = post({ hi: t('तत्काल'), en: t('Tatkal') });
  assert.equal(resolveLang(both, 'te'), 'en');
  assert.equal(resolveLang(both, 'hi'), 'hi');
});

test('Marathi + Gujarati post: shown to those two only', () => {
  const p = post({ mr: t('a'), gu: t('b') });
  assert.equal(isVisibleFor(p, 'mr'), true);
  assert.equal(isVisibleFor(p, 'gu'), true);
  assert.equal(isVisibleFor(p, 'en'), false);
  assert.equal(isVisibleFor(p, 'hi'), false);
});

test('a translation without a body does not count', () => {
  const p = post({ en: t('Tatkal'), gu: { ...t('તત્કાલ'), content: '   ' } });
  assert.deepEqual(availableLangs(p), ['en']);
  assert.equal(localize(p, 'gu')?.lang, 'en');
});

test('unknown language codes fall back like an unsupported language', () => {
  const p = post({ en: t('Tatkal') });
  assert.equal(isVisibleFor(p, 'xx'), true);
  assert.equal(resolveLang(p, 'xx'), 'en');
  assert.equal(isVisibleFor(post({ mr: t('a') }), 'xx'), false);
});

test('primary language order and languages list', () => {
  assert.equal(primaryLang(['gu', 'hi']), 'hi');
  assert.equal(primaryLang(['gu', 'mr']), 'gu');
  assert.equal(primaryLang([]), undefined);
  assert.deepEqual(availableLangs(post({ or: t('a'), en: t('b'), hi: t('c') })), ['en', 'hi', 'or']);
});

test('read time is per language', () => {
  assert.equal(readMinutesOf('word '.repeat(10)), 1);
  assert.equal(readMinutesOf('word '.repeat(1000)), 5);
  const p = post({ en: t('a', 'word '.repeat(1000)), gu: t('b', 'word '.repeat(400)) });
  assert.equal(localize(p, 'en')?.readMinutes, 5);
  assert.equal(localize(p, 'gu')?.readMinutes, 2);
});
