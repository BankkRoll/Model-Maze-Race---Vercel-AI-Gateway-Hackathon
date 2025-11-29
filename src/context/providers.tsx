"use client";

/**
 * Client-side providers wrapper
 * Wraps all client components that need to run in the browser
 * Prevents hydration mismatches by isolating client-side code
 *
 * @module Providers
 */

import { ThemeProvider } from "@/context/theme-provider";
import { ApiKeyProvider } from "@/context/api-key-context";
import type { ReactNode } from "react";

interface ProvidersProps {
  children: ReactNode;
}

/**
 * Providers component
 * Wraps the application with all client-side providers
 *
 * @param props - Component props
 * @param props.children - React children to wrap
 * @returns Providers wrapper component
 */
export function Providers({ children }: ProvidersProps) {
  return (
    <ApiKeyProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        {children}
      </ThemeProvider>
    </ApiKeyProvider>
  );
}
