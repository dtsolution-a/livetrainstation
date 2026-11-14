import { NextResponse } from 'next/server';
import { COOKIE_NAME, COOKIE_SECURE, type User } from './http';
import { signToken } from './security';
import { permissionsFor } from './rbac';
import { getSettings } from './settings';

export const publicUser = (u: User) => ({
  id: u.id,
  email: u.email,
  name: u.name,
  role: u.role,
  active: u.active !== false,
  mustChangePassword: Boolean(u.mustChangePassword),
  twoFactor: Boolean(u.totp?.enabled),
  createdAt: u.createdAt,
  lastLoginAt: u.lastLoginAt || null,
});

export const sessionInfo = (u: User) => ({ user: publicUser(u), permissions: permissionsFor(u.role) });

const sessionSeconds = () => getSettings().security.sessionHours * 3600;

export function setSession<T extends NextResponse>(res: T, user: User): T {
  const now = Date.now();
  const token = signToken({ u: user.id, v: user.tokenVersion || 0, t: now, e: now + sessionSeconds() * 1000 });
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: COOKIE_SECURE,
    sameSite: 'strict',
    path: '/',
    maxAge: sessionSeconds(),
  });
  return res;
}

export function clearSession<T extends NextResponse>(res: T): T {
  res.cookies.set(COOKIE_NAME, '', { httpOnly: true, secure: COOKIE_SECURE, sameSite: 'strict', path: '/', maxAge: 0 });
  return res;
}
