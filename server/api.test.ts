import { describe, it, expect, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock user context
const createMockContext = (): TrpcContext => {
  return {
    user: {
      id: 1,
      openId: "test-user",
      email: "test@example.com",
      name: "Test User",
      loginMethod: "test",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
};

describe("API Routers", () => {
  describe("auth", () => {
    it("should return current user with me query", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);
      const user = await caller.auth.me();
      expect(user).toEqual(ctx.user);
    });

    it("should logout successfully", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.auth.logout();
      expect(result.success).toBe(true);
    });
  });

  describe("documents", () => {
    it("should list documents for user", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);
      const documents = await caller.documents.list();
      expect(Array.isArray(documents)).toBe(true);
    });
  });

  describe("preferences", () => {
    it("should get user preferences with defaults", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);
      const prefs = await caller.preferences.get();
      expect(prefs.theme).toBeDefined();
      expect(prefs.fontSize).toBeDefined();
      expect(prefs.defaultModel).toBeDefined();
    });

    it("should update user preferences", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);
      const updated = await caller.preferences.update({
        theme: "dark",
        fontSize: "large",
      });
      expect(updated).toBeDefined();
    });
  });

  describe("saves", () => {
    it("should list saves for user", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);
      const saves = await caller.saves.list();
      expect(Array.isArray(saves)).toBe(true);
    });
  });
});
