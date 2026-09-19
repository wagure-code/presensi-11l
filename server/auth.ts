import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';

export interface AuthPayload {
  id: string;
  username: string;
  role: 'guru' | 'siswa';
  className: string;
  name: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export const signToken = (payload: AuthPayload): string =>
  jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Tidak ada token, silakan login.' });
  }
  try {
    const token = header.slice(7);
    const payload = jwt.verify(token, JWT_SECRET) as AuthPayload;
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Token tidak valid atau sudah kedaluwarsa.' });
  }
};

export const requireGuru = (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'guru') {
    return res.status(403).json({ error: 'Hanya guru yang boleh melakukan aksi ini.' });
  }
  next();
};
