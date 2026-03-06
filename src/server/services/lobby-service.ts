import { Lobby, LobbySettings, PlayerSeat } from '../types/domain';

const defaultSettings: LobbySettings = {
  cardSelectSeconds: 30,
  judgeSeconds: 20,
  scoreLimit: 5,
  handSize: 7,
  language: 'ru',
  deckIds: ['base-ru'],
  private: false,
  allowJoinByPlayerId: true,
  dedupeByText: false,
  enableGuestJudgeBot: true
};

export class LobbyService {
  lobbies = new Map<string, Lobby>();

  getOrCreate(owner: PlayerSeat): Lobby {
    let lobby = this.lobbies.get(owner.userId);
    if (!lobby) {
      lobby = { ownerId: owner.userId, ownerPlayerId: owner.playerId, players: [owner], chat: [], settings: { ...defaultSettings }, state: 'FRIEND_LOBBY' };
      this.lobbies.set(owner.userId, lobby);
    }
    return lobby;
  }

  join(ownerId: string, player: PlayerSeat): Lobby {
    const lobby = this.lobbies.get(ownerId);
    if (!lobby) throw new Error('LOBBY_NOT_FOUND');
    if (!lobby.players.some((p) => p.userId === player.userId)) lobby.players.push(player);
    return lobby;
  }

  leave(ownerId: string, userId: string): Lobby | undefined {
    const lobby = this.lobbies.get(ownerId);
    if (!lobby) return;
    lobby.players = lobby.players.filter((p) => p.userId !== userId);
    if (lobby.ownerId === userId || lobby.players.length === 0) {
      this.lobbies.delete(ownerId);
      return;
    }
    return lobby;
  }
}
