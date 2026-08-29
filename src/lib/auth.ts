import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { pool, ensureTables } from "./db";

const JWT_SECRET = process.env.AUTH_SECRET;
if (!JWT_SECRET) throw new Error("AUTH_SECRET is required — no fallback.");

const COOKIE_NAME = "shelf_token";
const JWT_EXPIRES = "7d";

export type User = {
  id: string;
  username: string;
  passwordHash: string;
  createdAt: string;
};

export async function getUserByUsername(username: string): Promise<User | null> {
  await ensureTables();
  const { rows } = await pool.query("select id, username, password_hash as \"passwordHash\", created_at as \"createdAt\" from users where username = $1 limit 1", [username]);
  return rows[0] ?? null;
}

export async function getUserById(id: string): Promise<User | null> {
  await ensureTables();
  const { rows } = await pool.query("select id, username, password_hash as \"passwordHash\", created_at as \"createdAt\" from users where id = $1 limit 1", [id]);
  return rows[0] ?? null;
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createUser(username: string, password: string): Promise<User> {
  await ensureTables();
  if (!username || username.length < 3) throw new Error("Username too short");
  if (!password || password.length < 4) throw new Error("Password too short");
  const passwordHash = await hashPassword(password);
  try {
    const { rows } = await pool.query(
      "insert into users (username, password_hash) values ($1, $2) returning id, username, password_hash as \"passwordHash\", created_at as \"createdAt\"",
      [username.trim(), passwordHash]
    );
    return rows[0];
  } catch (e: any) {
    if (e.code === "23505") throw new Error("Username taken");
    throw e;
  }
}

export function signToken(user: User) {
  return jwt.sign({ sub: user.id, username: user.username }, JWT_SECRET!, { expiresIn: JWT_EXPIRES });
}

export function verifyToken(token: string): { sub: string; username: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET!) as any;
  } catch {
    return null;
  }
}

export async function setAuthCookie(token: string) {
  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearAuthCookie() {
  const jar = await cookies();
  jar.set(COOKIE_NAME, "", { httpOnly: true, path: "/", maxAge: 0 });
}

export async function getCurrentUser(): Promise<User | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload) return null;
  return getUserById(payload.sub);
}

export function getCookieName() {
  return COOKIE_NAME;
}
