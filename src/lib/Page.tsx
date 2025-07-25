import { type ComponentChildren } from "preact";

interface PageProps {
  children: ComponentChildren;
  head?: ComponentChildren;
}

export function Page({ head, children }: PageProps) {
  return (
    <html>
      <head>
        <link rel="icon" href="/static/favicon.svg" />
        {head}
      </head>
      <body>{children}</body>
    </html>
  );
}
