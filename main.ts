import { appHandler } from "@/handler.ts";

const isDev = Deno.env.get("ENV") === "dev";
const options = isDev
  ? {
    cert: await Deno.readTextFile("cert/cert.pem"),
    key: await Deno.readTextFile("cert/key.pem"),
    port: 443,
  }
  : {};

Deno.serve(options, appHandler);
