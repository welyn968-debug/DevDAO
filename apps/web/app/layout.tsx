import "./globals.css";
import React from "react";
import Providers from "./providers";
import AppShell from "../components/AppShell";

export const metadata = {
  title: "DevDAO",
  description: "Decentralized community growth & contribution approval"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
