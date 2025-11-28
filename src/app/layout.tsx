import type React from "react";

import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { ApiKeyProvider } from "@/context/api-key-context";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  title: "Model Maze Race - AI Navigation Battle",
  description:
    "Watch AI models compete to escape procedurally generated mazes using Vercel AI SDK",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        <ApiKeyProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            {children}
          </ThemeProvider>
        </ApiKeyProvider>
        <Analytics />
      </body>
    </html>
  );
}
