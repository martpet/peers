export function randomRoomUrl(req: Request): URL {
  const roomId = crypto.randomUUID().slice(0, 8);
  return new URL(`/room?id=${roomId}`, req.url);
}
