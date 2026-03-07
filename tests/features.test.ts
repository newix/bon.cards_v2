import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { buildApp } from '../src/server/app';
import { ChatService } from '../src/server/services/chat-service';
import { execSync } from 'node:child_process';

describe('auth and page behavior', () => {
  const { app } = buildApp();

  it('registers and returns session user', async () => {
    const agent = request.agent(app);
    const reg = await agent.post('/api/auth/register').send({ username: `user_${Date.now()}`, password: 'secret12', language: 'ru' });
    expect(reg.status).toBe(201);
    const me = await agent.get('/api/auth/me');
    expect(me.body.user).toBeTruthy();
  });


  it('logs in existing user', async () => {
    const agent = request.agent(app);
    const username = `login_${Date.now()}`;
    await agent.post('/api/auth/register').send({ username, password: 'secret12', language: 'en' });
    await agent.post('/api/auth/logout');
    const login = await agent.post('/api/auth/login').send({ username, password: 'secret12' });
    expect(login.status).toBe(200);
  });

  it('guest cannot join matchmaking', async () => {
    const res = await request(app).post('/api/matchmaking/join');
    expect(res.status).toBe(401);
  });


  it('guest sees read-only chat controls on home', async () => {
    const res = await request(app).get('/');
    expect(res.text).toContain('id="chatInput"');
    expect(res.text).toContain('disabled');
  });

  it('authorized user sees active chat controls on home', async () => {
    const agent = request.agent(app);
    await agent.post('/api/auth/register').send({ username: `chat_${Date.now()}`, password: 'secret12', language: 'ru' });
    const home = await agent.get('/');
    expect(home.text).toContain('id="chatInput"');
    expect(home.text).not.toContain('Войдите или зарегистрируйтесь, чтобы писать в чат');
  });

  it('news page renders absolute asset links', async () => {
    const res = await request(app).get('/news/guest-judge-bot-update?lang=ru');
    expect(res.status).toBe(200);
    expect(res.text).toContain('/styles/main.css');
    expect(res.text).toContain('/scripts/app.js');
  });

  it('layout is present on login and home pages', async () => {
    const home = await request(app).get('/');
    const login = await request(app).get('/login');
    expect(home.text).toContain('site-header');
    expect(login.text).toContain('site-footer');
  });

  it('public stats endpoint works', async () => {
    const res = await request(app).get('/api/stats/public');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('registeredUsersCount');
  });
});

describe('chat service auth expectations', () => {
  it('sanitizes message payload', () => {
    const chat = new ChatService();
    const msg = chat.addGlobal('u', '<script>x</script>');
    expect(msg.text).toContain('&lt;script&gt;');
  });
});

describe('build command', () => {
  it('has valid build script', () => {
    const pkg = JSON.parse(execSync('cat package.json').toString());
    expect(pkg.scripts.build).toContain('tsc -p tsconfig.json');
  });
});
