import { readFileSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import type { Express, Request, Response } from "express";
import { ENV } from "./env";

const LOCAL_STORAGE_DIR = path.resolve(
  import.meta.dirname,
  "..",
  "..",
  ".local-storage"
);

export function registerStorageProxy(app: Express) {
  app.get("/manus-storage/*", async (req: Request, res: Response) => {
    const key = (req.params as Record<string, string>)[0];
    if (!key) {
      res.status(400).send("Missing storage key");
      return;
    }

    if (ENV.forgeApiUrl && ENV.forgeApiKey) {
      try {
        const forgeUrl = new URL(
          "v1/storage/presign/get",
          ENV.forgeApiUrl.replace(/\/+$/, "") + "/"
        );
        forgeUrl.searchParams.set("path", key);

        const forgeResp = await fetch(forgeUrl, {
          headers: { Authorization: `Bearer ${ENV.forgeApiKey}` },
        });

        if (!forgeResp.ok) {
          const body = await forgeResp.text().catch(() => "");
          console.error(
            `[StorageProxy] forge error: ${forgeResp.status} ${body}`
          );
          res.status(502).send("Storage backend error");
          return;
        }

        const { url } = (await forgeResp.json()) as { url: string };
        if (!url) {
          res.status(502).send("Empty signed URL from backend");
          return;
        }

        res.set("Cache-Control", "no-store");
        res.redirect(307, url);
        return;
      } catch (err) {
        console.error("[StorageProxy] failed:", err);
        res.status(502).send("Storage proxy error");
        return;
      }
    }

    const filePath = path.join(LOCAL_STORAGE_DIR, key);
    if (!existsSync(LOCAL_STORAGE_DIR)) {
      mkdirSync(LOCAL_STORAGE_DIR, { recursive: true });
    }

    if (!existsSync(filePath)) {
      res.status(404).send("File not found");
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes: Record<string, string> = {
      ".pdf": "application/pdf",
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".gif": "image/gif",
      ".txt": "text/plain",
      ".json": "application/json",
    };

    const contentType = mimeTypes[ext] || "application/octet-stream";
    const fileData = readFileSync(filePath);

    res.set("Content-Type", contentType);
    res.set("Cache-Control", "no-store");
    res.send(fileData);
  });
}
