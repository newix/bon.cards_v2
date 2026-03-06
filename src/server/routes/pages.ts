import { Router } from 'express';
import { repositories, statsService } from '../content/context';
import { t } from '../i18n/translator';

export const pagesRouter = Router();

pagesRouter.use(async (req, res, next) => {
  const user = req.session.userId ? await repositories.users.findById(req.session.userId) : undefined;
  const locale = (req.query.lang as 'ru' | 'en') || user?.preferences.language || 'ru';
  res.locals.locale = locale;
  res.locals.t = (key: string) => t(locale, key);
  res.locals.currentUser = user;
  next();
});

pagesRouter.get('/', async (_req, res) => {
  const news = await repositories.news.all(res.locals.locale);
  const stats = await statsService.get();
  res.render('pages/home', { news: news.slice(0, 3), stats });
});
pagesRouter.get('/about', (_req, res) => res.render('pages/static', { title: 'nav.about', content: 'Original project with JSON storage.' }));
pagesRouter.get('/how-to-play', (_req, res) => res.render('pages/static', { title: 'nav.how', content: 'Pick one white card each round.' }));
pagesRouter.get('/rules', (_req, res) => res.render('pages/static', { title: 'nav.rules', content: 'No black cards with pick>1 in MVP.' }));
pagesRouter.get('/faq', (_req, res) => res.render('pages/static', { title: 'nav.faq', content: 'FAQ placeholder.' }));
pagesRouter.get('/privacy', (_req, res) => res.render('pages/static', { title: 'Privacy', content: 'Privacy policy placeholder.' }));
pagesRouter.get('/terms', (_req, res) => res.render('pages/static', { title: 'Terms', content: 'Terms placeholder.' }));
pagesRouter.get('/contacts', (_req, res) => res.render('pages/static', { title: 'Contacts', content: 'contact@snarkcards.local' }));
pagesRouter.get('/news', async (_req, res) => res.render('pages/news-list', { news: await repositories.news.all(res.locals.locale) }));
pagesRouter.get('/news/:slug', async (req, res) => {
  const item = await repositories.news.bySlug(req.params.slug, res.locals.locale);
  if (!item) return res.status(404).render('pages/404');
  res.render('pages/news-item', { item });
});
pagesRouter.get('/auth', (_req, res) => res.render('pages/auth'));
pagesRouter.get('/profile', async (req, res) => {
  if (!req.session.userId) return res.redirect('/auth');
  const user = await repositories.users.findById(req.session.userId);
  res.render('pages/profile', { user });
});
pagesRouter.get('/queue', (_req, res) => res.render('pages/queue'));
pagesRouter.get('/lobby/:ownerId', (_req, res) => res.render('pages/lobby'));
pagesRouter.get('/game/:matchId', (_req, res) => res.render('pages/game'));
pagesRouter.use((_req, res) => res.status(404).render('pages/404'));
