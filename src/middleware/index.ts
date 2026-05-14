import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { verifyAccessToken } from '../auth/tokens';
import { AppError, UnauthorizedError } from '../utils/errors';
import { logger, logError } from '../utils/logger';

export function requestId(req: Request, _res: Response, next: NextFunction): void {
  req.requestId = uuidv4();
  next();
}

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  res.on('finish', () => {
    logger.info('Request', {
      requestId: req.requestId,
      method: req.method,
      path: req.path,
      status: res.statusCode,
      ms: Date.now() - start,
      userId: req.userId,
    });
  });
  next();
}

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const headerToken = req.headers.authorization?.replace('Bearer ', '');
  const cookieToken = (req as Request & { cookies?: Record<string, string> }).cookies?.accessToken;
  const token = headerToken ?? cookieToken;

  if (!token) throw new UnauthorizedError();

  const { sub } = verifyAccessToken(token);
  req.userId = sub;
  next();
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  try {
    authenticate(req, _res, next);
  } catch {
    next();
  }
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    logger.warn('Application error', {
      code: err.code,
      message: err.message,
      requestId: req.requestId,
      path: req.path,
    });

    res.status(err.statusCode).json({
      error: { code: err.code, message: err.message, details: err.details },
    });
    return;
  }

  logError('Unhandled error', err, {
    requestId: req.requestId,
    path: req.path,
    method: req.method,
  });

  res.status(500).json({
    error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
  });
}
