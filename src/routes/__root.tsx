import { HeadContent, Scripts, createRootRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import "../styles.css";
import { SiteShell } from "../components/site-shell";
import iconUrl from "../../img/icon.svg";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1, viewport-fit=cover",
      },
      { title: "バイトのホンネ" },
      { name: "theme-color", content: "#FF6A2B" },
    ],
    links: [
      { rel: "icon", href: iconUrl },
      { rel: "apple-touch-icon", href: iconUrl },
    ],
  }),
  component: SiteShell,
  shellComponent: RootDocument,
});

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="ja">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}
