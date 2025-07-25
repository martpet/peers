import { type Context, respondStatic } from "lib";
import { handleSignaling } from "./signaling.ts";

export function handleWebRtc(ctx: Context) {
  const { pathname } = ctx.url;

  if (pathname.endsWith("/signaling")) {
    return handleSignaling(ctx);
  }

  if (pathname.includes("/static/")) {
    return respondStatic(ctx, import.meta);
  }
}
