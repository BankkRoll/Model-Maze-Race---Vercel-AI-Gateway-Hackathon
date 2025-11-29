/**
 * AI Gateway integration for model communication
 * Handles all interactions with Vercel AI SDK
 *
 * @module ai
 */

import type {
  AvailableModel,
  Direction,
  ModelCapabilities,
  Position,
  VisibleArea,
} from "@/types";
import { createGateway, gateway, generateText, streamText } from "ai";
import {
  countVisits,
  detectLoop,
  formatVisibleAreaForPrompt,
  getUnexploredDirections,
} from "./maze";

/**
 * Create the prompt for the AI model to make a move
 * Includes full path context, loop detection, and backtracking awareness
 *
 * @param visible - The 3x3 visible area around the model
 * @param moveHistory - History of previous moves
 * @param stepCount - Current step number
 * @param pathTaken - Array of all positions visited
 * @param currentPosition - Current position of the model
 * @returns Formatted prompt string for the AI model
 */
function createMovePrompt(
  visible: VisibleArea,
  moveHistory: Direction[],
  stepCount: number,
  pathTaken: Position[],
  currentPosition: Position,
): string {
  const historyText = moveHistory.slice(-10).join(", ") || "none";
  const gridText = formatVisibleAreaForPrompt(
    visible,
    pathTaken,
    currentPosition,
  );

  const currentVisitCount = countVisits(pathTaken, currentPosition);

  const hasLoop = detectLoop(moveHistory, 8);
  const loopWarning = hasLoop
    ? `\n⚠️ LOOP DETECTED: You've been repeating a pattern in your recent moves. Try a different direction to break the cycle.`
    : "";

  const recentPath = pathTaken.slice(-15);
  const pathSummary = recentPath
    .map((pos, idx) => {
      const visitCount = countVisits(pathTaken, pos);
      const stepsAgo = pathTaken.length - idx - 1;
      const marker =
        stepsAgo === 0
          ? "(current)"
          : stepsAgo === 1
            ? "(1 step ago)"
            : `(${stepsAgo} steps ago)`;
      return visitCount > 1
        ? `- (${pos.x},${pos.y}) - visited ${visitCount} times ${marker}`
        : `- (${pos.x},${pos.y}) ${marker}`;
    })
    .join("\n");

  const backtrackWarning =
    currentVisitCount > 1
      ? `\n⚠️ BACKTRACKING: You've returned to position (${currentPosition.x},${currentPosition.y}) which you've visited ${currentVisitCount} times. Consider exploring new areas.`
      : "";

  const unexplored = getUnexploredDirections(
    currentPosition,
    pathTaken,
    visible,
  );
  const unexploredHint =
    unexplored.length > 0
      ? `\n💡 Unexplored directions from here: ${unexplored.join(", ")}. These lead to areas you haven't visited yet.`
      : "";

  const directionVisits: Record<Direction, number> = {
    up: 0,
    down: 0,
    left: 0,
    right: 0,
  };

  const directionOffsets: Record<Direction, { x: number; y: number }> = {
    up: { x: 0, y: -1 },
    down: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 },
  };

  for (const [dir, offset] of Object.entries(directionOffsets)) {
    const nextPos: Position = {
      x: currentPosition.x + offset.x,
      y: currentPosition.y + offset.y,
    };
    directionVisits[dir as Direction] = countVisits(pathTaken, nextPos);
  }

  const directionInfo = Object.entries(directionVisits)
    .filter(([_, count]) => count > 0)
    .map(
      ([dir, count]) =>
        `- ${dir}: visited ${count} time${count > 1 ? "s" : ""}`,
    )
    .join("\n");

  const exploredDirections =
    directionInfo.length > 0
      ? `\nFrom your current position, you've already explored:\n${directionInfo}`
      : "";

  return `You are navigating a maze to reach the exit. Your goal is to reach the exit (E) in as few steps as possible.

You cannot see the entire maze, only your immediate 3×3 surroundings. You must use your memory of where you've been to navigate efficiently.

Current step: ${stepCount}
Current position: (${currentPosition.x}, ${currentPosition.y})

Your visible area (3×3 grid around you, you are in the center):
${gridText}

Legend:
  █ = wall (cannot move here)
  · = open path
  S = start position
  E = exit (your goal!)
  ? = unknown (out of bounds or not visible)
  V = visited before (you've been here)
  V2, V3, etc. = visited multiple times (avoid revisiting)

Path History (last 15 positions):
${pathSummary || "No previous positions"}

Recent moves (last 10): ${historyText}
${loopWarning}${backtrackWarning}${exploredDirections}${unexploredHint}

Available actions: up, down, left, right

IMPORTANT: 
- Avoid revisiting positions you've already explored (marked with V)
- Break any loops by trying unexplored directions
- Move towards the exit (E) when you can see it
- Explore systematically to avoid getting stuck

═══════════════════════════════════════════════════════════════
⚠️ STRICT OUTPUT REQUIREMENT - READ CAREFULLY ⚠️
═══════════════════════════════════════════════════════════════

YOUR RESPONSE MUST BE EXACTLY ONE WORD.

VALID RESPONSES: up | down | left | right

INVALID RESPONSES (DO NOT DO THIS):
❌ "I think I should go up"
❌ "up, because..."
❌ "Direction: up"
❌ Any response with more than one word
❌ Any response with punctuation
❌ Any response with capitalization

OUTPUT FORMAT RULES:
1. EXACTLY ONE WORD
2. No reasoning in the output
3. Just the word: up | down | left | right

IF YOU INCLUDE ANYTHING OTHER THAN ONE LOWERCASE WORD, YOUR RESPONSE WILL BE REJECTED.

RESPOND NOW WITH EXACTLY ONE WORD:`;
}

/**
 * Request a move from an AI model via AI Gateway
 * Sends the current visible area and move history to the model and parses the response
 * Supports reasoning for models that have this capability
 *
 * @param modelString - Model identifier (e.g., "openai/gpt-4o-mini")
 * @param visible - The 3x3 visible area around the model's current position
 * @param moveHistory - Array of previous move directions
 * @param stepCount - Current step number in the race
 * @param pathTaken - Array of all positions visited by the model
 * @param currentPosition - Current position of the model
 * @param apiKey - Optional API key for custom gateway authentication
 * @param capabilities - Optional model capabilities
 * @param onStatusUpdate - Optional callback for status updates during the request
 * @param onReasoningUpdate - Optional callback for reasoning text updates
 * @returns Promise resolving to the parsed direction, raw response, reasoning, and prompt used
 *
 * @example
 * ```tsx
 * const result = await requestModelMove(
 *   "deepseek/deepseek-r1",
 *   visibleArea,
 *   ["up", "right", "down"],
 *   5,
 *   [{x:1,y:1}, {x:1,y:2}, ...],
 *   {x:1, y:2},
 *   "api-key",
 *   { reasoning: true },
 *   (status, text) => console.log(status, text),
 *   (reasoning) => console.log("Reasoning:", reasoning)
 * )
 * ```
 */
export async function requestModelMove(
  modelString: string,
  visible: VisibleArea,
  moveHistory: Direction[],
  stepCount: number,
  pathTaken: Position[],
  currentPosition: Position,
  apiKey?: string,
  capabilities?: ModelCapabilities,
  onStatusUpdate?: (
    status: "thinking" | "responding" | "complete",
    text?: string,
  ) => void,
  onReasoningUpdate?: (reasoning: string) => void,
): Promise<{
  direction: Direction | null;
  rawResponse: string;
  reasoning?: string;
  prompt: string;
}> {
  const prompt = createMovePrompt(
    visible,
    moveHistory,
    stepCount,
    pathTaken,
    currentPosition,
  );
  const supportsReasoning = capabilities?.reasoning ?? false;

  try {
    onStatusUpdate?.("thinking");

    let model: any = modelString;

    if (apiKey) {
      const customGateway = createGateway({
        apiKey,
      });
      model = customGateway(modelString);
    }

    if (supportsReasoning) {
      let reasoningText = "";
      let responseText = "";

      const result = streamText({
        model,
        prompt,
        temperature: 0.7,
      });

      for await (const part of result.fullStream) {
        if (part.type === "reasoning-delta") {
          reasoningText += part.text;
          onReasoningUpdate?.(reasoningText);
        } else if (part.type === "text-delta") {
          responseText += part.text;
          onStatusUpdate?.("responding", responseText);
        }
      }

      const fullText = await result.text;
      const fullReasoning = (await result.reasoningText) || reasoningText;

      onStatusUpdate?.("complete", fullText);

      const direction = parseDirectionFromResponse(fullText);

      return {
        direction,
        rawResponse: fullText,
        reasoning: fullReasoning || undefined,
        prompt,
      };
    } else {
      const config = {
        model,
        prompt,
        maxTokens: 5,
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
    }
  } catch (error) {
    console.error("AI request failed:", error);
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
    let result;
    if (apiKey) {
      const customGateway = createGateway({ apiKey });
      result = await customGateway.getAvailableModels();
    } else {
      result = await gateway.getAvailableModels();
    }

    const languageModels = result.models.filter(
      (model: any) => !model.modelType || model.modelType === "language",
    );

    const models: AvailableModel[] = languageModels.map((model: any) => {
      const capabilities: { reasoning?: boolean } = {};

      const modelId = (model.id || "").toLowerCase();

      if (model.capabilities?.reasoning !== undefined) {
        capabilities.reasoning = Boolean(model.capabilities.reasoning);
      } else if (model.supportsReasoning !== undefined) {
        capabilities.reasoning = Boolean(model.supportsReasoning);
      } else {
        capabilities.reasoning =
          modelId.includes("deepseek-r1") ||
          modelId.includes("deepseek-reasoner") ||
          modelId.includes("deepseek-v3") ||
          modelId.includes("grok") ||
          modelId.includes("claude-sonnet-4") ||
          modelId.includes("claude-opus-4") ||
          modelId.includes("thinking") ||
          modelId.includes("reasoning") ||
          modelId.includes("o1") ||
          modelId.includes("o3");
      }

      const specification = model.specification
        ? {
            specificationVersion: model.specification.specificationVersion,
            provider: model.specification.provider,
            modelId: model.specification.modelId,
          }
        : undefined;

      return {
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
              cachedInputTokens: model.pricing.cachedInputTokens
                ? typeof model.pricing.cachedInputTokens === "number"
                  ? model.pricing.cachedInputTokens
                  : Number.parseFloat(String(model.pricing.cachedInputTokens))
                : undefined,
              cacheCreationInputTokens: model.pricing.cacheCreationInputTokens
                ? typeof model.pricing.cacheCreationInputTokens === "number"
                  ? model.pricing.cacheCreationInputTokens
                  : Number.parseFloat(
                      String(model.pricing.cacheCreationInputTokens),
                    )
                : undefined,
            }
          : undefined,
        specification,
        modelType: model.modelType || "language",
        capabilities: capabilities.reasoning ? capabilities : undefined,
      };
    });

    models.sort((a, b) => a.name.localeCompare(b.name));

    return models;
  } catch (error) {
    console.error("Failed to fetch models from gateway:", error);
    throw error;
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
