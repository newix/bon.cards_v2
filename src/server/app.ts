import express from 'express';
import session from 'express-session';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import http from 'node:http';
import { Server } from 'socket.io';
import csurf from 'csurf';
import { apiRouter } from './routes/api';
import { pagesRouter } from './routes/pages';
import { errorHandler } from './middleware/error-handler';
import { wireSockets } from './sockets';

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.set('view engine', 'ejs');
app.set('views', 'src/views');
app.use('/public', express.static('src/public'));
app.use(helmet());
app.use(rateLimit({ windowMs: 60_000, limit: 120 }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax' }
}));
app.use('/api', csurf({ cookie: true }));
app.use('/api', apiRouter);
app.use('/', pagesRouter);
app.use(errorHandler);

wireSockets(io);

const port = Number(process.env.PORT || 3000);
server.listen(port, () => console.log(`SnarkCards on :${port}`));
