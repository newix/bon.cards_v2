import express from 'express';
import session from 'express-session';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import http from 'node:http';
import path from 'node:path';
import { Server } from 'socket.io';
import { apiRouter } from './routes/api';
import { pagesRouter } from './routes/pages';
import { errorHandler } from './middleware/error-handler';
import { wireSockets } from './sockets';

export const buildApp = () => {
  const app = express();
  const server = http.createServer(app);
  const io = new Server(server);

  const sessionMiddleware = session({
    secret: process.env.SESSION_SECRET || 'dev-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, sameSite: 'lax', secure: false }
  });

  app.set('view engine', 'ejs');
  app.set('views', path.join(process.cwd(), 'src/views'));

  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(rateLimit({ windowMs: 60_000, limit: 180 }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(sessionMiddleware);
  app.use(express.static(path.join(process.cwd(), 'public')));

  app.use('/api', apiRouter);
  app.use('/', pagesRouter);
  app.use(errorHandler);

  io.engine.use((req: any, _res: any, next: any) => sessionMiddleware(req, {} as any, next));
  wireSockets(io);

  return { app, server };
};

if (process.env.NODE_ENV !== 'test') {
  const { server } = buildApp();
  const port = Number(process.env.PORT || 3000);
  server.listen(port, () => console.log(`SnarkCards on :${port}`));
}
