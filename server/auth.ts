import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { storage } from "./storage";

const JWT_SECRET = process.env.SESSION_SECRET || "wandergo-secret-key";

export interface AuthUser {
  id: string;
  username: string;
  displayName?: string | null;
  avatarPreset?: number | null;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function generateToken(user: AuthUser): string {
  return jwt.sign(
    { id: user.id, username: user.username },
    JWT_SECRET,
    { expiresIn: "30d" }
  );
}

export function verifyToken(token: string): AuthUser | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthUser;
  } catch {
    return null;
  }
}

export async function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  
  const token = authHeader.substring(7);
  const user = verifyToken(token);
  
  if (!user) {
    return res.status(401).json({ error: "Invalid token" });
  }
  
  const dbUser = await storage.getUser(user.id);
  if (!dbUser) {
    return res.status(401).json({ error: "User not found" });
  }
  
  req.user = {
    id: dbUser.id,
    username: dbUser.username,
    displayName: dbUser.displayName,
    avatarPreset: dbUser.avatarPreset,
  };
  
  next();
}

export async function optionalAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    const user = verifyToken(token);
    
    if (user) {
      const dbUser = await storage.getUser(user.id);
      if (dbUser) {
        req.user = {
          id: dbUser.id,
          username: dbUser.username,
          displayName: dbUser.displayName,
          avatarPreset: dbUser.avatarPreset,
        };
      }
    }
  }
  
  next();
}

export async function login(username: string, password: string): Promise<{ user: AuthUser; token: string } | null> {
  const user = await storage.getUserByUsername(username);
  
  if (!user) {
    return null;
  }
  
  const isValid = await bcrypt.compare(password, user.password);
  
  if (!isValid) {
    return null;
  }
  
  const authUser: AuthUser = {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    avatarPreset: user.avatarPreset,
  };
  
  const token = generateToken(authUser);
  
  return { user: authUser, token };
}

export async function register(
  username: string,
  password: string,
  displayName?: string
): Promise<{ user: AuthUser; token: string } | null> {
  const existing = await storage.getUserByUsername(username);
  
  if (existing) {
    return null;
  }
  
  const user = await storage.createUser({
    username,
    password,
    displayName: displayName || username,
    avatarPreset: Math.floor(Math.random() * 6),
  });
  
  const authUser: AuthUser = {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    avatarPreset: user.avatarPreset,
  };
  
  const token = generateToken(authUser);
  
  return { user: authUser, token };
}
