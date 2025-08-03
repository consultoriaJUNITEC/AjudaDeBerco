import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Claims } from '@/types/backend/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const VOLUNTARIO_PASSWORD = process.env.VOLUNTARIO_PASSWORD || 'voluntario123';

export function generateToken(): string {
  const payload: Claims = {
    exp: Math.floor(Date.now() / 1000) + (8 * 60 * 60), // 8 hours
    iat: Math.floor(Date.now() / 1000),
  };

  return jwt.sign(payload, JWT_SECRET);
}

export function verifyToken(token: string): Claims | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as Claims;
    return decoded;
  } catch (error) {
    return null;
  }
}

export function verifyPasswordDirectly(password: string): boolean {
  // Compare directly with the passwords from environment variables
  return password === ADMIN_PASSWORD || password === VOLUNTARIO_PASSWORD;
}

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 12);
}
