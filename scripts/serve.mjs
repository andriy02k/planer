import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";

const root = resolve("out");
const basePath = (process.env.NEXT_PUBLIC_BASE_PATH || "").replace(/\/$/, "");
const port = Number(process.env.PORT || 3000);
const types = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".json": "application/json", ".txt": "text/plain", ".svg": "image/svg+xml", ".png": "image/png", ".ico": "image/x-icon", ".woff2": "font/woff2" };

await stat(resolve(root, "index.html")).catch(() => { throw new Error("Спочатку виконай npm run build."); });

createServer(async (request, response) => {
  try {
    const url = new URL(request.url || "/", "http://localhost");
    const pathname = decodeURIComponent(url.pathname);
    if (basePath && pathname === basePath) {
      response.writeHead(308, { Location: `${basePath}/${url.search}` }); response.end(); return;
    }
    if (basePath && !pathname.startsWith(`${basePath}/`)) {
      response.writeHead(404); response.end("Not found"); return;
    }
    const relative = pathname.slice(basePath.length).replace(/^\/+/, "");
    let file = resolve(root, relative);
    if (file !== root && !file.startsWith(`${root}${sep}`)) { response.writeHead(403); response.end(); return; }
    if ((await stat(file)).isDirectory()) {
      if (!pathname.endsWith("/")) { response.writeHead(308, { Location: `${pathname}/${url.search}` }); response.end(); return; }
      file = resolve(file, "index.html");
    }
    const content = await readFile(file);
    response.writeHead(200, { "Content-Type": types[extname(file)] || "application/octet-stream" });
    response.end(request.method === "HEAD" ? undefined : content);
  } catch {
    response.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
    response.end(await readFile(resolve(root, "404.html")).catch(() => "Not found"));
  }
}).listen(port, () => console.log(`Мій день: http://localhost:${port}${basePath}/`));
