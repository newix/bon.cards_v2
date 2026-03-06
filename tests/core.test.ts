import { describe, it, expect, beforeEach } from 'vitest';
import { JsonFileStore } from '../src/server/services/json-file-store';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DeckRepository } from '../src/server/repositories/deck-repository';
import { MatchmakingService } from '../src/server/services/matchmaking-service';

let temp = '';
beforeEach(async () => { temp = await mkdtemp(join(tmpdir(), 'snark-')); });

describe('atomic JSON writes', () => {
  it('writes and reads file atomically', async () => {
    const store = new JsonFileStore(join(temp, 'x.json'), { ok: true });
    await store.write({ ok: false });
    expect(await store.read()).toEqual({ ok: false });
  });
});

describe('deck dedupe and pick=1 schema compatibility', () => {
  it('dedupes by text when enabled', () => {
    const repo = new DeckRepository();
    const merged = repo.mergeDecks([
      { id: 'd1', title: { ru: '', en: '' }, language: 'ru', description: { ru: '', en: '' }, blackCards: [{ id: 'b1', text: '?', pick: 1, draw: 0 }], whiteCards: [{ id: 'w1', text: 'same' }] },
      { id: 'd2', title: { ru: '', en: '' }, language: 'ru', description: { ru: '', en: '' }, blackCards: [{ id: 'b2', text: '??', pick: 1, draw: 0 }], whiteCards: [{ id: 'w2', text: 'same' }] }
    ], true);
    expect(merged.white).toHaveLength(1);
  });
});

describe('matchmaking', () => {
  it('pops match when queue >= 3', () => {
    const mm = new MatchmakingService();
    mm.join({ userId: '1', playerId: 'P1', joinedAt: 1 });
    mm.join({ userId: '2', playerId: 'P2', joinedAt: 1 });
    mm.join({ userId: '3', playerId: 'P3', joinedAt: 1 });
    expect(mm.tryPopMatch()).toHaveLength(3);
  });
});
