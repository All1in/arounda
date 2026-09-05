import type { Photo } from '@/types/photo';

export const ACCOUNT_KEY = 'gallery.account';
export const SAVED_KEY = 'gallery.saved';

export const NAME_MIN_LENGTH = 2;
export const NAME_MAX_LENGTH = 50;

export const STORAGE_UNAVAILABLE_MESSAGE = 'Storage is unavailable in this browser.';
export const DUPLICATE_EMAIL_MESSAGE =
  'An account with this email already exists in this browser. Log in instead.';
export const UNKNOWN_EMAIL_MESSAGE = 'We could not find an account with this email.';
export const INVALID_EMAIL_MESSAGE = 'Enter a valid email address.';
export const INVALID_NAME_MESSAGE = `Enter a name between ${NAME_MIN_LENGTH} and ${NAME_MAX_LENGTH} characters.`;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface Account {
  name: string;
  email: string;
  createdAt: string;
}

export interface StoreSnapshot {
  account: Account | null;
  signedIn: boolean;
  saved: Photo[];
  storageAvailable: boolean;
}

export type StoreErrorField = 'name' | 'email' | 'form';

export type StoreResult = { ok: true } | { ok: false; field: StoreErrorField; message: string };

interface PersistedAccount {
  account: Account | null;
  signedIn: boolean;
}

const SIGNED_OUT: PersistedAccount = { account: null, signedIn: false };

const listeners = new Set<() => void>();
let snapshot: StoreSnapshot | null = null;
// only a failed read means storage is unusable; a failed write (a full quota) is transient
// and must not hide the collection that would let the user free space again
let storageAvailable = true;

function storage(): Storage {
  if (typeof window === 'undefined') throw new Error('localStorage is not available');
  return window.localStorage;
}

function read<T>(key: string, parse: (value: unknown) => T, fallback: T): T {
  let raw: string | null;

  try {
    raw = storage().getItem(key);
  } catch {
    storageAvailable = false;
    return fallback;
  }

  if (raw === null) return fallback;

  try {
    return parse(JSON.parse(raw));
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): boolean {
  try {
    storage().setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function text(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() !== '' ? value : fallback;
}

function numeric(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : fallback;
}

function parseAccount(value: unknown): PersistedAccount {
  if (typeof value !== 'object' || value === null) return SIGNED_OUT;

  const record = value as Record<string, unknown>;
  const stored = record.account;
  if (typeof stored !== 'object' || stored === null) return SIGNED_OUT;

  const { name, email, createdAt } = stored as Record<string, unknown>;
  if (typeof name !== 'string' || typeof email !== 'string') return SIGNED_OUT;

  return {
    account: { name, email, createdAt: typeof createdAt === 'string' ? createdAt : '' },
    signedIn: record.signedIn === true,
  };
}

// we wrote this, but localStorage is user-editable — parse it like any other untrusted input
function parsePhoto(value: unknown): Photo | null {
  if (typeof value !== 'object' || value === null) return null;

  const record = value as Record<string, unknown>;
  const person = record.photographer;
  if (typeof record.id !== 'string' || record.id === '') return null;
  if (typeof record.rawUrl !== 'string' || record.rawUrl === '') return null;
  if (typeof person !== 'object' || person === null) return null;

  const photographer = person as Record<string, unknown>;

  return {
    id: record.id,
    width: numeric(record.width, 4),
    height: numeric(record.height, 3),
    color: text(record.color, '#f2f2f2'),
    rawUrl: record.rawUrl,
    alt: text(record.alt, 'Saved photo'),
    description: typeof record.description === 'string' ? record.description : null,
    likes: typeof record.likes === 'number' && Number.isFinite(record.likes) ? record.likes : 0,
    createdAt: typeof record.createdAt === 'string' ? record.createdAt : null,
    tags: Array.isArray(record.tags)
      ? record.tags.filter((tag): tag is string => typeof tag === 'string')
      : [],
    unsplashUrl: text(record.unsplashUrl, 'https://unsplash.com'),
    photographer: {
      name: text(photographer.name, 'Unknown'),
      username: typeof photographer.username === 'string' ? photographer.username : '',
      profileUrl: typeof photographer.profileUrl === 'string' ? photographer.profileUrl : null,
      avatarUrl: typeof photographer.avatarUrl === 'string' ? photographer.avatarUrl : null,
    },
  };
}

function parseSaved(value: unknown): Photo[] {
  if (!Array.isArray(value)) return [];

  const seen = new Set<string>();
  const photos: Photo[] = [];

  for (const item of value) {
    const photo = parsePhoto(item);
    if (!photo || seen.has(photo.id)) continue;
    seen.add(photo.id);
    photos.push(photo);
  }

  return photos;
}

function current(): StoreSnapshot {
  if (snapshot === null) {
    const persisted = read(ACCOUNT_KEY, parseAccount, SIGNED_OUT);
    const saved = read(SAVED_KEY, parseSaved, []);
    snapshot = { ...persisted, saved, storageAvailable };
  }

  return snapshot;
}

function invalidate(): void {
  snapshot = null;
  for (const listener of listeners) listener();
}

function handleStorageEvent(event: StorageEvent): void {
  if (event.key !== null && event.key !== ACCOUNT_KEY && event.key !== SAVED_KEY) return;
  invalidate();
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  if (listeners.size === 1) {
    window.addEventListener('storage', handleStorageEvent);
  }

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      window.removeEventListener('storage', handleStorageEvent);
    }
  };
}

export function getSnapshot(): StoreSnapshot {
  return current();
}

export function getServerSnapshot(): null {
  return null;
}

function normalizeName(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function validateName(value: string): string | null {
  const name = normalizeName(value);
  return name.length < NAME_MIN_LENGTH || name.length > NAME_MAX_LENGTH
    ? INVALID_NAME_MESSAGE
    : null;
}

export function validateEmail(value: string): string | null {
  return EMAIL_PATTERN.test(normalizeEmail(value)) ? null : INVALID_EMAIL_MESSAGE;
}

export function registerAccount(input: { name: string; email: string }): StoreResult {
  const name = normalizeName(input.name);
  const email = normalizeEmail(input.email);

  const nameError = validateName(name);
  if (nameError) {
    return { ok: false, field: 'name', message: nameError };
  }

  const emailError = validateEmail(email);
  if (emailError) {
    return { ok: false, field: 'email', message: emailError };
  }

  const existing = current().account;
  if (existing && existing.email === email) {
    return { ok: false, field: 'email', message: DUPLICATE_EMAIL_MESSAGE };
  }

  const account: Account = { name, email, createdAt: new Date().toISOString() };
  const written = write(ACCOUNT_KEY, { account, signedIn: true } satisfies PersistedAccount);
  invalidate();

  return written
    ? { ok: true }
    : { ok: false, field: 'form', message: STORAGE_UNAVAILABLE_MESSAGE };
}

export function loginAccount(input: { email: string }): StoreResult {
  const email = normalizeEmail(input.email);

  const emailError = validateEmail(email);
  if (emailError) {
    return { ok: false, field: 'email', message: emailError };
  }

  const existing = current().account;
  if (!existing || existing.email !== email) {
    return { ok: false, field: 'email', message: UNKNOWN_EMAIL_MESSAGE };
  }

  const written = write(ACCOUNT_KEY, {
    account: existing,
    signedIn: true,
  } satisfies PersistedAccount);
  invalidate();

  return written
    ? { ok: true }
    : { ok: false, field: 'form', message: STORAGE_UNAVAILABLE_MESSAGE };
}

export function logout(): void {
  write(ACCOUNT_KEY, { account: current().account, signedIn: false } satisfies PersistedAccount);
  invalidate();
}

export function isPhotoSaved(saved: Photo[], id: string): boolean {
  return saved.some((photo) => photo.id === id);
}

export function toggleSavedPhoto(photo: Photo): StoreResult {
  const { saved } = current();
  const next = isPhotoSaved(saved, photo.id)
    ? saved.filter((item) => item.id !== photo.id)
    : [photo, ...saved];

  const written = write(SAVED_KEY, next);
  invalidate();

  return written
    ? { ok: true }
    : { ok: false, field: 'form', message: STORAGE_UNAVAILABLE_MESSAGE };
}

export function removeSavedPhoto(id: string): StoreResult {
  const { saved } = current();
  if (!isPhotoSaved(saved, id)) return { ok: true };

  const written = write(
    SAVED_KEY,
    saved.filter((photo) => photo.id !== id),
  );
  invalidate();

  return written
    ? { ok: true }
    : { ok: false, field: 'form', message: STORAGE_UNAVAILABLE_MESSAGE };
}
