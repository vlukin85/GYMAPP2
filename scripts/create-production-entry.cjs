const fs = require("node:fs");
const path = require("node:path");

const outputPath = path.join(__dirname, "..", "dist", "index.js");
const source = `"use strict";

const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");

const root = __dirname;
const port = Number.parseInt(process.env.PORT || "3000", 10);
const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

function safeFilePath(requestPath) {
  const decodedPath = decodeURIComponent(requestPath.split("?")[0]);
  const relativePath = decodedPath.replace(/^\\/+/, "");
  const candidate = path.resolve(root, relativePath || "index.html");
  return candidate.startsWith(root) ? candidate : null;
}

const server = http.createServer((request, response) => {
  let filePath;
  try {
    filePath = safeFilePath(request.url || "/");
  } catch {
    response.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Bad request");
    return;
  }

  if (filePath && fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    response.writeHead(200, {
      "Cache-Control": filePath.includes("/_expo/") ? "public, max-age=31536000, immutable" : "no-cache",
      "Content-Type": mimeTypes[path.extname(filePath)] || "application/octet-stream",
    });
    fs.createReadStream(filePath).pipe(response);
    return;
  }

  const indexPath = path.join(root, "index.html");
  response.writeHead(200, { "Cache-Control": "no-cache", "Content-Type": "text/html; charset=utf-8" });
  fs.createReadStream(indexPath).pipe(response);
});

server.listen(port, "0.0.0.0", () => {
  console.log("IronRise web preview listening on port " + port);
});
`;

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, source, "utf8");
console.log("Created production entrypoint: " + outputPath);
