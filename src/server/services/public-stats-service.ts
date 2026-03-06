import { MatchmakingService } from './matchmaking-service';
import { UserRepository } from '../repositories/user-repository';

export class PublicStatsService {
  constructor(private users: UserRepository, private mm: MatchmakingService, private activeMatches: Map<string, unknown>) {}
  async get() {
    const all = await this.users.all();
    return {
      registeredUsersCount: all.length,
      onlineUsersCount: all.filter((u) => u.isOnline).length,
      activeGamesCount: this.activeMatches.size
    };
  }
}
