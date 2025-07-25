import { type JSX } from "npm:preact";
import { renderToString } from "npm:preact-render-to-string";

export function render(el: JSX.Element): Response {
  const html = "<!DOCTYPE html>" + renderToString(el);
  const headers = new Headers({ "content-type": "text/html; charset=utf-8" });
  return new Response(html, { headers });
}
