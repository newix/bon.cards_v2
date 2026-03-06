# SnarkCards

SnarkCards — оригинальная браузерная party card game (Node.js + JSON storage only).

## Запуск
```bash
npm install
npm run dev
npm run build
npm start
```

## Стек
- Node.js + TypeScript
- Express + EJS
- Socket.IO
- express-session (cookie httpOnly)
- zod validation
- bcrypt password hashing
- JSON repositories (`data/users.json`, `data/decks/*.json`, `data/news/*/*.json`)

## Ключевые возможности
- Регистрация/логин/логаут/`/api/auth/me`.
- Гости читают общий чат, но не пишут.
- Гости не могут войти в матчмейкинг.
- Queue-first flow + friend-lobby owner flow.
- Единый layout для всех страниц и абсолютные ассеты (`/styles/*`, `/scripts/*`).
- RU/EN интерфейс.
- Новостные страницы SSR с корректными стилями на вложенных URL.

## Структура
```text
src/
  server/
    app.ts
    routes/
    sockets/
    services/
    repositories/
    middleware/
    i18n/
    validators/
  views/
    partials/
    pages/
public/
  styles/
  scripts/
  images/placeholders/
data/
  users.json
  decks/*.json
  news/{ru,en}/*.json
tests/
```

## Безопасность
- Helmet
- Global + auth rate limits
- Session cookies (`httpOnly`)
- Server-side validation (zod)
- HTML escaping in chat service

## Примечания
- В проекте не используется Docker, БД, Redis, ORM.
- Все игровые и пользовательские данные сохраняются в JSON.
