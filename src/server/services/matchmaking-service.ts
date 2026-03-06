import { QueueEntry } from '../types/domain';

export class MatchmakingService {
  queue: QueueEntry[] = [];
  inGame = new Set<string>();
  minPlayers = 3;
  maxPlayers = 6;

  join(entry: QueueEntry): void {
    if (this.inGame.has(entry.userId)) throw new Error('ALREADY_IN_GAME');
    if (this.queue.some((q) => q.userId === entry.userId)) return;
    this.queue.push(entry);
  }

  leave(userId: string): void { this.queue = this.queue.filter((q) => q.userId !== userId); }

  status(userId: string): { queued: boolean; position: number } {
    const pos = this.queue.findIndex((q) => q.userId === userId);
    return { queued: pos >= 0, position: pos + 1 };
  }

  tryPopMatch(): QueueEntry[] {
    if (this.queue.length < this.minPlayers) return [];
    const picked = this.queue.splice(0, Math.min(this.maxPlayers, this.queue.length));
    picked.forEach((p) => this.inGame.add(p.userId));
    return picked;
  }
}
