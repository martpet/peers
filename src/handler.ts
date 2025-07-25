import { serveStatic } from "@lib";
import { randomRoomUrl, roomHandler } from "@room";
import { webrtcHandler } from "@webrtc";

export function handler(req: Request) {
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
