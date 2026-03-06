export type Locale = 'ru' | 'en';

export interface User {
  id: string;
  playerId: string;
  username: string;
  passwordHash: string;
  createdAt: string;
  lastSeenAt: string;
  isOnline: boolean;
  stats: {
    gamesPlayed: number;
    gamesWon: number;
    roundsWon: number;
  };
  preferences: {
    language: Locale;
    theme: 'light' | 'dark';
    soundEnabled: boolean;
    profanityFilter: boolean;
  };
}

export interface WhiteCard { id: string; text: string; }
export interface BlackCard { id: string; text: string; pick: 1; draw: number; }

export interface Deck {
  id: string;
  title: Record<Locale, string>;
  language: Locale;
  description: Record<Locale, string>;
  blackCards: BlackCard[];
  whiteCards: WhiteCard[];
}

export type GameState =
  | 'IDLE'
  | 'QUEUEING'
  | 'FRIEND_LOBBY'
  | 'MATCH_LOBBY'
  | 'DEALING'
  | 'SELECTING'
  | 'JUDGING'
  | 'ROUND_RESULT'
  | 'GAME_OVER';

export interface PlayerSeat {
  userId: string;
  playerId: string;
  username: string;
  score: number;
  hand: WhiteCard[];
  ready: boolean;
  connected: boolean;
}

export interface LobbySettings {
  cardSelectSeconds: number;
  judgeSeconds: number;
  scoreLimit: number;
  handSize: number;
  language: Locale;
  deckIds: string[];
  private: boolean;
  allowJoinByPlayerId: boolean;
  dedupeByText: boolean;
  enableGuestJudgeBot: boolean;
}

export interface Lobby {
  ownerId: string;
  ownerPlayerId: string;
  players: PlayerSeat[];
  chat: ChatMessage[];
  settings: LobbySettings;
  state: 'FRIEND_LOBBY' | 'MATCH_LOBBY' | 'IN_GAME';
}

export interface RoundSubmission {
  userId: string;
  card: WhiteCard;
}

export interface Match {
  id: string;
  source: 'QUEUE' | 'FRIEND_LOBBY';
  state: GameState;
  language: Locale;
  players: PlayerSeat[];
  czarIndex: number;
  currentBlackCard?: BlackCard;
  blackDeck: BlackCard[];
  whiteDeck: WhiteCard[];
  usedBlackIds: Set<string>;
  usedWhiteIds: Set<string>;
  submissions: RoundSubmission[];
  winnerUserId?: string;
  chat: ChatMessage[];
  timers: {
    selectUntil?: number;
    judgeUntil?: number;
  };
  settings: LobbySettings;
}

export interface ChatMessage {
  id: string;
  channel: 'global' | 'friend-lobby' | 'match';
  sender: string;
  text: string;
  createdAt: string;
  system?: boolean;
}

export interface QueueEntry {
  userId: string;
  playerId: string;
  joinedAt: number;
}
