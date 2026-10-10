import { appendFileSync, mkdirSync, writeFileSync } from 'node:fs';
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
