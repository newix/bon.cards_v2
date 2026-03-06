import { describe, it, expect, beforeEach } from 'vitest';
import { JsonFileStore } from '../src/server/services/json-file-store';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DeckRepository } from '../src/server/repositories/deck-repository';
import { MatchmakingService } from '../src/server/services/matchmaking-service';
import { LobbyService } from '../src/server/services/lobby-service';
import { GameEngine } from '../src/server/engine/game-engine';

let temp = '';
beforeEach(async () => { temp = await mkdtemp(join(tmpdir(), 'snark-')); });

describe('atomic JSON writes', () => {
  it('writes and reads file atomically', async () => {
    const store = new JsonFileStore(join(temp, 'x.json'), { ok: true });
    await store.write({ ok: false });
    expect(await store.read()).toEqual({ ok: false });
  });
});

describe('deck validation and dedupe', () => {
  it('dedupes by text', async () => {
    const repo = new DeckRepository();
    const merged = repo.mergeDecks([{id:'d1',title:{ru:'',en:''},language:'ru',description:{ru:'',en:''},blackCards:[{id:'b',text:'?',pick:1,draw:0}],whiteCards:[{id:'w1',text:'same'}]}, {id:'d2',title:{ru:'',en:''},language:'ru',description:{ru:'',en:''},blackCards:[{id:'b2',text:'??',pick:1,draw:0}],whiteCards:[{id:'w2',text:'same'}]}], true);
    expect(merged.white).toHaveLength(1);
  });
});

describe('matchmaking queue', () => {
  it('pops match when >=3', () => {
    const mm = new MatchmakingService();
    mm.join({ userId: '1', playerId: 'P1', joinedAt: 1 });
    mm.join({ userId: '2', playerId: 'P2', joinedAt: 2 });
    mm.join({ userId: '3', playerId: 'P3', joinedAt: 3 });
    expect(mm.tryPopMatch()).toHaveLength(3);
  });
});

describe('friend-lobby and game start', () => {
  it('requires 3 players to start in engine preconditions', async () => {
    const lobby = new LobbyService();
    const owner = { userId: 'u1', playerId: 'P1', username: 'a', score: 0, hand: [], ready: false, connected: true };
    lobby.getOrCreate(owner);
    const engine = new GameEngine(new DeckRepository());
    await expect(engine.createMatch('FRIEND_LOBBY', [owner, { ...owner, userId: 'u2', playerId: 'P2' }], {
      cardSelectSeconds: 10, judgeSeconds: 10, scoreLimit: 3, handSize: 7, language: 'ru', deckIds: ['base-ru'], private: false, allowJoinByPlayerId: true, dedupeByText: false, enableGuestJudgeBot: true
    })).rejects.toBeTruthy();
  });
});

