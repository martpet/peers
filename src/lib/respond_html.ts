import { type JSX } from "preact";
import { renderToString } from "preact-render-to-string";

export function respondHtml(el: JSX.Element) {
  const body = "<!DOCTYPE html>" + renderToString(el);
  const headers = { "content-type": "text/html; charset=utf-8" };
  return new Response(body, { headers });
}
