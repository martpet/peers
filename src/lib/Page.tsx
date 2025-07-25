import { type ComponentChildren } from "npm:preact";

interface PageProps {
  children: ComponentChildren;
  head?: ComponentChildren;
}

export function Page({ head, children }: PageProps) {
  return (
    <html>
      <head>
        <meta name="source" content="https://github.com/martpet/peers" />
        <link rel="icon" href="/favicon.svg" />
        {head}
      </head>
      <body>{children}</body>
    </html>
  );
}
