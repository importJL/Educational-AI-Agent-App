import { eq, and, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, documents, saves, userPreferences, Document, Save, UserPreference } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Document queries
export async function createDocument(userId: number, data: {
  fileName: string;
  fileKey: string;
  fileUrl: string;
  fileSize?: number | null;
  pageCount?: number | null;
}): Promise<Document | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db.insert(documents).values({
    userId,
    ...data,
  });

  const inserted = await db.select().from(documents).where(eq(documents.userId, userId)).orderBy(desc(documents.createdAt)).limit(1);
  if (!inserted.length) return null;

  return inserted[0];
}

export async function getDocumentsByUserId(userId: number): Promise<Document[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(documents).where(eq(documents.userId, userId)).orderBy(desc(documents.createdAt));
}

export async function getDocumentById(id: number, userId: number): Promise<Document | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(documents).where(
    and(eq(documents.id, id), eq(documents.userId, userId))
  ).limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function deleteDocument(id: number, userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  await db.delete(documents).where(
    and(eq(documents.id, id), eq(documents.userId, userId))
  );

  return true;
}

// Save queries
export async function createSave(userId: number, data: {
  documentId: number;
  documentName: string;
  pageStart?: number | null;
  pageEnd?: number | null;
  taskType: "Summarize" | "Extract Key Points" | "Generate Diagram/Infographic description" | "Custom Instructions";
  customInstructions?: string | null;
  response: string;
  responseFormat?: "markdown" | "text" | "json";
  model?: string | null;
  metadata?: Record<string, unknown> | null;
}): Promise<Save | null> {
  const db = await getDb();
  if (!db) return null;

  await db.insert(saves).values({
    userId,
    pageStart: data.pageStart ?? null,
    pageEnd: data.pageEnd ?? null,
    customInstructions: data.customInstructions ?? null,
    model: data.model ?? null,
    metadata: data.metadata ?? null,
    documentId: data.documentId,
    documentName: data.documentName,
    taskType: data.taskType,
    response: data.response,
    responseFormat: data.responseFormat || "markdown",
  });

  const inserted = await db.select().from(saves).where(eq(saves.userId, userId)).orderBy(desc(saves.createdAt)).limit(1);
  if (!inserted.length) return null;

  return inserted[0];
}

export async function getSavesByUserId(userId: number): Promise<Save[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(saves).where(eq(saves.userId, userId)).orderBy(desc(saves.createdAt));
}

export async function getSaveById(id: number, userId: number): Promise<Save | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(saves).where(
    and(eq(saves.id, id), eq(saves.userId, userId))
  ).limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function deleteSave(id: number, userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  await db.delete(saves).where(
    and(eq(saves.id, id), eq(saves.userId, userId))
  );

  return true;
}

// User preferences queries
export async function getUserPreferences(userId: number): Promise<UserPreference | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(userPreferences).where(eq(userPreferences.userId, userId)).limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function createOrUpdateUserPreferences(userId: number, data: Partial<{
  defaultModel: string;
  theme: "light" | "dark";
  fontSize: "small" | "medium" | "large";
  pdfZoomLevel: number;
  autoSaveResponses: number;
}>): Promise<UserPreference | null> {
  const db = await getDb();
  if (!db) return null;

  const existing = await getUserPreferences(userId);

  if (existing) {
    await db.update(userPreferences).set(data).where(eq(userPreferences.userId, userId));
    return { ...existing, ...data };
  } else {
    await db.insert(userPreferences).values({
      userId,
      ...data,
    });

    const inserted = await db.select().from(userPreferences).where(eq(userPreferences.userId, userId)).limit(1);
    if (!inserted.length) return null;

    return {
      id: inserted[0].id,
      userId,
      defaultModel: data.defaultModel || "google/gemma-4-31b-it:free",
      theme: data.theme || "light",
      fontSize: data.fontSize || "medium",
      pdfZoomLevel: data.pdfZoomLevel ?? 100,
      autoSaveResponses: data.autoSaveResponses ?? 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
}
