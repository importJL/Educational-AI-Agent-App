import type { Express, Request, Response } from "express";
import { executeTaskStream } from "../agents";

export function registerAgentRoutes(app: Express) {
  app.post("/api/agents/execute-stream", async (req: Request, res: Response) => {
    // Expect JSON body similar to tasks.execute
    const { taskType, pageContent, pageContents, customInstructions } = req.body || {};

    // If the client sent an array of page contents, join them into a single string
    const assembledContent = Array.isArray(pageContents)
      ? pageContents.join("\n\n---\n\n")
      : pageContent || "";

    // Set SSE-like headers
    res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    const send = async (obj: { type: string; payload: any }) => {
      try {
        res.write(`data: ${JSON.stringify(obj)}\n\n`);
      } catch (e) {
        console.error("[AgentRoutes] Failed to write to stream:", e);
      }
    };

    try {
      await executeTaskStream(taskType, assembledContent, send, undefined, customInstructions);
    } catch (err) {
      await send({ type: "error", payload: { message: (err as Error).message || String(err) } });
    } finally {
      // close stream
      res.write(`data: ${JSON.stringify({ type: "done" })}\n\n`);
      res.end();
    }
  });
}
