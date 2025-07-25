import { serveStatic } from "@/lib/mod.ts";
import { handleSignalingWebSocket } from "./signaling.ts";

export function webrtcHandler(req: Request) {
  const url = new URL(req.url);

  if (url.pathname.endsWith("/signaling")) {
    return handleSignalingWebSocket(req);
  }

  return serveStatic(req, import.meta.dirname!);
}
