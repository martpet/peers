import { serveFile } from "@std/http";
import { basename, join } from "@std/path";
import { type Context } from "./serve.ts";

export function respondStatic(ctx: Context, meta: ImportMeta) {
  if (!meta.dirname) throw new Error("Missing dirname");
  const fileName = basename(ctx.url.pathname);
  const filePath = join(meta.dirname, "static", fileName);
  return serveFile(ctx.req, filePath);
}
