import { serveStatic } from "@/lib/mod.ts";
import { randomRoomUrl, roomHandler } from "@/room/mod.ts";
import { webrtcHandler } from "@/webrtc/mod.ts";

export function mainHandler(req: Request) {
  const url = new URL(req.url);

  if (url.pathname.startsWith("/webrtc/")) {
    return webrtcHandler(req);
  }

  if (url.pathname.startsWith("/room")) {
    return roomHandler(req);
  }

  if (url.pathname === "/") {
    return Response.redirect(randomRoomUrl(req), 302);
  }

  return serveStatic(req, import.meta.dirname!);
}
