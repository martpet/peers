interface RoomPageProps {
  roomId: string | null;
}

export function RoomPage({ roomId }: RoomPageProps) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="static/favicon.svg" />
        <link rel="stylesheet" href="static/room.css" />
        <link rel="modulepreload" href="webrtc/static/webrtc.js" />
        <link rel="modulepreload" href="webrtc/static/signaling.js" />
        <script type="module" src="static/room.js" />
      </head>
      <body>{!roomId && <RoomForm />}</body>
    </html>
  );
}

function RoomForm() {
  return (
    <form>
      <input name="room" type="text" />
      <button>Go</button>
    </form>
  );
}
