export interface Context {
  req: Request;
  url: URL;
}

type Handler = (ctx: Context) => Response | Promise<Response> | void;

const isDev = Deno.env.get("ENV") === "dev";

let serveOpt = {};

if (isDev) {
  serveOpt = {
    key: await Deno.readTextFile("cert/key.pem"),
    cert: await Deno.readTextFile("cert/cert.pem"),
    port: 443,
  };
}

export function serve(handler: Handler) {
  Deno.serve(serveOpt, async (req) => {
    const url = new URL(req.url);
    const ctx = { req, url };
    const resp = await handler(ctx);
    return resp || new Response("Not found", { status: 404 });
  });
}
