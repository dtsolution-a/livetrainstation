/* eslint-disable @typescript-eslint/no-explicit-any */
import * as store from './store';
import { PLAY_STORE_URL } from './config';

export interface PageSeo { title?: string; description?: string; noindex?: boolean; ogImage?: string }
export interface Redirect { from: string; to: string; code: 301 | 302 }

export interface Settings {
  seo: {
    indexing: boolean;
    siteName: string;
    titleSuffix: string;
    defaultDescription: string;
    defaultOgImage: string;
    pages: Record<string, PageSeo>;
    robotsExtra: string;
    googleVerification: string;
    bingVerification: string;
  };
  redirects: Redirect[];
  analytics: { ga4: string; gtm: string; clarity: string };
  site: { playStoreUrl: string; showAppBanner: boolean };
  security: { sessionHours: number };
}

/** Editable static pages (path → label) — used by the admin SEO screen. */
export const SEO_PAGES: { path: string; label: string }[] = [
  { path: '/', label: 'Home' },
  { path: '/search', label: 'Search Trains' },
  { path: '/live', label: 'Live Train Status' },
  { path: '/station-board', label: 'Station Board' },
  { path: '/pnr', label: 'PNR Status' },
  { path: '/train-info', label: 'Train Info' },
  { path: '/coach-position', label: 'Coach Position' },
  { path: '/blogs', label: 'Blog index' },
  { path: '/privacy', label: 'Privacy Policy' },
  { path: '/terms', label: 'Terms' },
];

export const DEFAULT_SETTINGS: Settings = {
  seo: {
    indexing: true,
    siteName: 'Live Train Station',
    titleSuffix: '',
    defaultDescription:
      "Track live train status, check PNR status, search trains between stations, get fare info and more. India's smartest railway companion.",
    defaultOgImage: '/images/og-image.png',
    pages: {},
    robotsExtra: '',
    googleVerification: '',
    bingVerification: '',
  },
  redirects: [],
  analytics: { ga4: '', gtm: '', clarity: '' },
  site: { playStoreUrl: PLAY_STORE_URL, showAppBanner: true },
  security: { sessionHours: 12 },
};

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);

function merge<T>(base: T, over: unknown): T {
  if (!isObj(base) || !isObj(over)) return (over === undefined ? base : (over as T));
  const out: Record<string, unknown> = { ...base };
  for (const [k, v] of Object.entries(over)) {
    out[k] = isObj((base as Record<string, unknown>)[k]) && isObj(v) ? merge((base as Record<string, unknown>)[k], v) : v;
  }
  return out as T;
}

export function getSettings(): Settings {
  return merge(DEFAULT_SETTINGS, store.get<Record<string, unknown>>('settings'));
}

/* ---------- sanitising what the admin submits ---------- */

const text = (v: unknown, max: number) => (typeof v === 'string' ? v.replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max) : '');
const safeUrl = (v: unknown) => {
  const s = text(v, 500);
  return /^(\/(?!\/)[^\s]*|https:\/\/[^\s]+)$/i.test(s) ? s : '';
};

export function sanitizeSettings(input: unknown): Settings {
  const i = (isObj(input) ? input : {}) as Record<string, any>;
  const seo = (isObj(i.seo) ? i.seo : {}) as Record<string, any>;
  const pages: Record<string, PageSeo> = {};
  if (isObj(seo.pages)) {
    for (const [path, v] of Object.entries(seo.pages)) {
      if (!/^\/[a-z0-9\-/]*$/.test(path) || !isObj(v)) continue;
      pages[path] = {
        title: text(v.title, 120) || undefined,
        description: text(v.description, 320) || undefined,
        noindex: v.noindex === true ? true : undefined,
        ogImage: safeUrl(v.ogImage) || undefined,
      };
    }
  }
  const redirects: Redirect[] = [];
  if (Array.isArray(i.redirects)) {
    for (const r of i.redirects.slice(0, 200)) {
      const from = text(r?.from, 200).replace(/\/+$/, '') || '/';
      const to = safeUrl(r?.to);
      if (!/^\/[^\s?#]*$/.test(from) || !to || from === '/' || from === to) continue;
      redirects.push({ from, to, code: r?.code === 302 ? 302 : 301 });
    }
  }
  const an = (isObj(i.analytics) ? i.analytics : {}) as Record<string, any>;
  const id = (v: unknown, re: RegExp) => { const s = text(v, 40); return re.test(s) ? s : ''; };
  const site = (isObj(i.site) ? i.site : {}) as Record<string, any>;
  const play = text(site.playStoreUrl, 300);
  return {
    seo: {
      indexing: seo.indexing !== false,
      siteName: text(seo.siteName, 80) || DEFAULT_SETTINGS.seo.siteName,
      titleSuffix: text(seo.titleSuffix, 80),
      defaultDescription: text(seo.defaultDescription, 320) || DEFAULT_SETTINGS.seo.defaultDescription,
      defaultOgImage: safeUrl(seo.defaultOgImage) || DEFAULT_SETTINGS.seo.defaultOgImage,
      pages,
      robotsExtra: String(seo.robotsExtra ?? '').replace(/[^\x20-\x7e\n]/g, '').slice(0, 2000),
      googleVerification: id(seo.googleVerification, /^[A-Za-z0-9_-]{10,100}$/),
      bingVerification: id(seo.bingVerification, /^[A-Za-z0-9_-]{10,100}$/),
    },
    redirects,
    analytics: {
      ga4: id(an.ga4, /^G-[A-Z0-9]{6,14}$/),
      gtm: id(an.gtm, /^GTM-[A-Z0-9]{4,12}$/),
      clarity: id(an.clarity, /^[a-z0-9]{6,14}$/),
    },
    site: {
      playStoreUrl: /^https:\/\/play\.google\.com\/store\/apps\/details\?id=[A-Za-z0-9._]+/.test(play) ? play : PLAY_STORE_URL,
      showAppBanner: site.showAppBanner !== false,
    },
    security: { sessionHours: Math.min(168, Math.max(1, Number(i.security?.sessionHours) || 12)) },
  };
}
