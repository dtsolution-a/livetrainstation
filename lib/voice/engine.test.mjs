// Run: node --test lib/voice/engine.test.mjs   (Node 22.6+/24 runs the .ts import directly)
import test from 'node:test';
import assert from 'node:assert/strict';
import { parseDate, parseVoice, normalize } from './engine.ts';

// Wednesday 18 Nov 2026, 12:00 IST
const NOW = Date.UTC(2026, 10, 18, 6, 30);
const d = (t, now = NOW) => parseDate(t, now).date;

test('relative dates', () => {
  assert.equal(d('aaj'), '2026-11-18');
  assert.equal(d('kal'), '2026-11-19');
  assert.equal(d('parso'), '2026-11-20');
  assert.equal(d('day after tomorrow'), '2026-11-20');
  assert.equal(d('कल'), '2026-11-19');
  assert.equal(d('परसों'), '2026-11-20');
  assert.equal(d('tomorrow'), '2026-11-19');
});

test('only a day: this month if still ahead, else next month', () => {
  assert.equal(d('25'), '2026-11-25');
  assert.equal(d('18'), '2026-11-18'); // today counts as not passed
  assert.equal(d('13'), '2026-12-13'); // already passed this month
  assert.equal(d('13 tarikh ko'), '2026-12-13');
  assert.equal(d('13th'), '2026-12-13');
  assert.equal(d('१३'), '2026-12-13'); // Devanagari digits
});

test('only a day rolls over month length and year end', () => {
  assert.equal(d('31'), '2026-12-31'); // November has 30 days
  const dec20 = Date.UTC(2026, 11, 20, 6, 30);
  assert.equal(d('5', dec20), '2027-01-05');
  const jan31 = Date.UTC(2027, 0, 31, 6, 30);
  assert.equal(d('30', jan31), '2027-03-30'); // February has no 30th
});

test('day + month without a year', () => {
  assert.equal(d('13 dec'), '2026-12-13');
  assert.equal(d('13 december'), '2026-12-13');
  assert.equal(d('december 13'), '2026-12-13');
  assert.equal(d('13 nov'), '2027-11-13'); // passed → next year
  assert.equal(d('18 nov'), '2026-11-18');
  assert.equal(d('5 jan'), '2027-01-05');
  assert.equal(d('13 दिसंबर'), '2026-12-13');
  assert.equal(d('13 ડિસેમ્બર'), '2026-12-13');
  assert.equal(d('13 ডিসেম্বর'), '2026-12-13');
  assert.equal(d('13 డిసెంబర్'), '2026-12-13');
});

test('numeric and full dates', () => {
  assert.equal(d('13/12'), '2026-12-13');
  assert.equal(d('13-12-2027'), '2027-12-13');
  assert.equal(d('13 december 2027'), '2027-12-13');
});

test('no date spoken → today, flagged as assumed', () => {
  const r = parseDate('jaipur se kanpur', NOW);
  assert.equal(r.date, '2026-11-18');
  assert.equal(r.assumed, true);
});

const v = (t, lang = 'en') => parseVoice(t, lang, NOW);
const route = (t, lang) => {
  const r = v(t, lang);
  assert.ok(r.ok, `expected ok for "${t}" but got ${JSON.stringify(r)}`);
  return `${r.from.code}>${r.to.code}@${r.date}`;
};

test('English / Hinglish', () => {
  assert.equal(route('Jaipur to Kanpur on 13 December'), 'JP>CNB@2026-12-13');
  assert.equal(route('from jaipur to kanpur tomorrow'), 'JP>CNB@2026-11-19');
  assert.equal(route('mujhe jaipur se kanpur ki 13 dec ka dikhao'), 'JP>CNB@2026-12-13');
  assert.equal(route('jaipur se kanpur kal'), 'JP>CNB@2026-11-19');
  assert.equal(route('kanpur tak jaipur se parso'), 'JP>CNB@2026-11-20');
  assert.equal(route('to kanpur from jaipur'), 'JP>CNB@2026-11-18');
  assert.equal(route('delhi to jaipur 25'), 'NDLS>JP@2026-11-25');
});

test('Hindi', () => {
  assert.equal(route('जयपुर से कानपुर 13 दिसंबर', 'hi'), 'JP>CNB@2026-12-13');
  assert.equal(route('मुझे जयपुर से कानपुर की 13 तारीख की ट्रेन दिखाओ', 'hi'), 'JP>CNB@2026-12-13');
  assert.equal(route('कानपुर तक जयपुर से कल', 'hi'), 'JP>CNB@2026-11-19');
  assert.equal(route('दिल्ली से जयपुर परसों', 'hi'), 'NDLS>JP@2026-11-20');
});

test('other languages', () => {
  assert.equal(route('જયપુરથી કાનપુર 13 ડિસેમ્બર', 'gu'), 'JP>CNB@2026-12-13');
  assert.equal(route('জয়পুর থেকে কানপুর 13 ডিসেম্বর', 'bn'), 'JP>CNB@2026-12-13');
  assert.equal(route('జయపుర్ నుండి కాన్పూర్ 13 డిసెంబర్', 'te'), 'JP>CNB@2026-12-13');
  assert.equal(route('ਜੈਪੁਰ ਤੋਂ ਕਾਨਪੁਰ 13 ਦਸੰਬਰ', 'pa'), 'JP>CNB@2026-12-13');
  assert.equal(route('ଜୟପୁରରୁ କାନପୁର 13 ଡିସେମ୍ବର', 'or'), 'JP>CNB@2026-12-13');
  assert.equal(route('जयपूर ते कानपूर 13 डिसेंबर', 'mr'), 'JP>CNB@2026-12-13');
});

test('spelling slips are forgiven', () => {
  assert.equal(route('jaipoor to kanpoor 13 dec'), 'JP>CNB@2026-12-13');
  assert.equal(route('jaipur se kanpur central'), 'JP>CNB@2026-11-18');
});

test('retry answers', () => {
  const one = v('jaipur se');
  assert.equal(one.ok, false);
  assert.deepEqual(one.missing, ['to']);
  const only = v('to kanpur');
  assert.deepEqual(only.missing, ['from']);
  const none = v('hello how are you');
  assert.equal(none.ok, false);
  assert.equal(none.reason, 'no_stations');
  const empty = v('   ');
  assert.equal(empty.reason, 'empty');
  const same = v('jaipur to jaipur');
  assert.equal(same.ok, false);
  assert.match(v('xyz', 'hi').message, /स्टेशन/);
});

test('normalize unifies digits and punctuation', () => {
  assert.equal(normalize('१३, दिसंबर!'), '13 दिसंबर');
  assert.equal(normalize('Jaipur—Kanpur'), 'jaipur kanpur');
});
