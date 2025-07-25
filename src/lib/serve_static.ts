import { serveFile } from "jsr:@std/http";
import { basename, join } from "jsr:@std/path";

export function serveStatic(
  req: Request,
  dirname: string,
): Promise<Response> {
  const url = new URL(req.url);
  const filename = basename(url.pathname);
  const filepath = join(dirname, "static", filename);
  return serveFile(req, filepath);
}
