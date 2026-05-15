import { eq, and, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import {
  InsertUser,
  users,
  documents,
  saves,
  userPreferences,
  Document,
  Save,
  UserPreference,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      const sqlite = new Database(process.env.DATABASE_URL);
      sqlite.pragma("journal_mode = WAL");
      _db = drizzle(sqlite);
      createTables();
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

function createTables() {
  if (!_db) return;
  _db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      "openId" TEXT NOT NULL UNIQUE,
      name TEXT,
      email TEXT,
      loginMethod TEXT,
      role TEXT DEFAULT 'user' NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      lastSignedIn TEXT NOT NULL
    )
  `);
  _db.run(`
    CREATE TABLE IF NOT EXISTS documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      fileName TEXT NOT NULL,
      fileKey TEXT NOT NULL,
      fileUrl TEXT NOT NULL,
      fileSize INTEGER,
      pageCount INTEGER,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )
  `);
  _db.run(`
    CREATE TABLE IF NOT EXISTS saves (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      documentId INTEGER NOT NULL,
      documentName TEXT NOT NULL,
      pageStart INTEGER,
      pageEnd INTEGER,
      taskType TEXT NOT NULL,
      customInstructions TEXT,
      response TEXT NOT NULL,
      responseFormat TEXT DEFAULT 'markdown' NOT NULL,
      model TEXT,
      metadata TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )
  `);
  _db.run(`
    CREATE TABLE IF NOT EXISTS "userPreferences" (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL UNIQUE,
      theme TEXT DEFAULT 'light' NOT NULL,
      fontSize TEXT DEFAULT 'medium' NOT NULL,
      pdfZoomLevel INTEGER DEFAULT 100,
      autoSaveResponses INTEGER DEFAULT 1,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )
  `);
}

function now() {
  return new Date().toISOString();
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const existing = await getUserByOpenId(user.openId);
    if (existing) {
      const updateData: Record<string, unknown> = {};
      if (user.name !== undefined) updateData.name = user.name;
      if (user.email !== undefined) updateData.email = user.email;
      if (user.loginMethod !== undefined)
        updateData.loginMethod = user.loginMethod;
      if (user.role !== undefined) updateData.role = user.role;
      if (user.lastSignedIn !== undefined)
        updateData.lastSignedIn = user.lastSignedIn;
      updateData.updatedAt = now();
      db.update(users)
        .set(updateData)
        .where(eq(users.openId, user.openId))
        .run();
    } else {
      const role =
        user.role || (user.openId === ENV.ownerOpenId ? "admin" : "user");
      db.insert(users)
        .values({
          openId: user.openId,
          name: user.name ?? null,
          email: user.email ?? null,
          loginMethod: user.loginMethod ?? null,
          role,
          createdAt: now(),
          updatedAt: now(),
          lastSignedIn: user.lastSignedIn || now(),
        } as InsertUser)
        .run();
    }
  } catch (error) {
    console.warn(
      "[Database] Failed to upsert user: database unavailable",
      error
    );
  }
}

export async function getUserByOpenId(openId: string) {
  const db = getDb();
  if (!db) {
    return undefined;
  }

  const result = db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1)
    .all();
  return result.length > 0 ? result[0] : undefined;
}

export async function createDocument(
  userId: number,
  data: {
    fileName: string;
    fileKey: string;
    fileUrl: string;
    fileSize?: number | null;
    pageCount?: number | null;
  }
): Promise<Document | null> {
  const db = getDb();
  if (!db) return null;

  db.insert(documents)
    .values({
      userId,
      fileName: data.fileName,
      fileKey: data.fileKey,
      fileUrl: data.fileUrl,
      fileSize: data.fileSize ?? null,
      pageCount: data.pageCount ?? null,
      createdAt: now(),
      updatedAt: now(),
    })
    .run();

  const inserted = db
    .select()
    .from(documents)
    .where(eq(documents.userId, userId))
    .orderBy(desc(documents.createdAt))
    .limit(1)
    .all();
  if (!inserted.length) return null;
  return inserted[0];
}

export async function getDocumentsByUserId(
  userId: number
): Promise<Document[]> {
  const db = getDb();
  if (!db) return [];

  return db
    .select()
    .from(documents)
    .where(eq(documents.userId, userId))
    .orderBy(desc(documents.createdAt))
    .all();
}

export async function getDocumentById(
  id: number,
  userId: number
): Promise<Document | null> {
  const db = getDb();
  if (!db) return null;

  const result = db
    .select()
    .from(documents)
    .where(and(eq(documents.id, id), eq(documents.userId, userId)))
    .limit(1)
    .all();
  return result.length > 0 ? result[0] : null;
}

export async function deleteDocument(
  id: number,
  userId: number
): Promise<boolean> {
  const db = getDb();
  if (!db) return false;

  db.delete(documents)
    .where(and(eq(documents.id, id), eq(documents.userId, userId)))
    .run();
  return true;
}

export async function createSave(
  userId: number,
  data: {
    documentId: number;
    documentName: string;
    pageStart?: number | null;
    pageEnd?: number | null;
    taskType:
      | "Summarize"
      | "Extract Key Points"
      | "Generate Diagram/Infographic description"
      | "Custom Instructions";
    customInstructions?: string | null;
    response: string;
    responseFormat?: "markdown" | "text" | "json";
    model?: string | null;
    metadata?: Record<string, unknown> | null;
  }
): Promise<Save | null> {
  const db = getDb();
  if (!db) return null;

  db.insert(saves)
    .values({
      userId,
      documentId: data.documentId,
      documentName: data.documentName,
      pageStart: data.pageStart ?? null,
      pageEnd: data.pageEnd ?? null,
      taskType: data.taskType,
      customInstructions: data.customInstructions ?? null,
      response: data.response,
      responseFormat: data.responseFormat || "markdown",
      model: data.model ?? null,
      metadata: data.metadata ? JSON.stringify(data.metadata) : null,
      createdAt: now(),
      updatedAt: now(),
    })
    .run();

  const inserted = db
    .select()
    .from(saves)
    .where(eq(saves.userId, userId))
    .orderBy(desc(saves.createdAt))
    .limit(1)
    .all();
  if (!inserted.length) return null;
  return inserted[0];
}

export async function getSavesByUserId(userId: number): Promise<Save[]> {
  const db = getDb();
  if (!db) return [];

  return db
    .select()
    .from(saves)
    .where(eq(saves.userId, userId))
    .orderBy(desc(saves.createdAt))
    .all();
}

export async function getSaveById(
  id: number,
  userId: number
): Promise<Save | null> {
  const db = getDb();
  if (!db) return null;

  const result = db
    .select()
    .from(saves)
    .where(and(eq(saves.id, id), eq(saves.userId, userId)))
    .limit(1)
    .all();
  return result.length > 0 ? result[0] : null;
}

export async function deleteSave(id: number, userId: number): Promise<boolean> {
  const db = getDb();
  if (!db) return false;

  db.delete(saves)
    .where(and(eq(saves.id, id), eq(saves.userId, userId)))
    .run();
  return true;
}

export async function getUserPreferences(
  userId: number
): Promise<UserPreference | null> {
  const db = getDb();
  if (!db) return null;

  const result = db
    .select()
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId))
    .limit(1)
    .all();
  return result.length > 0 ? result[0] : null;
}

export async function createOrUpdateUserPreferences(
  userId: number,
  data: Partial<{
    theme: "light" | "dark";
    fontSize: "small" | "medium" | "large";
    pdfZoomLevel: number;
    autoSaveResponses: number;
  }>
): Promise<UserPreference | null> {
  const db = getDb();
  if (!db) return null;

  const existing = await getUserPreferences(userId);

  if (existing) {
    const updateData: Record<string, unknown> = { ...data, updatedAt: now() };
    db.update(userPreferences)
      .set(updateData)
      .where(eq(userPreferences.userId, userId))
      .run();
    return {
      ...existing,
      ...data,
      id: existing.id,
      userId: existing.userId,
      createdAt: existing.createdAt,
      updatedAt: now(),
    } as UserPreference;
  } else {
    db.insert(userPreferences)
      .values({
        userId,
        theme: data.theme || "light",
        fontSize: data.fontSize || "medium",
        pdfZoomLevel: data.pdfZoomLevel ?? 100,
        autoSaveResponses: data.autoSaveResponses ?? 1,
        createdAt: now(),
        updatedAt: now(),
      })
      .run();

    const inserted = db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId))
      .limit(1)
      .all();
    if (!inserted.length) return null;

    return {
      id: inserted[0].id,
      userId,
      theme: data.theme || "light",
      fontSize: data.fontSize || "medium",
      pdfZoomLevel: data.pdfZoomLevel ?? 100,
      autoSaveResponses: data.autoSaveResponses ?? 1,
      createdAt: inserted[0].createdAt,
      updatedAt: inserted[0].updatedAt,
    } as UserPreference;
  }
}
