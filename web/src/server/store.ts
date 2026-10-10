import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { env } from './env';

export function appendJsonl(file: string, row: unknown): void {
  try {
    mkdirSync(env.dataDir, { recursive: true });
    appendFileSync(join(env.dataDir, file), JSON.stringify(row) + '\n');
  } catch (e) { console.error('[store] write failed', file, (e as Error).message); }
}
export function writeOutbox(name: string, content: string): void {
  try {
    const dir = join(env.dataDir, 'outbox');
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, name), content);
  } catch (e) { console.error('[store] outbox failed', (e as Error).message); }
}

export function readJson<T>(file: string, fallback: T): T {
  try { const p = join(env.dataDir, file); return existsSync(p) ? (JSON.parse(readFileSync(p, 'utf8')) as T) : fallback; } catch { return fallback; }
}
/** Last `limit` rows of a JSON-lines file. */
export function readJsonl<T>(file: string, limit = 5000): T[] {
  try {
    const p = join(env.dataDir, file);
    if (!existsSync(p)) return [];
    return readFileSync(p, 'utf8').split('\n').filter(Boolean).slice(-limit).map((l) => { try { return JSON.parse(l) as T; } catch { return null as unknown as T; } }).filter(Boolean);
  } catch { return []; }
}
