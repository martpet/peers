import { render, serveStatic } from "@lib";
import { RoomPage } from "./RoomPage.tsx";
import { randomRoomUrl } from "./utils.ts";

export function roomHandler(req: Request) {
  const url = new URL(req.url);

  if (url.pathname.endsWith("/room")) {
    const roomId = url.searchParams.get("id");
    if (!roomId) return Response.redirect(randomRoomUrl(req), 302);
    return render(<RoomPage />);
  }

  return serveStatic(req, import.meta.dirname!);
}
