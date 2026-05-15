import { defineConfig } from "drizzle-kit";

const dbPath = process.env.DATABASE_URL || "./data/local.db";

export default defineConfig({
  schema: "./drizzle/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: dbPath,
  },
});
