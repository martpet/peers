import { type JSX } from "preact";
import { renderToString } from "preact-render-to-string";

export function render(el: JSX.Element): Response {
  const html = "<!DOCTYPE html>" + renderToString(el);
  const headers = new Headers({ "content-type": "text/html; charset=utf-8" });
  return new Response(html, { headers });
}
