# SnarkCards

SnarkCards — оригинальная браузерная party card game (MVP) на Node.js без БД и Docker.

## Стек
- Backend: Node.js, Express, Socket.IO, TypeScript
- Frontend: EJS + vanilla JS
- Auth: express-session + bcrypt
- Validation: zod
- Storage: JSON (`data/users.json`, `data/decks/*.json`, `data/news/*/*.json`)
- Security: helmet, rate-limit, csurf, sanitization
- Tests: vitest

## Архитектура
- `src/server/repositories` — JSON-репозитории пользователей, колод, новостей
- `src/server/services` — matchmaking, lobby, chat, public stats, atomic JSON store
- `src/server/engine/game-engine.ts` — state-driven игровой движок (pick=1 only)
- `src/server/routes` — REST API + SSR страницы
- `src/server/sockets` — realtime чат и события матча
- `src/server/i18n` — словари RU/EN

## Запуск
```bash
npm install
npm run dev
# production
npm run build
npm start
```

## Форматы данных
### Пользователи (`data/users.json`)
- `id`, `playerId`, `username`, `passwordHash`, timestamps, `isOnline`, `stats`, `preferences`

### Колоды (`data/decks/*.json`)
- `id`, `title`, `language`, `description`, `blackCards` (`pick` строго `1`), `whiteCards`
- поддержан импорт: `POST /api/decks/import`

### Новости (`data/news/{ru,en}/*.json`)
- `id`, `slug`, `title`, `excerpt`, `content`, `language`, `publishedAt`, `isPublished`, `tags`, `coverImage`

## i18n
- RU/EN словари: `src/server/i18n/locales`
- язык берётся из `?lang=`, затем из профиля

## Matchmaking и friend-lobby
- Queue-first UX: `POST /api/matchmaking/join|leave`, `GET /status`
- Friend-lobby владельца: join по ownerId/playerId, owner-only settings/start
- Старт игры только при 3+ игроках.

## Чаты
- Global chat: чтение всем, запись только авторизованным (через socket payload)
- Match chat: изолирован per match room
- Friend-lobby chat: предусмотрен архитектурой как отдельный канал

## Публичная статистика
`GET /api/stats/public`:
- `registeredUsersCount`
- `onlineUsersCount`
- `activeGamesCount`

## Ограничения JSON storage
- Нет внешней БД/Redis
- Очередь и активные матчи в памяти процесса
- Atomic write: temp-file + rename

## Roadmap
1. Полноценный UI для friend-lobby и in-game действий.
2. Восстановление сессий/матчей после перезапуска через snapshots.
3. Улучшение guest judge heuristic.
4. Расширение i18n и контент-редактор новостей.
