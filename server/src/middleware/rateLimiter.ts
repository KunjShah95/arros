import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { Request } from 'express';

const getClientIp = (req: Request): string => {
  return req.ip || req.socket.remoteAddress || 'anonymous';
};

export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    return ipKeyGenerator(getClientIp(req));
  },
});

export const researchLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many research requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    return (req as any).userId || ipKeyGenerator(getClientIp(req));
  },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many authentication attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    return ipKeyGenerator(getClientIp(req));
  },
});
