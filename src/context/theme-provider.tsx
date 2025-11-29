"use client";
import {
  ThemeProvider as NextThemesProvider,
  type ThemeProviderProps,
} from "next-themes";

/**
 * Theme provider component
 * Wraps next-themes ThemeProvider for theme management
 *
 * @param props - Theme provider props from next-themes
 * @param props.children - React children to wrap
 * @returns Theme provider component
 */
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
