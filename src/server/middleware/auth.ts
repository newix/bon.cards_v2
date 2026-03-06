import { NextFunction, Request, Response } from 'express';

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session.userId) return res.status(401).json({ error: 'UNAUTHORIZED' });
  next();
};

export const optionalAuth = (req: Request, _res: Response, next: NextFunction) => {
  req.isAuthenticated = Boolean(req.session.userId);
  next();
};
