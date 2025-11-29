/**
 * Root layout component for the application
 * Provides global providers and metadata
 *
 * @module RootLayout
 */

import type React from "react";

import { Providers } from "@/context/providers";
import { Analytics } from "@vercel/analytics/next";
import type { Metadata } from "next";
import "./globals.css";

/**
 * Application metadata for SEO and browser display
 */
export const metadata: Metadata = {
  title: "Model Maze Race - AI Navigation Battle",
  description:
    "Watch AI models compete to escape procedurally generated mazes using Vercel AI SDK",
};

/**
 * Root layout component
 * Wraps the entire application with providers and global styles
 *
 * @param props - Layout props
 * @param props.children - React children to render
 * @returns Root layout JSX element
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`font-sans antialiased`}>
        <Providers>{children}</Providers>
        <Analytics />
      </body>
    </html>
  );
}
