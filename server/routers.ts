import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { storagePut } from "./storage";
import {
  createDocument,
  getDocumentsByUserId,
  getDocumentById,
  deleteDocument,
  createSave,
  getSavesByUserId,
  getSaveById,
  deleteSave,
  getUserPreferences,
  createOrUpdateUserPreferences,
} from "./db";
import { executeTask } from "./agents";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  documents: router({
    upload: protectedProcedure
      .input(z.object({
        fileName: z.string(),
        fileData: z.string(),
        fileSize: z.number().optional(),
        pageCount: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        try {
          const buffer = Buffer.from(input.fileData, "base64");
          const fileKey = `documents/${ctx.user.id}/${Date.now()}-${input.fileName}`;
          const { url } = await storagePut(fileKey, buffer, "application/pdf");
          const document = await createDocument(ctx.user.id, {
            fileName: input.fileName,
            fileKey,
            fileUrl: url,
            fileSize: input.fileSize,
            pageCount: input.pageCount,
          });
          return { success: true, document };
        } catch (error) {
          console.error("[Document Upload] Error:", error);
          throw new Error("Failed to upload document");
        }
      }),

    list: protectedProcedure.query(async ({ ctx }) => {
      return await getDocumentsByUserId(ctx.user.id);
    }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        const document = await getDocumentById(input.id, ctx.user.id);
        if (!document) throw new Error("Document not found");
        return document;
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const success = await deleteDocument(input.id, ctx.user.id);
        return { success };
      }),
  }),

  tasks: router({
    execute: protectedProcedure
      .input(z.object({
        documentId: z.number(),
        pageContent: z.string(),
        taskType: z.enum(["Summarize", "Extract Key Points", "Generate Diagram/Infographic description", "Custom Instructions"]),
        customInstructions: z.string().optional(),
        pageStart: z.number().optional(),
        pageEnd: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        try {
          const document = await getDocumentById(input.documentId, ctx.user.id);
          if (!document) throw new Error("Document not found");
          
          const taskResult = await executeTask(
            input.taskType,
            input.pageContent,
            undefined,
            input.customInstructions
          );
          
          const save = await createSave(ctx.user.id, {
            documentId: input.documentId,
            documentName: document.fileName,
            pageStart: input.pageStart,
            pageEnd: input.pageEnd,
            taskType: input.taskType,
            customInstructions: input.customInstructions,
            response: taskResult.result,
            responseFormat: "markdown",
            model: taskResult.model,
            metadata: {
              pageCount: input.pageEnd ? (input.pageEnd - (input.pageStart || 1) + 1) : 1,
            },
          });
          
          return { success: true, result: taskResult.result, saveId: save?.id };
        } catch (error) {
          console.error("[Task Execution] Error:", error);
          throw new Error("Failed to execute task");
        }
      }),
  }),

  saves: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await getSavesByUserId(ctx.user.id);
    }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        const save = await getSaveById(input.id, ctx.user.id);
        if (!save) throw new Error("Save not found");
        return save;
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const success = await deleteSave(input.id, ctx.user.id);
        return { success };
      }),

    export: protectedProcedure
      .input(z.object({ id: z.number(), format: z.enum(["json", "text"]) }))
      .query(async ({ input, ctx }) => {
        const save = await getSaveById(input.id, ctx.user.id);
        if (!save) throw new Error("Save not found");
        
        if (input.format === "json") {
          return {
            format: "json",
            data: JSON.stringify({
              documentName: save.documentName,
              taskType: save.taskType,
              pageStart: save.pageStart,
              pageEnd: save.pageEnd,
              response: save.response,
              createdAt: save.createdAt,
              model: save.model,
            }, null, 2),
          };
        } else {
          return {
            format: "text",
            data: `Document: ${save.documentName}\nTask: ${save.taskType}\nPages: ${save.pageStart || "N/A"}-${save.pageEnd || "N/A"}\nDate: ${save.createdAt}\n\n${save.response}`,
          };
        }
      }),
  }),

  preferences: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      const prefs = await getUserPreferences(ctx.user.id);
      return prefs || {
        defaultModel: "google/gemma-4-31b-it:free",
        theme: "light",
        fontSize: "medium",
        pdfZoomLevel: 100,
        autoSaveResponses: 1,
      };
    }),

    update: protectedProcedure
      .input(z.object({
        defaultModel: z.string().optional(),
        theme: z.enum(["light", "dark"]).optional(),
        fontSize: z.enum(["small", "medium", "large"]).optional(),
        pdfZoomLevel: z.number().optional(),
        autoSaveResponses: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        return await createOrUpdateUserPreferences(ctx.user.id, input);
      }),
  }),
});

export type AppRouter = typeof appRouter;
