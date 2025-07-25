import { mainHandler } from "./src/main_handler.ts";

const dev = Deno.env.get("ENV") === "dev";
const options = dev
  ? {
    cert: await Deno.readTextFile("cert/cert.pem"),
    key: await Deno.readTextFile("cert/key.pem"),
    port: 443,
  }
  : {};

Deno.serve(options, mainHandler);
