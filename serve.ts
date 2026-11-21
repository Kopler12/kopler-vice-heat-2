// VICE HEAT — tiny static file server for local testing and screenshots.
//
// Serves the app/ directory on port 8080 with sensible content types.
// Zero dependencies; Node 22 only.

import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const serverDirectory = dirname(fileURLToPath(import.meta.url));
const appRootDirectory = join(serverDirectory, "app");
const listenPort = 8080;

const contentTypeByExtension: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
};

function resolveRequestPath(requestUrl: string): string {
  const url = new URL(requestUrl, "http://localhost");
  const decodedPath = decodeURIComponent(url.pathname);
  const relativePath = decodedPath === "/" ? "index.html" : decodedPath.replace(/^\/+/, "");
  // Normalise and refuse anything that escapes the app root.
  const absolutePath = normalize(join(appRootDirectory, relativePath));
  if (!absolutePath.startsWith(appRootDirectory)) {
    throw new Error("path escapes app root");
  }
  return absolutePath;
}

const server = createServer(async (request, response) => {
  try {
    const filePath = resolveRequestPath(request.url ?? "/");
    const fileBytes = await readFile(filePath);
    const contentType =
      contentTypeByExtension[extname(filePath).toLowerCase()] ??
      "application/octet-stream";
    response.writeHead(200, {
      "content-type": contentType,
      "cache-control": "no-store",
    });
    response.end(fileBytes);
  } catch {
    response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    response.end("not found");
  }
});

server.listen(listenPort, () => {
  console.log(`VICE HEAT dev server: http://localhost:${listenPort}/ (serving ${appRootDirectory})`);
});
