import { randomUUID } from 'node:crypto';
import { JsonFileStore } from '../services/json-file-store';
import { User } from '../types/domain';

const makePlayerId = () => `P${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

export class UserRepository {
  private readonly store = new JsonFileStore<User[]>('data/users.json', []);

  async all(): Promise<User[]> { return this.store.read(); }

  async findByUsername(username: string): Promise<User | undefined> {
    return (await this.all()).find((u) => u.username.toLowerCase() === username.toLowerCase());
  }

  async findById(id: string): Promise<User | undefined> {
    return (await this.all()).find((u) => u.id === id);
  }

  async findByPlayerId(playerId: string): Promise<User | undefined> {
    return (await this.all()).find((u) => u.playerId === playerId);
  }

  async create(username: string, passwordHash: string, language: 'ru' | 'en'): Promise<User> {
    const users = await this.all();
    if (users.some((u) => u.username.toLowerCase() === username.toLowerCase())) {
      throw new Error('USERNAME_TAKEN');
    }
    let playerId = makePlayerId();
    while (users.some((u) => u.playerId === playerId)) playerId = makePlayerId();

    const now = new Date().toISOString();
    const user: User = {
      id: randomUUID(),
      playerId,
      username,
      passwordHash,
      createdAt: now,
      lastSeenAt: now,
      isOnline: false,
      stats: { gamesPlayed: 0, gamesWon: 0, roundsWon: 0 },
      preferences: { language, theme: 'dark', soundEnabled: true, profanityFilter: true }
    };

    users.push(user);
    await this.store.write(users);
    return user;
  }

  async save(user: User): Promise<void> {
    const users = await this.all();
    const idx = users.findIndex((u) => u.id === user.id);
    if (idx < 0) return;
    users[idx] = user;
    await this.store.write(users);
  }
}
