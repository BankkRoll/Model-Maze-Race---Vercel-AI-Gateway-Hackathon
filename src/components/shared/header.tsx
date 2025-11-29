"use client";

/**
 * Application header component with controls and navigation
 * Manages its own theme, debug mode, and API key state
 *
 * @module Header
 */

import { ApiKeyModal } from "@/components/shared/api-key-modal";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useApiKey } from "@/context/api-key-context";
import { loadSettings, saveSettings } from "@/lib/storage";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

interface HeaderProps {
  onFullMazeToggle?: (value: boolean) => void;
}

/**
 * Header component for the application
 * Manages theme, debug mode, and API key state internally
 *
 * @param props - Header component props
 * @returns Header JSX element
 */
export function Header({ onFullMazeToggle }: HeaderProps) {
  const { keyConfig, primaryKey, setKeyConfig, isLoading } = useApiKey();
  const [debugMode, setDebugMode] = useState(false);
  const [showApiModal, setShowApiModal] = useState(false);
  const hasCheckedApiKey = useRef(false);

  useEffect(() => {
    const settings = loadSettings();
    setDebugMode(settings.debugMode);
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const hasOidc = keyConfig?.type === "oidc";
    const hasGateway = keyConfig?.type === "gateway" && !!keyConfig.gatewayKey;
    const hasProvider =
      keyConfig?.type === "provider" &&
      !!keyConfig.providerKeys &&
      Object.values(keyConfig.providerKeys).some((key) => !!key);

    const hasAnyAuth = hasOidc || hasGateway || hasProvider;

    if (!hasAnyAuth && !hasCheckedApiKey.current) {
      hasCheckedApiKey.current = true;
      setShowApiModal(true);
    }
  }, [keyConfig, primaryKey, isLoading]);

  const toggleDebugMode = () => {
    const newDebugMode = !debugMode;
    setDebugMode(newDebugMode);
    saveSettings({ debugMode: newDebugMode });
    window.dispatchEvent(new Event("settingsChanged"));
  };

  const handleApiKeySubmit = async (config: any) => {
    await setKeyConfig(config);
    setShowApiModal(false);
  };

  const hasOidc = keyConfig?.type === "oidc";
  const hasGateway = keyConfig?.type === "gateway" && !!keyConfig.gatewayKey;
  const hasProvider =
    keyConfig?.type === "provider" &&
    !!keyConfig.providerKeys &&
    Object.values(keyConfig.providerKeys).some((key) => !!key);
  const hasApiKey = hasOidc || hasGateway || hasProvider;

  return (
    <header className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-50 bg-background/80">
      <div className="container mx-auto px-3 sm:px-4 py-2.5 sm:py-3 md:py-4">
        <div className="flex items-center justify-between gap-2 sm:gap-3 md:gap-4">
          <div className="flex-1 min-w-0 flex items-center gap-2 sm:gap-3">
            <Link href="/" className="flex flex-col">
              <h1 className="text-base sm:text-lg md:text-xl font-bold text-primary truncate">
                Model Maze Race
              </h1>
              <p className="text-xs text-muted-foreground hidden sm:inline truncate">
                Vercel AI Gateway Hackathon
              </p>
            </Link>
          </div>

          <div className="flex items-center justify-center flex-shrink-0">
            <Link
              href="/about"
              className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap px-2"
            >
              About
            </Link>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 lg:gap-4 flex-shrink-0 flex-1 justify-end">
            <div className="flex items-center gap-1">
              <Switch
                checked={debugMode}
                onCheckedChange={toggleDebugMode}
                className="scale-90 sm:scale-100"
              />
              <Label className="sr-only">Debug Mode</Label>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2 sm:px-2.5 md:px-3 text-xs sm:text-sm whitespace-nowrap"
              onClick={() => setShowApiModal(true)}
            >
              {hasApiKey ? "Update Key" : "Add Key"}
            </Button>
          </div>
        </div>
      </div>

      <ApiKeyModal
        open={showApiModal}
        onSubmit={handleApiKeySubmit}
        required={!primaryKey}
        onClose={primaryKey ? () => setShowApiModal(false) : undefined}
      />
    </header>
  );
}
