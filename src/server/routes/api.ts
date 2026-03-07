import { Router } from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { repositories, matchmaking, lobbyService, gameEngine, activeMatches, statsService } from '../content/context';
import { requireAuth } from '../middleware/auth';
import { joinByPlayerIdSchema, lobbySettingsSchema, loginSchema, registerSchema } from '../validators/schemas';

export const apiRouter = Router();
const authLimiter = rateLimit({ windowMs: 60_000, limit: 20, standardHeaders: true, legacyHeaders: false });

const okUser = (u: any) => ({ id: u.id, playerId: u.playerId, username: u.username, preferences: u.preferences, stats: u.stats });

apiRouter.get('/health', (_req, res) => res.json({ ok: true }));

apiRouter.post('/auth/register', authLimiter, async (req, res, next) => {
  try {
    const dto = registerSchema.parse(req.body);
    const hash = await bcrypt.hash(dto.password, 10);
    const user = await repositories.users.create(dto.username, hash, dto.language);
    user.isOnline = true;
    await repositories.users.save(user);
    req.session.userId = user.id;
    res.status(201).json({ user: okUser(user) });
  } catch (error) { next(error); }
});

apiRouter.post('/auth/login', authLimiter, async (req, res, next) => {
  try {
    const dto = loginSchema.parse(req.body);
    const user = await repositories.users.findByUsername(dto.username);
    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      return res.status(401).json({ error: 'INVALID_CREDENTIALS' });
    }
    user.isOnline = true;
    user.lastSeenAt = new Date().toISOString();
    await repositories.users.save(user);
    req.session.userId = user.id;
    res.json({ user: okUser(user) });
  } catch (error) { next(error); }
});

apiRouter.post('/auth/logout', requireAuth, async (req, res) => {
  const user = await repositories.users.findById(req.session.userId!);
  if (user) {
    user.isOnline = false;
    user.lastSeenAt = new Date().toISOString();
    await repositories.users.save(user);
  }
  req.session.destroy(() => undefined);
  res.json({ ok: true });
});

apiRouter.get('/auth/me', async (req, res) => {
  if (!req.session.userId) return res.json({ user: null });
  const user = await repositories.users.findById(req.session.userId);
  return res.json({ user: user ? okUser(user) : null });
});

apiRouter.get('/stats/public', async (_req, res) => res.json(await statsService.get()));

apiRouter.get('/news', async (req, res) => {
  const lang = (req.query.lang as 'ru' | 'en') || 'ru';
  res.json(await repositories.news.all(lang));
});

apiRouter.get('/news/:slug', async (req, res) => {
  const lang = (req.query.lang as 'ru' | 'en') || 'ru';
  const item = await repositories.news.bySlug(req.params.slug, lang);
  if (!item) return res.status(404).json({ error: 'NEWS_NOT_FOUND' });
  res.json(item);
});

apiRouter.get('/decks', async (req, res) => {
  const lang = req.query.language as 'ru' | 'en' | undefined;
  const decks = await repositories.decks.loadAll();
  res.json(lang ? decks.filter((d) => d.language === lang) : decks);
});

apiRouter.get('/decks/:id', async (req, res) => {
  const deck = await repositories.decks.findById(req.params.id);
  if (!deck) return res.status(404).json({ error: 'DECK_NOT_FOUND' });
  res.json(deck);
});

apiRouter.post('/decks/import', requireAuth, async (req, res, next) => {
  try { res.status(201).json(await repositories.decks.importDeck(req.body)); }
  catch (error) { next(error); }
});

apiRouter.post('/matchmaking/join', requireAuth, async (req, res) => {
  const user = await repositories.users.findById(req.session.userId!);
  if (!user) return res.status(401).json({ error: 'UNAUTHORIZED' });

  matchmaking.join({ userId: user.id, playerId: user.playerId, joinedAt: Date.now() });
  const picked = matchmaking.tryPopMatch();
  if (picked.length >= 3) {
    const players = (await Promise.all(picked.map((p) => repositories.users.findById(p.userId))))
      .filter(Boolean)
      .map((u) => ({ userId: u!.id, playerId: u!.playerId, username: u!.username, score: 0, hand: [], ready: true, connected: true }));

    const match = await gameEngine.createMatch('QUEUE', players, {
      cardSelectSeconds: 30,
      judgeSeconds: 20,
      scoreLimit: 5,
      handSize: 7,
      language: 'ru',
      deckIds: ['base-ru', 'absurd-ru'],
      private: false,
      allowJoinByPlayerId: true,
      dedupeByText: false,
      enableGuestJudgeBot: true
    });
    activeMatches.set(match.id, match);
    return res.json({ status: 'MATCH_FOUND', matchId: match.id });
  }
  return res.json({ status: 'QUEUED' });
});

apiRouter.post('/matchmaking/leave', requireAuth, (req, res) => {
  matchmaking.leave(req.session.userId!);
  res.json({ ok: true });
});

apiRouter.get('/matchmaking/status', requireAuth, (req, res) => res.json(matchmaking.status(req.session.userId!)));

apiRouter.get('/lobby/me', requireAuth, async (req, res) => {
  const user = await repositories.users.findById(req.session.userId!);
  if (!user) return res.status(401).json({ error: 'UNAUTHORIZED' });
  return res.json(lobbyService.getOrCreate({ userId: user.id, playerId: user.playerId, username: user.username, score: 0, hand: [], ready: false, connected: true }));
});

apiRouter.get('/lobby/player/:playerId', async (req, res) => {
  const owner = await repositories.users.findByPlayerId(req.params.playerId);
  if (!owner) return res.status(404).json({ error: 'PLAYER_NOT_FOUND' });
  const lobby = lobbyService.lobbies.get(owner.id);
  if (!lobby) return res.status(404).json({ error: 'LOBBY_NOT_FOUND' });
  res.json(lobby);
});

apiRouter.post('/lobby/join-by-player-id', requireAuth, async (req, res) => {
  const dto = joinByPlayerIdSchema.parse(req.body);
  const owner = await repositories.users.findByPlayerId(dto.playerId);
  if (!owner) return res.status(404).json({ error: 'PLAYER_NOT_FOUND' });
  const user = await repositories.users.findById(req.session.userId!);
  const lobby = lobbyService.join(owner.id, { userId: user!.id, playerId: user!.playerId, username: user!.username, score: 0, hand: [], ready: false, connected: true });
  return res.json(lobby);
});

apiRouter.post('/lobby/:ownerId/join', requireAuth, async (req, res) => {
  const user = await repositories.users.findById(req.session.userId!);
  res.json(lobbyService.join(req.params.ownerId, { userId: user!.id, playerId: user!.playerId, username: user!.username, score: 0, hand: [], ready: false, connected: true }));
});

apiRouter.post('/lobby/:ownerId/leave', requireAuth, (req, res) => res.json({ lobby: lobbyService.leave(req.params.ownerId, req.session.userId!) ?? null }));

apiRouter.post('/lobby/:ownerId/settings', requireAuth, (req, res) => {
  const lobby = lobbyService.lobbies.get(req.params.ownerId);
  if (!lobby) return res.status(404).json({ error: 'LOBBY_NOT_FOUND' });
  if (lobby.ownerId !== req.session.userId) return res.status(403).json({ error: 'ONLY_OWNER' });
  Object.assign(lobby.settings, lobbySettingsSchema.parse(req.body));
  res.json(lobby);
});

apiRouter.post('/lobby/:ownerId/start', requireAuth, async (req, res) => {
  const lobby = lobbyService.lobbies.get(req.params.ownerId);
  if (!lobby) return res.status(404).json({ error: 'LOBBY_NOT_FOUND' });
  if (lobby.ownerId !== req.session.userId) return res.status(403).json({ error: 'ONLY_OWNER' });
  if (lobby.players.length < 3) return res.status(400).json({ error: 'NEED_3_PLAYERS' });
  const match = await gameEngine.createMatch('FRIEND_LOBBY', lobby.players, lobby.settings);
  activeMatches.set(match.id, match);
  lobby.state = 'IN_GAME';
  return res.json({ matchId: match.id });
});
