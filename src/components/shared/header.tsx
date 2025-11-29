"use client";

/**
 * Application header component with controls and navigation
 * Provides theme toggle, debug mode, API key management, and full maze toggle
 *
 * @module Header
 */

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Moon, Sun } from "lucide-react";

/**
 * Props for the Header component
 *
 * @interface HeaderProps
 */
interface HeaderProps {
  /** Current theme mode */
  theme: "light" | "dark";
  /** Whether debug mode is enabled */
  debugMode: boolean;
  /** Whether an API key is configured */
  hasApiKey: boolean;
  /** Callback when theme is toggled */
  onThemeToggle: () => void;
  /** Callback when debug mode is toggled */
  onDebugToggle: () => void;
  /** Callback when full maze toggle is changed */
  onFullMazeToggle?: (value: boolean) => void;
  /** Callback when API key button is clicked */
  onApiKeyClick: () => void;
}

/**
 * Header component for the application
 * Displays title, theme toggle, debug mode, and API key management
 *
 * @param props - Header component props
 * @returns Header JSX element
 *
 * @example
 * ```tsx
 * <Header
 *   theme="dark"
 *   debugMode={false}
 *   hasApiKey={true}
 *   onThemeToggle={() => setTheme("light")}
 *   onDebugToggle={() => setDebugMode(true)}
 *   onApiKeyClick={() => setShowModal(true)}
 * />
 * ```
 */
export function Header({
  theme,
  debugMode,
  hasApiKey,
  onThemeToggle,
  onDebugToggle,
  onFullMazeToggle,
  onApiKeyClick,
}: HeaderProps) {
  return (
    <header className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-50 bg-background/80">
      <div className="container mx-auto px-3 sm:px-4 py-2.5 sm:py-3 md:py-4">
        <div className="flex items-center justify-between gap-2 sm:gap-3 md:gap-4">
          <div className="flex-1 min-w-0 flex items-center gap-2 sm:gap-3">
            <h1 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-primary truncate">
              Model Maze Race
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground hidden sm:inline truncate">
              Vercel AI Gateway Hackathon
            </p>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 lg:gap-4 flex-shrink-0">
            <div className="flex items-center gap-1">
              <Switch
                checked={debugMode}
                onCheckedChange={onDebugToggle}
                className="scale-90 sm:scale-100"
              />
              <Label className="sr-only">Debug Mode</Label>
            </div>

            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-9"
              onClick={onThemeToggle}
            >
              {theme === "dark" ? (
                <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              ) : (
                <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              )}
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2 sm:px-2.5 md:px-3 text-xs sm:text-sm whitespace-nowrap"
              onClick={onApiKeyClick}
            >
              {hasApiKey ? "Update Key" : "Add Key"}
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
