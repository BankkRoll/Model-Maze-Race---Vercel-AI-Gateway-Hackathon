"use client";

import type React from "react";

/**
 * Modal for entering/updating API key configuration
 * Supports both AI Gateway keys and provider-specific keys
 * Automatically loads existing configuration from context
 *
 * @module ApiKeyModal
 */

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useApiKey } from "@/context/api-key-context";
import type { ApiKeyConfig } from "@/types";
import { AlertCircle, Building2, Key, Sparkles } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

interface ApiKeyModalProps {
  open: boolean;
  onSubmit: (config: ApiKeyConfig) => void;
  required?: boolean;
  onClose?: () => void;
}

/**
 * Modal component for API key configuration
 * Loads existing configuration from context and pre-populates form fields
 * When required=true, uses AlertDialog which cannot be dismissed without action
 *
 * @param props - Component props
 * @param props.open - Whether the modal is open
 * @param props.onSubmit - Callback when configuration is submitted
 * @param props.required - If true, modal cannot be dismissed without submitting (default: false)
 * @param props.onClose - Optional callback when modal is closed (only used when required=false)
 * @returns The modal component
 */
export function ApiKeyModal({
  open,
  onSubmit,
  required = false,
  onClose,
}: ApiKeyModalProps) {
  const { keyConfig, clearKey } = useApiKey();
  const [keyType, setKeyType] = useState<"gateway" | "provider">("gateway");
  const [gatewayKey, setGatewayKey] = useState("");
  const [providerKeys, setProviderKeys] = useState({
    openai: "",
    anthropic: "",
    xai: "",
    google: "",
    mistral: "",
    deepseek: "",
    groq: "",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    if (open && keyConfig) {
      setKeyType(keyConfig.type);

      if (keyConfig.type === "gateway" && keyConfig.gatewayKey) {
        setGatewayKey(keyConfig.gatewayKey);
      }

      if (keyConfig.type === "provider" && keyConfig.providerKeys) {
        setProviderKeys({
          openai: keyConfig.providerKeys.openai || "",
          anthropic: keyConfig.providerKeys.anthropic || "",
          xai: keyConfig.providerKeys.xai || "",
          google: keyConfig.providerKeys.google || "",
          mistral: keyConfig.providerKeys.mistral || "",
          deepseek: keyConfig.providerKeys.deepseek || "",
          groq: keyConfig.providerKeys.groq || "",
        });
      }
    } else if (open && !keyConfig) {
      setKeyType("gateway");
      setGatewayKey("");
      setProviderKeys({
        openai: "",
        anthropic: "",
        xai: "",
        google: "",
        mistral: "",
        deepseek: "",
        groq: "",
      });
    }
  }, [open, keyConfig]);

  /**
   * Handle form submission
   * Validates input and calls onSubmit with the configuration
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (keyType === "gateway") {
      if (!gatewayKey.trim()) {
        setError("Please enter an AI Gateway API key");
        return;
      }
      onSubmit({
        type: "gateway",
        gatewayKey: gatewayKey.trim(),
      });
    } else {
      const hasKey = Object.values(providerKeys).some((k) => k.trim());
      if (!hasKey) {
        setError("Please enter at least one provider API key");
        return;
      }

      const cleanedKeys: ApiKeyConfig["providerKeys"] = {};
      if (providerKeys.openai.trim())
        cleanedKeys.openai = providerKeys.openai.trim();
      if (providerKeys.anthropic.trim())
        cleanedKeys.anthropic = providerKeys.anthropic.trim();
      if (providerKeys.xai.trim()) cleanedKeys.xai = providerKeys.xai.trim();
      if (providerKeys.google.trim())
        cleanedKeys.google = providerKeys.google.trim();
      if (providerKeys.mistral.trim())
        cleanedKeys.mistral = providerKeys.mistral.trim();
      if (providerKeys.deepseek.trim())
        cleanedKeys.deepseek = providerKeys.deepseek.trim();
      if (providerKeys.groq.trim()) cleanedKeys.groq = providerKeys.groq.trim();

      onSubmit({
        type: "provider",
        providerKeys: cleanedKeys,
      });
    }
  };

  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="sm:max-w-2xl max-h-[90vh]">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            API Key Configuration
          </AlertDialogTitle>
          <AlertDialogDescription>
            {required
              ? "An API key is required to use this application. Choose between using the AI Gateway (recommended) or provider-specific keys. All keys are stored locally and never sent to external servers except the AI provider."
              : "Choose between using the AI Gateway (recommended) or provider-specific keys. All keys are stored locally and never sent to external servers except the AI provider."}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Tabs
            value={keyType}
            onValueChange={(v) => setKeyType(v as "gateway" | "provider")}
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="gateway" className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                AI Gateway
              </TabsTrigger>
              <TabsTrigger value="provider" className="flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Provider Keys
              </TabsTrigger>
            </TabsList>

            <TabsContent value="gateway" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="gatewayKey">AI Gateway API Key</Label>
                <Input
                  id="gatewayKey"
                  type="password"
                  placeholder="AI_GATEWAY_API_KEY"
                  value={gatewayKey}
                  onChange={(e) => {
                    setGatewayKey(e.target.value);
                    setError("");
                  }}
                  autoFocus
                />
                <p className="text-xs text-muted-foreground">
                  Access all models through a single API key. Get your key from
                  your Vercel dashboard or use OIDC when deployed on Vercel.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="provider" className="mt-4">
              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground mb-4">
                    Enter API keys for the providers you want to use. You can
                    add keys for multiple providers.
                  </p>

                  <div className="space-y-2">
                    <Label htmlFor="openai">OpenAI API Key</Label>
                    <Input
                      id="openai"
                      type="password"
                      placeholder="sk-..."
                      value={providerKeys.openai}
                      onChange={(e) => {
                        setProviderKeys({
                          ...providerKeys,
                          openai: e.target.value,
                        });
                        setError("");
                      }}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="anthropic">Anthropic API Key</Label>
                    <Input
                      id="anthropic"
                      type="password"
                      placeholder="sk-ant-..."
                      value={providerKeys.anthropic}
                      onChange={(e) => {
                        setProviderKeys({
                          ...providerKeys,
                          anthropic: e.target.value,
                        });
                        setError("");
                      }}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="xai">xAI (Grok) API Key</Label>
                    <Input
                      id="xai"
                      type="password"
                      placeholder="xai-..."
                      value={providerKeys.xai}
                      onChange={(e) => {
                        setProviderKeys({
                          ...providerKeys,
                          xai: e.target.value,
                        });
                        setError("");
                      }}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="google">Google AI API Key</Label>
                    <Input
                      id="google"
                      type="password"
                      placeholder="AIza..."
                      value={providerKeys.google}
                      onChange={(e) => {
                        setProviderKeys({
                          ...providerKeys,
                          google: e.target.value,
                        });
                        setError("");
                      }}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="mistral">Mistral API Key</Label>
                    <Input
                      id="mistral"
                      type="password"
                      placeholder="..."
                      value={providerKeys.mistral}
                      onChange={(e) => {
                        setProviderKeys({
                          ...providerKeys,
                          mistral: e.target.value,
                        });
                        setError("");
                      }}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="deepseek">DeepSeek API Key</Label>
                    <Input
                      id="deepseek"
                      type="password"
                      placeholder="sk-..."
                      value={providerKeys.deepseek}
                      onChange={(e) => {
                        setProviderKeys({
                          ...providerKeys,
                          deepseek: e.target.value,
                        });
                        setError("");
                      }}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="groq">Groq API Key</Label>
                    <Input
                      id="groq"
                      type="password"
                      placeholder="gsk_..."
                      value={providerKeys.groq}
                      onChange={(e) => {
                        setProviderKeys({
                          ...providerKeys,
                          groq: e.target.value,
                        });
                        setError("");
                      }}
                    />
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-2 text-sm text-destructive"
              >
                <AlertCircle className="w-4 h-4" />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="bg-muted/50 p-3 rounded-lg text-sm space-y-2">
            <p className="font-medium">Getting API Keys:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground text-xs">
              <li>
                AI Gateway: Get from Vercel dashboard or use OIDC on deployment
              </li>
              <li>OpenAI: platform.openai.com</li>
              <li>Anthropic: console.anthropic.com</li>
              <li>xAI: x.ai/api</li>
              <li>Google: ai.google.dev</li>
            </ul>
          </div>

          <AlertDialogFooter>
            <div className="flex gap-2 w-full">
              <AlertDialogAction type="submit" asChild>
                <Button type="submit" className="flex-1">
                  {keyConfig ? "Update Configuration" : "Save Configuration"}
                </Button>
              </AlertDialogAction>
              {!required && keyConfig && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => {
                    clearKey();
                    setGatewayKey("");
                    setProviderKeys({
                      openai: "",
                      anthropic: "",
                      xai: "",
                      google: "",
                      mistral: "",
                      deepseek: "",
                      groq: "",
                    });
                    setKeyType("gateway");
                    setError("");
                    onClose?.();
                  }}
                >
                  Clear Keys
                </Button>
              )}
              {!required && onClose && (
                <AlertDialogCancel asChild>
                  <Button type="button" variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                </AlertDialogCancel>
              )}
            </div>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
