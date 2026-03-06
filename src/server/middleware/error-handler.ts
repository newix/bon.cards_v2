import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

export const errorHandler = (err: Error, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof ZodError) {
    return res.status(400).json({ error: 'VALIDATION_ERROR', details: err.flatten() });
  }
  if (err.message === 'USERNAME_TAKEN') return res.status(409).json({ error: err.message });
  return res.status(400).json({ error: err.message || 'UNKNOWN_ERROR' });
};
