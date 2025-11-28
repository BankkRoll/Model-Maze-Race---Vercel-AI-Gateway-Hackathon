/**
 * AI Gateway integration for model communication
 * Handles all interactions with Vercel AI SDK
 *
 * @module ai
 */

import type { AvailableModel, Direction, VisibleArea } from "@/types";
import { createGateway, generateText } from "ai";
import { formatVisibleAreaForPrompt } from "./maze";

/**
 * Create the prompt for the AI model to make a move
 *
 * @param visible - The 3x3 visible area around the model
 * @param moveHistory - History of previous moves
 * @param stepCount - Current step number
 * @returns Formatted prompt string for the AI model
 */
function createMovePrompt(
  visible: VisibleArea,
  moveHistory: Direction[],
  stepCount: number,
): string {
  const historyText = moveHistory.slice(-5).join(", ") || "none";
  const gridText = formatVisibleAreaForPrompt(visible);

  return `You are navigating a maze. You cannot see the entire maze, only your immediate surroundings.

Current step: ${stepCount}

Your visible area (3×3 grid around you, you are in the center):
${gridText}

Legend: █ = wall, · = open path, S = start, E = exit, ? = unknown

Recent moves: ${historyText}

Available actions: up, down, left, right

Respond with ONLY ONE WORD - the direction you want to move: up, down, left, or right.`;
}

/**
 * Request a move from an AI model via AI Gateway
 * Sends the current visible area and move history to the model and parses the response
 *
 * @param modelString - Model identifier (e.g., "openai/gpt-4o-mini")
 * @param visible - The 3x3 visible area around the model's current position
 * @param moveHistory - Array of previous move directions
 * @param stepCount - Current step number in the race
 * @param apiKey - Optional API key for custom gateway authentication
 * @param onStatusUpdate - Optional callback for status updates during the request
 * @returns Promise resolving to the parsed direction, raw response, and prompt used
 *
 * @example
 * ```tsx
 * const result = await requestModelMove(
 *   "openai/gpt-4o-mini",
 *   visibleArea,
 *   ["up", "right", "down"],
 *   5,
 *   "api-key",
 *   (status, text) => console.log(status, text)
 * )
 * // result.direction === "left" | "right" | "up" | "down" | null
 * ```
 */
export async function requestModelMove(
  modelString: string,
  visible: VisibleArea,
  moveHistory: Direction[],
  stepCount: number,
  apiKey?: string,
  onStatusUpdate?: (
    status: "thinking" | "responding" | "complete",
    text?: string,
  ) => void,
): Promise<{
  direction: Direction | null;
  rawResponse: string;
  prompt: string;
}> {
  const prompt = createMovePrompt(visible, moveHistory, stepCount);

  try {
    onStatusUpdate?.("thinking");

    let model: any = modelString;

    if (apiKey) {
      const customGateway = createGateway({
        apiKey,
      });
      model = customGateway(modelString);
    }

    const config = {
      model,
      prompt,
      maxTokens: 10,
      temperature: 0.7,
    };

    onStatusUpdate?.("responding");

    const { text } = await generateText(config);

    onStatusUpdate?.("complete", text);

    const direction = parseDirectionFromResponse(text);

    return {
      direction,
      rawResponse: text,
      prompt,
    };
  } catch (error) {
    console.error("[v0] AI request failed:", error);
    onStatusUpdate?.(
      "complete",
      `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
    return {
      direction: null,
      rawResponse: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
      prompt,
    };
  }
}

/**
 * Parse direction from model response
 * Handles various response formats and extracts a valid direction
 *
 * @param response - Raw text response from the AI model
 * @returns Parsed direction, or null if no valid direction found
 */
function parseDirectionFromResponse(response: string): Direction | null {
  const cleaned = response.toLowerCase().trim();

  if (["up", "down", "left", "right"].includes(cleaned)) {
    return cleaned as Direction;
  }

  if (cleaned.includes("up")) return "up";
  if (cleaned.includes("down")) return "down";
  if (cleaned.includes("left")) return "left";
  if (cleaned.includes("right")) return "right";

  return null;
}

/**
 * Fetch available models from AI Gateway
 * Returns list of models that can be used for racing
 * Falls back to a predefined list if the gateway is unavailable
 *
 * @param apiKey - Optional API key for custom gateway authentication
 * @returns Promise resolving to an array of available models
 *
 * @example
 * ```tsx
 * const models = await fetchAvailableModels("api-key")
 * // Returns: [{ id: "openai/gpt-4o", name: "GPT-4o", ... }, ...]
 * ```
 */
export async function fetchAvailableModels(
  apiKey?: string,
): Promise<AvailableModel[]> {
  try {
    console.log("[v0] Fetching available models from AI Gateway...");

    let result;
    if (apiKey) {
      const customGateway = createGateway({ apiKey });
      result = await customGateway.getAvailableModels();
    } else {
      const { gateway } = await import("ai");
      result = await gateway.getAvailableModels();
    }

    console.log("[v0] Found", result.models.length, "models");

    const models: AvailableModel[] = result.models.map((model) => ({
      id: model.id,
      name: model.name || model.id,
      description: model.description ?? undefined,
      pricing: model.pricing
        ? {
            input:
              typeof model.pricing.input === "number"
                ? model.pricing.input
                : Number.parseFloat(String(model.pricing.input)),
            output:
              typeof model.pricing.output === "number"
                ? model.pricing.output
                : Number.parseFloat(String(model.pricing.output)),
          }
        : undefined,
    }));

    return models;
  } catch (error) {
    console.error("[v0] Failed to fetch models from gateway:", error);

    const fallbackModels: AvailableModel[] = [
      {
        id: "openai/gpt-4o-mini",
        name: "GPT-4o Mini",
        description: "Fast and efficient OpenAI model",
        pricing: { input: 0.00015, output: 0.0006 },
      },
      {
        id: "openai/gpt-4o",
        name: "GPT-4o",
        description: "Powerful multimodal model",
        pricing: { input: 0.0025, output: 0.01 },
      },
      {
        id: "anthropic/claude-sonnet-4",
        name: "Claude Sonnet 4",
        description: "Balanced performance and speed",
        pricing: { input: 0.003, output: 0.015 },
      },
      {
        id: "anthropic/claude-3-5-sonnet-20241022",
        name: "Claude 3.5 Sonnet",
        description: "Previous generation Claude",
        pricing: { input: 0.003, output: 0.015 },
      },
      {
        id: "xai/grok-beta",
        name: "Grok Beta",
        description: "xAI flagship model",
        pricing: { input: 0.0005, output: 0.001 },
      },
      {
        id: "google/gemini-2.0-flash-exp",
        name: "Gemini 2.0 Flash",
        description: "Google fast experimental model",
        pricing: { input: 0.0001, output: 0.0002 },
      },
      {
        id: "deepseek/deepseek-chat",
        name: "DeepSeek Chat",
        description: "Cost-effective reasoning model",
        pricing: { input: 0.00014, output: 0.00028 },
      },
      {
        id: "meta-llama/llama-3.3-70b-instruct",
        name: "Llama 3.3 70B",
        description: "Meta's powerful instruct model",
        pricing: { input: 0.0004, output: 0.0004 },
      },
      {
        id: "perplexity/llama-3.1-sonar-small-128k-online",
        name: "Sonar Small",
        description: "Perplexity online model",
        pricing: { input: 0.0002, output: 0.0002 },
      },
    ];

    return fallbackModels;
  }
}

/**
 * Validate API key by making a test request
 * Attempts to use the API key with a minimal request to verify it works
 *
 * @param apiKey - The API key to validate
 * @returns Promise resolving to true if the key is valid, false otherwise
 *
 * @example
 * ```tsx
 * const isValid = await validateApiKey("your-api-key")
 * if (isValid) {
 *   // Proceed with using the key
 * }
 * ```
 */
export async function validateApiKey(apiKey: string): Promise<boolean> {
  try {
    await generateText({
      model: "openai/gpt-5-mini",
      prompt: "Test",
    });
    return true;
  } catch {
    return false;
  }
}
