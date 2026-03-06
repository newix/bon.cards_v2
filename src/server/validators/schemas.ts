import { z } from 'zod';

export const registerSchema = z.object({
  username: z.string().trim().min(3).max(24).regex(/^[a-zA-Z0-9_]+$/),
  password: z.string().min(6).max(64),
  language: z.enum(['ru', 'en']).default('ru')
});

export const loginSchema = z.object({
  username: z.string().trim().min(3),
  password: z.string().min(6)
});

export const messageSchema = z.object({ text: z.string().trim().min(1).max(240) });

export const joinByPlayerIdSchema = z.object({ playerId: z.string().trim().min(2) });

export const lobbySettingsSchema = z.object({
  cardSelectSeconds: z.number().int().min(10).max(90).optional(),
  judgeSeconds: z.number().int().min(10).max(90).optional(),
  scoreLimit: z.number().int().min(3).max(20).optional(),
  handSize: z.number().int().min(5).max(10).optional(),
  language: z.enum(['ru', 'en']).optional(),
  deckIds: z.array(z.string()).optional(),
  private: z.boolean().optional(),
  allowJoinByPlayerId: z.boolean().optional(),
  dedupeByText: z.boolean().optional(),
  enableGuestJudgeBot: z.boolean().optional()
});
