import { randomUUID } from 'node:crypto';
import { DeckRepository } from '../repositories/deck-repository';
import { Match, PlayerSeat, RoundSubmission } from '../types/domain';

const shuffle = <T>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);

export class GameEngine {
  constructor(private readonly decksRepo: DeckRepository) {}

  async createMatch(source: 'QUEUE' | 'FRIEND_LOBBY', players: PlayerSeat[], settings: Match['settings']): Promise<Match> {
    const decks = (await this.decksRepo.loadAll()).filter((d) => settings.deckIds.includes(d.id) && d.language === settings.language);
    const merged = this.decksRepo.mergeDecks(decks, settings.dedupeByText);
    if (merged.black.length < 1 || merged.white.length < players.length * settings.handSize) throw new Error('INSUFFICIENT_CARDS');
    const match: Match = {
      id: randomUUID(), source, state: 'DEALING', language: settings.language,
      players: players.map((p) => ({ ...p, hand: [], score: 0 })), czarIndex: 0,
      currentBlackCard: undefined,
      blackDeck: shuffle(merged.black), whiteDeck: shuffle(merged.white),
      usedBlackIds: new Set(), usedWhiteIds: new Set(), submissions: [], chat: [], timers: {}, settings
    };
    this.dealHands(match);
    this.startRound(match);
    return match;
  }

  dealHands(match: Match): void {
    for (const p of match.players) {
      while (p.hand.length < match.settings.handSize && match.whiteDeck.length) {
        const c = match.whiteDeck.pop()!;
        if (!match.usedWhiteIds.has(c.id)) {
          p.hand.push(c); match.usedWhiteIds.add(c.id);
        }
      }
    }
  }

  startRound(match: Match): void {
    const b = match.blackDeck.pop();
    if (!b) { match.state = 'GAME_OVER'; return; }
    match.currentBlackCard = b;
    match.usedBlackIds.add(b.id);
    match.submissions = [];
    match.state = 'SELECTING';
    match.timers.selectUntil = Date.now() + match.settings.cardSelectSeconds * 1000;
  }

  submitCard(match: Match, userId: string, cardId: string): void {
    if (match.state !== 'SELECTING') throw new Error('NOT_SELECTING');
    if (match.players[match.czarIndex].userId === userId) throw new Error('CZAR_CANNOT_SUBMIT');
    if (match.submissions.some((s) => s.userId === userId)) throw new Error('ALREADY_SUBMITTED');
    const p = match.players.find((x) => x.userId === userId);
    if (!p) throw new Error('PLAYER_NOT_FOUND');
    const idx = p.hand.findIndex((c) => c.id === cardId);
    if (idx < 0) throw new Error('CARD_NOT_IN_HAND');
    const [card] = p.hand.splice(idx, 1);
    match.submissions.push({ userId, card });
    if (match.submissions.length >= match.players.length - 1) {
      match.state = 'JUDGING';
      match.timers.judgeUntil = Date.now() + match.settings.judgeSeconds * 1000;
    }
  }

  pickWinner(match: Match, winnerUserId?: string): string {
    if (match.state !== 'JUDGING') throw new Error('NOT_JUDGING');
    const candidate = winnerUserId ?? match.submissions[Math.floor(Math.random() * match.submissions.length)]?.userId;
    if (!candidate) throw new Error('NO_SUBMISSIONS');
    const winner = match.players.find((p) => p.userId === candidate);
    if (!winner) throw new Error('WINNER_NOT_FOUND');
    winner.score += 1;
    match.winnerUserId = winner.userId;
    match.state = 'ROUND_RESULT';
    this.dealHands(match);
    if (winner.score >= match.settings.scoreLimit) {
      match.state = 'GAME_OVER';
      return winner.userId;
    }
    match.czarIndex = (match.czarIndex + 1) % match.players.length;
    this.startRound(match);
    return winner.userId;
  }
}
