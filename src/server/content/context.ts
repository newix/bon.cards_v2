import { DeckRepository } from '../repositories/deck-repository';
import { NewsRepository } from '../repositories/news-repository';
import { UserRepository } from '../repositories/user-repository';
import { GameEngine } from '../engine/game-engine';
import { MatchmakingService } from '../services/matchmaking-service';
import { LobbyService } from '../services/lobby-service';
import { ChatService } from '../services/chat-service';
import { PublicStatsService } from '../services/public-stats-service';
import { Match } from '../types/domain';

export const repositories = {
  users: new UserRepository(),
  decks: new DeckRepository(),
  news: new NewsRepository()
};

export const matchmaking = new MatchmakingService();
export const lobbyService = new LobbyService();
export const chatService = new ChatService();
export const gameEngine = new GameEngine(repositories.decks);
export const activeMatches = new Map<string, Match>();
export const statsService = new PublicStatsService(repositories.users, matchmaking, activeMatches);
