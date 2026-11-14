'use client';

import { createContext, useContext } from 'react';

export interface SiteConfigValue { playStoreUrl: string; showAppBanner: boolean }

// Default = the official listing, so the link works even before settings are read.
const DEFAULT: SiteConfigValue = {
  playStoreUrl: 'https://play.google.com/store/apps/details?id=com.livetrainstation.raiilsaathi',
  showAppBanner: true,
};

const Ctx = createContext<SiteConfigValue>(DEFAULT);

/** Values saved in the admin panel, handed from the server layout to client components. */
export function SiteConfigProvider({ value, children }: { value: SiteConfigValue; children: React.ReactNode }) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useSiteConfig = () => useContext(Ctx);
