import { Page } from "@lib";

export function RoomPage() {
  return (
    <Page
      head={
        <>
          <link rel="stylesheet" href="/room/room.css" />
          <link rel="modulepreload" href="/webrtc/webrtc.js" />
          <script type="module" src="/room/room.js"></script>
        </>
      }
    >
      <noscript>
        JavaScript is required to establish a peer connection.
      </noscript>
    </Page>
  );
}
