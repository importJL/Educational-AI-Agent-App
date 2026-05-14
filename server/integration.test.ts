import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

const createMockContext = (): TrpcContext => {
  return {
    user: {
      id: 1,
      openId: "test-user-integration",
      email: "test@example.com",
      name: "Test User",
      loginMethod: "test",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as TrpcContext["res"],
  };
};

describe("Integration Tests", () => {
  describe("Document Workflow", () => {
    it("should list documents", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);
      const docs = await caller.documents.list();
      expect(Array.isArray(docs)).toBe(true);
    });
  });

  describe("Preferences Workflow", () => {
    it("should get preferences with valid values", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);
      const prefs = await caller.preferences.get();
      expect(prefs).toBeDefined();
      expect(["light", "dark"]).toContain(prefs.theme);
      expect(["small", "medium", "large"]).toContain(prefs.fontSize);
      expect(prefs.defaultModel).toBeDefined();
    });

    it("should update preferences", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);
      
      const updated = await caller.preferences.update({
        theme: "light",
        fontSize: "medium",
        pdfZoomLevel: 100,
      });
      
      expect(updated).toBeDefined();
      expect(updated?.theme).toBe("light");
      expect(updated?.fontSize).toBe("medium");
    });
  });

  describe("Saves Workflow", () => {
    it("should list saves", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);
      const saves = await caller.saves.list();
      expect(Array.isArray(saves)).toBe(true);
    });
  });

  describe("Authentication", () => {
    it("should handle logout", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.auth.logout();
      expect(result.success).toBe(true);
    });

    it("should return current user", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);
      const user = await caller.auth.me();
      expect(user?.openId).toBe("test-user-integration");
      expect(user?.email).toBe("test@example.com");
    });
  });
});
