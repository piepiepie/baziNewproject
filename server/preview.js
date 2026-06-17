const http = require("node:http");
const { readFile } = require("node:fs/promises");
const path = require("node:path");

const PORT = Number(process.env.PREVIEW_PORT || 3002);
const DIST = path.join(__dirname, "..", "dist");
const API_TARGET = `http://127.0.0.1:${process.env.API_PORT || 8788}`;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon"
};

http
  .createServer(async (req, res) => {
    // Proxy /api to backend
    if (req.url.startsWith("/api")) {
      try {
        const bodyChunks = [];
        for await (const chunk of req) bodyChunks.push(chunk);
        const body = Buffer.concat(bodyChunks);

        const proxyReq = http.request(
          `${API_TARGET}${req.url}`,
          { method: req.method, headers: { "content-type": req.headers["content-type"] || "application/json" } },
          (proxyRes) => {
            const chunks = [];
            proxyRes.on("data", (c) => chunks.push(c));
            proxyRes.on("end", () => {
              res.writeHead(proxyRes.statusCode, {
                "content-type": proxyRes.headers["content-type"] || "application/json",
                "access-control-allow-origin": "*"
              });
              res.end(Buffer.concat(chunks));
            });
          }
        );
        proxyReq.on("error", () => {
          res.writeHead(502);
          res.end("API unreachable");
        });
        if (body.length) proxyReq.write(body);
        proxyReq.end();
      } catch {
        res.writeHead(502);
        res.end();
      }
      return;
    }

    // Serve static files from dist/
    try {
      const filePath = req.url === "/" ? "/index.html" : req.url;
      const fullPath = path.join(DIST, filePath);
      if (!fullPath.startsWith(DIST)) { res.writeHead(403); res.end(); return; }
      const ext = path.extname(fullPath);
      const content = await readFile(fullPath);
      res.writeHead(200, { "content-type": MIME[ext] || "application/octet-stream" });
      res.end(content);
    } catch {
      // SPA fallback
      try {
        const content = await readFile(path.join(DIST, "index.html"));
        res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
        res.end(content);
      } catch {
        res.writeHead(404);
        res.end("Not found");
      }
    }
  })
  .listen(PORT, "127.0.0.1", () => {
    console.log(`Preview server on http://127.0.0.1:${PORT}`);
  });
