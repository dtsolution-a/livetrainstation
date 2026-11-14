import fs from 'node:fs';
import path from 'node:path';
import * as store from './store';
import { DATA_DIR, config } from './config';
import { hashPassword, randomPassword } from './security';
import { blogPosts } from '../blogs';
import type { Post } from './posts';
import type { User } from './http';

const g = globalThis as unknown as { __lsReady?: Promise<void> };

/** Idempotent first-run setup: data folders, owner account, and the existing blog posts. */
export function ensureReady(): Promise<void> {
  return (g.__lsReady ??= run().catch((e) => {
    g.__lsReady = undefined;
    throw e;
  }));
}

async function run() {
  store.ensureDirs();

  const users = store.get<User[]>('users');
  if (users.length === 0 && config.adminEmail) {
    const generated = !config.adminPassword;
    const password = config.adminPassword || randomPassword();
    await store.update<User[]>('users', (list) => {
      list.push({
        id: store.newId(),
        email: config.adminEmail,
        name: config.adminName,
        role: 'owner',
        active: true,
        passwordHash: hashPassword(password),
        mustChangePassword: generated,
        tokenVersion: 0,
        createdAt: new Date().toISOString(),
      });
    });
    if (generated) {
      const note =
        `First sign-in for ${config.adminEmail}\nTemporary password: ${password}\n\n` +
        `You must change it at first sign-in. DELETE THIS FILE afterwards.\n`;
      fs.writeFileSync(path.join(DATA_DIR, 'FIRST_RUN.txt'), note, { mode: 0o600 });
      console.log(`[admin] owner account created. Temporary password saved in ${path.join(DATA_DIR, 'FIRST_RUN.txt')}`);
    } else {
      console.log(`[admin] owner account created for ${config.adminEmail}`);
    }
  } else if (users.length === 0) {
    console.warn('[admin] No users yet. Set ADMIN_EMAIL (and ADMIN_PASSWORD) in the environment and restart to create the owner account.');
  }

  // One-time import of the blog posts that used to live in lib/blogs.ts.
  const meta = store.get<Record<string, unknown>>('meta');
  if (!meta.postsSeeded) {
    if (store.get<Post[]>('posts').length === 0) {
      const now = new Date().toISOString();
      await store.update<Post[]>('posts', (list) => {
        for (const b of blogPosts) {
          list.push({
            id: store.newId(),
            slug: b.slug,
            title: b.title,
            excerpt: b.excerpt,
            content: b.content.trim(),
            tag: b.tag,
            readTime: b.readTime,
            author: b.author,
            status: 'published',
            publishedAt: new Date(b.date).toISOString(),
            scheduledFor: null,
            featured: false,
            coverImage: '',
            seoTitle: '',
            seoDescription: '',
            noindex: false,
            createdAt: now,
            updatedAt: now,
            updatedBy: 'import',
          });
        }
      });
    }
    await store.update<Record<string, unknown>>('meta', (m) => {
      m.postsSeeded = true;
    });
  }
}
