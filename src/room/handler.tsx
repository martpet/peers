import { type Context, respondHtml, respondStatic } from "lib";
import { RoomPage } from "./Page.tsx";
import { handleWebRtc } from "./webrtc/handler.ts";

export function roomHandler(ctx: Context) {
  const { pathname } = ctx.url;

  if (pathname === "/") {
    const roomId = ctx.url.searchParams.get("room");
    return respondHtml(<RoomPage roomId={roomId} />);
  }

  if (pathname.startsWith("/webrtc")) {
    return handleWebRtc(ctx);
  }

  if (pathname.includes("/static/")) {
    return respondStatic(ctx, import.meta);
  }
}
