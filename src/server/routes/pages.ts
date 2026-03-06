import { Router } from 'express';
import { repositories, statsService } from '../content/context';
import { t } from '../i18n/translator';
import { optionalAuth } from '../middleware/auth';

export const pagesRouter = Router();

pagesRouter.use(optionalAuth);
pagesRouter.use(async (req, res, next) => {
  const user = req.session.userId ? await repositories.users.findById(req.session.userId) : undefined;
  const locale = ((req.query.lang as 'ru' | 'en') || user?.preferences.language || 'ru') as 'ru' | 'en';
  res.locals.locale = locale;
  res.locals.t = (key: string) => t(locale, key);
  res.locals.currentUser = user;
  res.locals.pageTitle = 'SnarkCards';
  next();
});

pagesRouter.get('/', async (_req, res) => {
  const news = await repositories.news.all(res.locals.locale);
  const stats = await statsService.get();
  res.render('pages/home', { news: news.slice(0, 3), stats, pageScript: 'chat.js', pageStyles: ['news.css'] });
});

pagesRouter.get('/about', (_req, res) => res.render('pages/static', { title: 'nav.about', content: 'SnarkCards is an original web party card game.', pageScript: null, pageStyles: [] }));
pagesRouter.get('/faq', (_req, res) => res.render('pages/static', { title: 'nav.faq', content: 'Match starts with at least 3 players.', pageScript: null, pageStyles: [] }));

pagesRouter.get('/login', (_req, res) => res.render('pages/login', { pageScript: 'auth.js', pageStyles: ['auth.css'] }));
pagesRouter.get('/register', (_req, res) => res.render('pages/register', { pageScript: 'auth.js', pageStyles: ['auth.css'] }));

pagesRouter.get('/profile', async (req, res) => {
  if (!req.session.userId) return res.redirect('/login');
  const user = await repositories.users.findById(req.session.userId);
  if (!user) return res.redirect('/login');
  res.render('pages/profile', { user, pageScript: null, pageStyles: [] });
});

pagesRouter.get('/queue', (_req, res) => res.render('pages/queue', { pageScript: 'queue.js', pageStyles: [] }));
pagesRouter.get('/lobby/:ownerId', (_req, res) => res.render('pages/lobby', { pageScript: null, pageStyles: [] }));
pagesRouter.get('/game/:matchId', (_req, res) => res.render('pages/game', { pageScript: 'game.js', pageStyles: ['game.css'] }));

pagesRouter.get('/news', async (_req, res) => res.render('pages/news-list', { news: await repositories.news.all(res.locals.locale), pageScript: null, pageStyles: ['news.css'] }));
pagesRouter.get('/news/:slug', async (req, res) => {
  const item = await repositories.news.bySlug(req.params.slug, res.locals.locale);
  if (!item) return res.status(404).render('pages/404', { pageScript: null, pageStyles: [] });
  const related = (await repositories.news.all(res.locals.locale)).filter((x) => x.slug !== item.slug).slice(0, 3);
  return res.render('pages/news-item', { item, related, pageScript: null, pageStyles: ['news.css'] });
});

pagesRouter.use((_req, res) => res.status(404).render('pages/404', { pageScript: null, pageStyles: [] }));
