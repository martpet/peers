import { serveStatic } from "lib";
import { handleRoom } from "room";
import { handleWebrtc } from "webrtc";

export function rootHandler(req: Request) {
  const url = new URL(req.url);
  const ctx = { req, url };

  if (url.pathname.startsWith("/room")) {
    return handleRoom(ctx);
  }

  if (url.pathname.startsWith("/webrtc")) {
    return handleWebrtc(ctx);
  }

  if (url.pathname === "/") {
    const roomId = crypto.randomUUID().slice(0, 8);
    const roomUrl = new URL(`room?id=${roomId}`, url);
    return Response.redirect(roomUrl);
  }

  if (url.pathname.includes("/static/")) {
    return serveStatic(ctx, import.meta);
  }

  return new Response("Not found", { status: 404 });
}
