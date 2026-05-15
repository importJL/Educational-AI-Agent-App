import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  openId: text("openId").notNull().unique(),
  name: text("name"),
  email: text("email"),
  loginMethod: text("loginMethod"),
  role: text("role").default("user").notNull(),
  createdAt: text("createdAt")
    .notNull()
    .$default(() => new Date().toISOString()),
  updatedAt: text("updatedAt")
    .notNull()
    .$default(() => new Date().toISOString()),
  lastSignedIn: text("lastSignedIn")
    .notNull()
    .$default(() => new Date().toISOString()),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const documents = sqliteTable("documents", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").notNull(),
  fileName: text("fileName").notNull(),
  fileKey: text("fileKey").notNull(),
  fileUrl: text("fileUrl").notNull(),
  fileSize: integer("fileSize"),
  pageCount: integer("pageCount"),
  createdAt: text("createdAt")
    .notNull()
    .$default(() => new Date().toISOString()),
  updatedAt: text("updatedAt")
    .notNull()
    .$default(() => new Date().toISOString()),
});

export type Document = typeof documents.$inferSelect;
export type InsertDocument = typeof documents.$inferInsert;

export const saves = sqliteTable("saves", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").notNull(),
  documentId: integer("documentId").notNull(),
  documentName: text("documentName").notNull(),
  pageStart: integer("pageStart"),
  pageEnd: integer("pageEnd"),
  taskType: text("taskType").notNull(),
  customInstructions: text("customInstructions"),
  response: text("response").notNull(),
  responseFormat: text("responseFormat").default("markdown").notNull(),
  model: text("model"),
  metadata: text("metadata"),
  createdAt: text("createdAt")
    .notNull()
    .$default(() => new Date().toISOString()),
  updatedAt: text("updatedAt")
    .notNull()
    .$default(() => new Date().toISOString()),
});

export type Save = typeof saves.$inferSelect;
export type InsertSave = typeof saves.$inferInsert;

export const userPreferences = sqliteTable("userPreferences", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").notNull().unique(),
  theme: text("theme").default("light").notNull(),
  fontSize: text("fontSize").default("medium").notNull(),
  pdfZoomLevel: integer("pdfZoomLevel").default(100),
  autoSaveResponses: integer("autoSaveResponses").default(1),
  createdAt: text("createdAt")
    .notNull()
    .$default(() => new Date().toISOString()),
  updatedAt: text("updatedAt")
    .notNull()
    .$default(() => new Date().toISOString()),
});

export type UserPreference = typeof userPreferences.$inferSelect;
export type InsertUserPreference = typeof userPreferences.$inferInsert;
