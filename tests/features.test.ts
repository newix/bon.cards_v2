import { describe, it, expect } from 'vitest';
import { ChatService } from '../src/server/services/chat-service';
import { NewsRepository } from '../src/server/repositories/news-repository';
import { PublicStatsService } from '../src/server/services/public-stats-service';
import { MatchmakingService } from '../src/server/services/matchmaking-service';
import { UserRepository } from '../src/server/repositories/user-repository';

describe('global chat guest read-only behavior model', () => {
  it('stores and sanitizes messages', () => {
    const c = new ChatService();
    const m = c.addGlobal('u', '<b>hello</b>');
    expect(m.text).toBe('bhello/b');
  });
});

describe('news localization', () => {
  it('returns per language and missing slug undefined', async () => {
    const n = new NewsRepository();
    expect((await n.all('ru')).length).toBeGreaterThan(0);
    expect(await n.bySlug('missing', 'en')).toBeUndefined();
  });
});

describe('public stats counters', () => {
  it('returns counters object', async () => {
    const svc = new PublicStatsService(new UserRepository(), new MatchmakingService(), new Map());
    const x = await svc.get();
    expect(x).toHaveProperty('registeredUsersCount');
    expect(x).toHaveProperty('onlineUsersCount');
    expect(x).toHaveProperty('activeGamesCount');
  });
});
