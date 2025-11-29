"use client";

/**
 * Modal for API key configuration with 3 authentication options:
 * 1. Vercel Auth (OIDC) - Sign in with Vercel to use account credits
 * 2. Gateway API Key - Manual API key for AI Gateway
 * 3. Provider Keys - Direct provider API keys
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useApiKey } from "@/context/api-key-context";
import { getAllKeyStats } from "@/lib/api-key-stats";
import type { ApiKeyConfig } from "@/types";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Download,
  Eye,
  EyeOff,
  Key,
  LogIn,
  Sparkles,
  Upload,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";

interface ApiKeyModalProps {
  open: boolean;
  onSubmit: (config: ApiKeyConfig) => void;
  required?: boolean;
  onClose?: () => void;
}

function isOidcConfigured(): boolean {
  return !!process.env.NEXT_PUBLIC_VERCEL_APP_CLIENT_ID;
  // we dont check for the secret because it is stored in a httpOnly cookie server side
}

/**
 * Modal component for API key configuration with 3 authentication methods
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
  const [authType, setAuthType] = useState<"oidc" | "gateway" | "provider">(
    "oidc",
  );
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
  const [success, setSuccess] = useState("");
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>(
    {},
  );
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [keyStats, setKeyStats] = useState<ReturnType<
    typeof getAllKeyStats
  > | null>(null);
  const [oidcConfigured, setOidcConfigured] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    setOidcConfigured(isOidcConfigured());
  }, []);

  useEffect(() => {
    if (open && keyConfig) {
      setAuthType(keyConfig.type);

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

      const stats = getAllKeyStats();
      setKeyStats(stats);
    } else if (open && !keyConfig) {
      setAuthType(oidcConfigured ? "oidc" : "gateway");
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

    if (open) {
      setError("");
      setSuccess("");
      setShowPasswords({});
    }
  }, [open, keyConfig, oidcConfigured]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !required && onClose) {
        onClose();
      }

      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        formRef.current?.requestSubmit();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, required, onClose]);

  /**
   * Toggle password visibility for a specific field
   *
   * @param fieldId - The field identifier
   */
  const togglePasswordVisibility = (fieldId: string) => {
    setShowPasswords((prev) => ({
      ...prev,
      [fieldId]: !prev[fieldId],
    }));
  };

  /**
   * Handle Sign in with Vercel
   * Redirects to OAuth authorization endpoint
   */
  const handleSignInWithVercel = () => {
    window.location.href = "/api/auth/authorize";
  };

  /**
   * Handle form submission
   *
   * @param e - Form event
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (authType === "oidc") {
      /**
       * OIDC is handled via OAuth flow, just acknowledge
       */
      onSubmit({
        type: "oidc",
      });
      setSuccess("Using Vercel authentication!");
      setTimeout(() => {
        setSuccess("");
      }, 3000);
    } else if (authType === "gateway") {
      if (!gatewayKey.trim()) {
        setError("Please enter an AI Gateway API key");
        return;
      }

      onSubmit({
        type: "gateway",
        gatewayKey: gatewayKey.trim(),
      });

      setSuccess("API key configuration saved successfully!");
      setTimeout(() => {
        setSuccess("");
      }, 3000);
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

      setSuccess("API key configuration saved successfully!");
      setTimeout(() => {
        setSuccess("");
      }, 3000);
    }
  };

  /**
   * Handle clearing all keys with confirmation
   */
  const handleClearKeys = () => {
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
    setAuthType("oidc");
    setError("");
    setShowClearConfirm(false);
    setKeyStats(null);
    onClose?.();
  };

  /**
   * Export API key configuration as JSON
   */
  const handleExport = () => {
    const config: ApiKeyConfig = {
      type: authType,
      ...(authType === "gateway"
        ? { gatewayKey }
        : authType === "provider"
          ? { providerKeys: providerKeys }
          : {}),
    };

    const dataStr = JSON.stringify(config, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "api-keys-config.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  /**
   * Import API key configuration from JSON file
   *
   * @param event - File input change event
   */
  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const config = JSON.parse(e.target?.result as string) as ApiKeyConfig;

        if (config.type === "gateway" && config.gatewayKey) {
          setAuthType("gateway");
          setGatewayKey(config.gatewayKey);
        } else if (config.type === "provider" && config.providerKeys) {
          setAuthType("provider");
          setProviderKeys({
            openai: config.providerKeys.openai || "",
            anthropic: config.providerKeys.anthropic || "",
            xai: config.providerKeys.xai || "",
            google: config.providerKeys.google || "",
            mistral: config.providerKeys.mistral || "",
            deepseek: config.providerKeys.deepseek || "",
            groq: config.providerKeys.groq || "",
          });
        } else if (config.type === "oidc") {
          setAuthType("oidc");
        }

        setSuccess("Configuration imported successfully!");
        setTimeout(() => {
          setSuccess("");
        }, 3000);
      } catch (err) {
        setError(
          "Failed to import configuration. Please check the file format.",
        );
      }
    };
    reader.readAsText(file);
  };

  const providerFields = [
    { id: "openai", label: "OpenAI API Key", placeholder: "sk-..." },
    {
      id: "anthropic",
      label: "Anthropic API Key",
      placeholder: "sk-ant-...",
    },
    { id: "xai", label: "xAI (Grok) API Key", placeholder: "xai-..." },
    { id: "google", label: "Google AI API Key", placeholder: "AIza..." },
    { id: "mistral", label: "Mistral API Key", placeholder: "..." },
    { id: "deepseek", label: "DeepSeek API Key", placeholder: "sk-..." },
    { id: "groq", label: "Groq API Key", placeholder: "gsk_..." },
  ] as const;

  return (
    <>
      <AlertDialog open={open}>
        <AlertDialogContent className="sm:max-w-2xl max-h-[90vh]">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Key className="w-5 h-5" />
              Authentication Setup
            </AlertDialogTitle>
            <AlertDialogDescription>
              {required
                ? "Choose your authentication method to get started."
                : "Choose your authentication method."}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="px-1 pb-2">
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>All keys are stored locally in your browser only</li>
              <li>Keys are encrypted before storage</li>
              <li>
                Keys are never sent to external servers except the AI provider
              </li>
              <li>OIDC tokens are stored in secure httpOnly cookies</li>
            </ul>
          </div>

          <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
            <Tabs
              value={authType}
              onValueChange={(v) =>
                setAuthType(v as "oidc" | "gateway" | "provider")
              }
            >
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="oidc" className="flex items-center gap-2">
                  <LogIn className="w-4 h-4" />
                  Vercel Auth
                </TabsTrigger>
                <TabsTrigger
                  value="gateway"
                  className="flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  Gateway Key
                </TabsTrigger>
                <TabsTrigger
                  value="provider"
                  className="flex items-center gap-2"
                >
                  <Building2 className="w-4 h-4" />
                  Provider Keys
                </TabsTrigger>
              </TabsList>

              {/* Tab 1: Vercel Auth (OIDC) */}
              <TabsContent value="oidc" className="space-y-4 mt-4">
                {!oidcConfigured ? (
                  <div className="p-4 border-2 border-yellow-500/50 bg-yellow-500/10 rounded-lg space-y-3">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                      <div className="space-y-2 flex-1">
                        <h3 className="font-semibold text-yellow-700 dark:text-yellow-400">
                          OIDC Authentication Not Configured
                        </h3>
                        <p className="text-sm text-yellow-700/90 dark:text-yellow-400/90">
                          To use Sign in with Vercel, you need to configure
                          OAuth credentials. This allows you to use your Vercel
                          account credits directly.
                        </p>
                      </div>
                    </div>
                    <div className="pl-8 space-y-2">
                      <p className="text-sm font-medium text-yellow-700 dark:text-yellow-400">
                        Required Environment Variables:
                      </p>
                      <div className="space-y-1.5 text-xs font-mono bg-yellow-500/20 p-3 rounded border border-yellow-500/30">
                        <div className="flex items-center gap-2">
                          <span className="text-yellow-600 dark:text-yellow-400">
                            NEXT_PUBLIC_VERCEL_APP_CLIENT_ID
                          </span>
                          <span className="text-yellow-700/70 dark:text-yellow-400/70">
                            = your-client-id
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-yellow-600 dark:text-yellow-400">
                            VERCEL_APP_CLIENT_SECRET
                          </span>
                          <span className="text-yellow-700/70 dark:text-yellow-400/70">
                            = your-client-secret
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-yellow-700/80 dark:text-yellow-400/80 mt-2">
                        Get these from your Vercel Dashboard → Team Settings →
                        Apps → Create App
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 border rounded-lg bg-muted/30 space-y-4">
                    <div className="space-y-2">
                      <h3 className="font-semibold flex items-center gap-2">
                        <LogIn className="w-5 h-5" />
                        Sign in with Vercel
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Use your Vercel account to authenticate. This allows you
                        to use your Vercel credits directly without managing API
                        keys manually.
                      </p>
                      <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                        <li>Uses your Vercel account credits automatically</li>
                        <li>No API keys to manage or rotate</li>
                        <li>Secure OAuth 2.0 authentication</li>
                        <li>Tokens refresh automatically</li>
                      </ul>
                    </div>
                    <Button
                      type="button"
                      onClick={handleSignInWithVercel}
                      className="w-full"
                      size="lg"
                    >
                      <LogIn className="w-4 h-4 mr-2" />
                      Sign in with Vercel
                    </Button>
                  </div>
                )}
              </TabsContent>

              {/* Tab 2: Gateway API Key */}
              <TabsContent value="gateway" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="gatewayKey">AI Gateway API Key</Label>
                  <div className="relative">
                    <Input
                      id="gatewayKey"
                      type={showPasswords.gateway ? "text" : "password"}
                      placeholder="AI_GATEWAY_API_KEY"
                      value={gatewayKey}
                      onChange={(e) => {
                        setGatewayKey(e.target.value);
                        setError("");
                      }}
                      autoFocus
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                      onClick={() => togglePasswordVisibility("gateway")}
                    >
                      {showPasswords.gateway ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Access all models through a single API key. Get your key
                    from your Vercel dashboard or use OIDC when deployed on
                    Vercel.
                  </p>
                </div>
              </TabsContent>

              {/* Tab 3: Provider Keys */}
              <TabsContent value="provider" className="mt-4">
                <ScrollArea className="h-[300px] pr-4">
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground mb-4">
                      Enter API keys for the providers you want to use. You can
                      add keys for multiple providers.
                    </p>

                    {providerFields.map((field) => {
                      const fieldId = `provider-${field.id}`;
                      const value = providerKeys[field.id];
                      const showPassword = showPasswords[fieldId];

                      return (
                        <div key={field.id} className="space-y-2">
                          <Label htmlFor={fieldId}>{field.label}</Label>
                          <div className="relative">
                            <Input
                              id={fieldId}
                              type={showPassword ? "text" : "password"}
                              placeholder={field.placeholder}
                              value={value}
                              onChange={(e) => {
                                setProviderKeys({
                                  ...providerKeys,
                                  [field.id]: e.target.value,
                                });
                                setError("");
                              }}
                              className="pr-10"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                              onClick={() => togglePasswordVisibility(fieldId)}
                            >
                              {showPassword ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      );
                    })}
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
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span className="whitespace-pre-line">{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {success && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400"
                >
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  {success}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowStats(true)}
                className="h-7"
              >
                View Statistics
              </Button>
              <span>•</span>
              <label className="cursor-pointer">
                <Upload className="w-3.5 h-3.5 inline mr-1" />
                Import
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />
              </label>
              <span>•</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleExport}
                className="h-7"
              >
                <Download className="w-3.5 h-3.5 mr-1" />
                Export
              </Button>
            </div>

            <AlertDialogFooter>
              <div className="flex gap-2 w-full flex-wrap">
                {authType !== "oidc" && (
                  <AlertDialogAction type="submit" asChild>
                    <Button type="submit" className="flex-1">
                      {keyConfig
                        ? "Update Configuration"
                        : "Save Configuration"}
                    </Button>
                  </AlertDialogAction>
                )}
                {!required && keyConfig && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => setShowClearConfirm(true)}
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

      {/* Clear Confirmation Dialog */}
      <Dialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clear API Keys?</DialogTitle>
            <DialogDescription>
              This will permanently delete all stored API keys. This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowClearConfirm(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleClearKeys}>
              Clear All Keys
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Statistics Dialog */}
      <Dialog open={showStats} onOpenChange={setShowStats}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>API Key Usage Statistics</DialogTitle>
            <DialogDescription>
              View usage statistics for your API keys
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            {keyStats && keyStats.length > 0 ? (
              <div className="space-y-4">
                {keyStats.map(({ keyHash, stats }) => (
                  <div
                    key={keyHash}
                    className="p-4 border rounded-lg space-y-2"
                  >
                    <div className="font-mono text-sm text-muted-foreground">
                      {keyHash}
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">
                          Usage Count:
                        </span>{" "}
                        {stats.usageCount}
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          Total Calls:
                        </span>{" "}
                        {stats.totalCalls}
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          Successful:
                        </span>{" "}
                        <span className="text-green-600 dark:text-green-400">
                          {stats.successfulCalls}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Failed:</span>{" "}
                        <span className="text-red-600 dark:text-red-400">
                          {stats.failedCalls}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          First Used:
                        </span>{" "}
                        {new Date(stats.firstUsed).toLocaleDateString()}
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          Last Used:
                        </span>{" "}
                        {new Date(stats.lastUsed).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No usage statistics available yet.
              </div>
            )}
          </ScrollArea>
          <DialogFooter>
            <Button onClick={() => setShowStats(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
