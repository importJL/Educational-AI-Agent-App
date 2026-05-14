import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Documents table: stores uploaded PDF files with S3 storage references.
 */
export const documents = mysqlTable("documents", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileKey: varchar("fileKey", { length: 512 }).notNull(), // S3 storage key
  fileUrl: text("fileUrl").notNull(), // S3 presigned URL or reference
  fileSize: int("fileSize"), // File size in bytes
  pageCount: int("pageCount"), // Total number of pages in PDF
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Document = typeof documents.$inferSelect;
export type InsertDocument = typeof documents.$inferInsert;

/**
 * Saves table: stores LLM task responses with context and metadata.
 */
export const saves = mysqlTable("saves", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  documentId: int("documentId").notNull(),
  documentName: varchar("documentName", { length: 255 }).notNull(),
  pageStart: int("pageStart"), // Starting page number
  pageEnd: int("pageEnd"), // Ending page number
  taskType: mysqlEnum("taskType", ["Summarize", "Extract Key Points", "Generate Diagram/Infographic description", "Custom Instructions"]).notNull(),
  customInstructions: text("customInstructions"), // User's custom query if taskType is "Custom Instructions"
  response: text("response").notNull(), // LLM response (markdown or plain text)
  responseFormat: mysqlEnum("responseFormat", ["markdown", "text", "json"]).default("markdown").notNull(),
  model: varchar("model", { length: 128 }), // Which model was used (for reference)
  metadata: json("metadata"), // Additional metadata as JSON
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Save = typeof saves.$inferSelect;
export type InsertSave = typeof saves.$inferInsert;

/**
 * User preferences table: stores user settings and preferences.
 */
export const userPreferences = mysqlTable("userPreferences", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  defaultModel: varchar("defaultModel", { length: 128 }).default("google/gemma-4-31b-it:free").notNull(),
  theme: mysqlEnum("theme", ["light", "dark"]).default("light").notNull(),
  fontSize: mysqlEnum("fontSize", ["small", "medium", "large"]).default("medium").notNull(),
  pdfZoomLevel: int("pdfZoomLevel").default(100), // Default PDF zoom percentage
  autoSaveResponses: int("autoSaveResponses").default(1), // 1 = true, 0 = false
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserPreference = typeof userPreferences.$inferSelect;
export type InsertUserPreference = typeof userPreferences.$inferInsert;
