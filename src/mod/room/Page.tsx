import { Page } from "lib";

export function RoomPage() {
  return (
    <Page
      head={
        <>
          <script type="module" src="/room/static/room.js" />
          <link rel="stylesheet" href="/room/static/room.css" />
          <link rel="modulepreload" href="/webrtc/static/webrtc.js" />
        </>
      }
    >
      <noscript>JavaScript is required.</noscript>
    </Page>
  );
}
