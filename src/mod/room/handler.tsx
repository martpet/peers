import { Context, render, serveStatic } from "lib";
import { RoomPage } from "./Page.tsx";

export function handleRoom(ctx: Context) {
  const { url } = ctx;

  if (url.pathname.endsWith("/room")) {
    const roomId = url.searchParams.get("id");
    if (!roomId) return Response.redirect("/");
    return render(<RoomPage />);
  }

  if (url.pathname.includes("/static/")) {
    return serveStatic(ctx, import.meta);
  }

  return new Response("Room route not found", { status: 404 });
}
