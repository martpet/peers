import { serveFile } from "@std/http";
import { basename, join } from "@std/path";
import { Context } from "./types.ts";

export function serveStatic(ctx: Context, meta: ImportMeta): Promise<Response> {
  if (!meta.dirname) throw new Error("Missing dirname");
  const { req, url } = ctx;
  const fileName = basename(url.pathname);
  const filePath = join(meta.dirname, "static", fileName);
  return serveFile(req, filePath);
}
