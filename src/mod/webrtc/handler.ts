import { Context, serveStatic } from "lib";
import { handleSignaling } from "./signaling.ts";

export function handleWebrtc(ctx: Context) {
  const { url } = ctx;

  if (url.pathname.endsWith("/signaling")) {
    return handleSignaling(ctx);
  }

  if (url.pathname.includes("/static/")) {
    return serveStatic(ctx, import.meta);
  }

  return new Response("Webrtc route not found", { status: 404 });
}
