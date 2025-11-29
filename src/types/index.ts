/**
 * Core type definitions for the Model Maze Race game
 *
 * @module types
 */

/**
 * Represents a cell type in the maze grid
 */
export type CellType = "wall" | "path" | "start" | "exit";

/**
 * Represents a position in the 2D maze grid
 *
 * @interface Position
 */
export interface Position {
  /** X coordinate (column) */
  x: number;
  /** Y coordinate (row) */
  y: number;
}

/**
 * Represents a single move direction
 */
export type Direction = "up" | "down" | "left" | "right";

/**
 * 2D grid representing the maze structure
 * First dimension is rows (y), second is columns (x)
 */
export type MazeGrid = CellType[][];

/**
 * Configuration for maze generation
 *
 * @interface MazeConfig
 */
export interface MazeConfig {
  /** Width of the maze in cells */
  width: number;
  /** Height of the maze in cells */
  height: number;
  /** Difficulty level affecting maze complexity */
  difficulty: "easy" | "medium" | "hard" | "expert";
}

/**
 * Visible area around a model (3x3 grid)
 * Represents what the AI model can see at its current position
 *
 * @interface VisibleArea
 */
export interface VisibleArea {
  /** 3x3 grid of cell types, with null for out-of-bounds cells */
  grid: (CellType | null)[][];
  /** Center position of the visible area */
  position: Position;
}

/**
 * Represents a single move in the history
 *
 * @interface MoveRecord
 */
export interface MoveRecord {
  /** Direction of the move */
  direction: Direction;
  /** Position after the move */
  position: Position;
  /** Timestamp when the move was made */
  timestamp: number;
  /** Whether the move was successful */
  success: boolean;
}

/**
 * Status of a racing model
 */
export type ModelStatus =
  | "waiting"
  | "racing"
  | "finished"
  | "stuck"
  | "timeout";

/**
 * Configuration for an AI model
 *
 * @interface ModelConfig
 */
export interface ModelConfig {
  /** Unique identifier for the model */
  id: string;
  /** Display name for the model */
  name: string;
  /** Color code for visual representation */
  color: string;
  /** Model string identifier (e.g., "openai/gpt-4o-mini") */
  modelString: string;
  /** Model capabilities */
  capabilities?: ModelCapabilities;
}

/**
 * Runtime state of a racing model
 *
 * @interface ModelState
 */
export interface ModelState {
  /** Model configuration */
  config: ModelConfig;
  /** Current position in the maze */
  position: Position;
  /** History of all moves made */
  moveHistory: MoveRecord[];
  /** Current status of the model */
  status: ModelStatus;
  /** Number of steps taken */
  stepCount: number;
  /** Total time spent in milliseconds */
  totalTime: number;
  /** Time taken for the last move in milliseconds */
  lastMoveTime: number;
  /** Array of all positions visited */
  pathTaken: Position[];
}

/**
 * Race configuration
 *
 * @interface RaceConfig
 */
export interface RaceConfig {
  /** Maximum number of turns before timeout */
  maxTurns: number;
  /** Array of models participating in the race */
  models: ModelConfig[];
  /** Maze generation configuration */
  mazeConfig: MazeConfig;
  /** Speed multiplier for race execution (1x, 5x, 10x, etc.) */
  speedMultiplier: number;
}

/**
 * Complete race state
 *
 * @interface RaceState
 */
export interface RaceState {
  /** The maze grid */
  maze: MazeGrid;
  /** Starting position */
  startPos: Position;
  /** Exit position */
  exitPos: Position;
  /** Array of model states */
  models: ModelState[];
  /** Whether the race is currently running */
  isRunning: boolean;
  /** Whether the race is paused */
  isPaused: boolean;
  /** Current step number */
  currentStep: number;
}

/**
 * Statistics for a completed race
 *
 * @interface RaceStats
 */
export interface RaceStats {
  /** Model identifier */
  modelId: string;
  /** Model display name */
  modelName: string;
  /** Number of steps taken */
  steps: number;
  /** Total time in milliseconds */
  time: number;
  /** Final status of the model */
  status: ModelStatus;
  /** Efficiency as percentage of optimal path (0-100) */
  efficiency: number;
}

/**
 * API Key configuration - supports OIDC, gateway API key, and provider-specific keys
 *
 * @interface ApiKeyConfig
 */
export interface ApiKeyConfig {
  /** Type of authentication method */
  type: "oidc" | "gateway" | "provider";
  /** OIDC access token (for Vercel Sign In) */
  oidcToken?: string;
  /** OIDC refresh token (for token refresh) */
  oidcRefreshToken?: string;
  /** Gateway API key (for unified gateway access) */
  gatewayKey?: string;
  /** Provider-specific API keys */
  providerKeys?: {
    openai?: string;
    anthropic?: string;
    xai?: string;
    google?: string;
    mistral?: string;
    deepseek?: string;
    groq?: string;
  };
}

/**
 * Settings stored in localStorage
 *
 * @interface AppSettings
 */
export interface AppSettings {
  /** API key configuration (optional) */
  apiKeyConfig?: ApiKeyConfig;
  /** Array of last selected model IDs */
  lastSelectedModels: string[];
  /** Total number of games played */
  gamesPlayed: number;
  /** Total race time in milliseconds */
  totalRaceTime: number;
  /** Whether debug mode is enabled */
  debugMode: boolean;
}

/**
 * Debug information for a model turn
 *
 * @interface DebugInfo
 */
export interface DebugInfo {
  /** Model identifier */
  modelId: string;
  /** Step number */
  step: number;
  /** Prompt sent to the model */
  prompt: string;
  /** Raw response from the model */
  response: string;
  /** Visible area at the time of the turn */
  visibleArea: VisibleArea;
  /** Timestamp of the turn */
  timestamp: number;
  /** Current position of the model */
  position: Position;
  /** Full path taken by the model so far */
  pathTaken: Position[];
  /** All valid moves available from current position */
  validMoves: Direction[];
  /** Unexplored directions from current position */
  unexploredDirections: Direction[];
}

/**
 * AI thinking status for live updates
 */
export type AIStatus = "idle" | "thinking" | "responding" | "complete";

/**
 * Chat message from an AI model
 *
 * @interface AIChatMessage
 */
export interface AIChatMessage {
  /** Model identifier */
  modelId: string;
  /** Timestamp of the message */
  timestamp: number;
  /** Current status of the AI */
  status: AIStatus;
  /** Optional prompt text */
  prompt?: string;
  /** Optional response text */
  response?: string;
  /** Optional reasoning text (for models that support reasoning) */
  reasoning?: string;
  /** Step number when this message was generated */
  stepNumber: number;
}

/**
 * Model capabilities from AI Gateway
 *
 * @interface ModelCapabilities
 */
export interface ModelCapabilities {
  /** Whether the model supports reasoning/thinking outputs */
  reasoning?: boolean;
}

/**
 * Model specification from AI Gateway
 *
 * @interface ModelSpecification
 */
export interface ModelSpecification {
  /** Specification version */
  specificationVersion?: string;
  /** Provider name (e.g., "openai", "anthropic") */
  provider?: string;
  /** Model ID from provider */
  modelId?: string;
}

/**
 * Available model information from AI Gateway
 *
 * @interface AvailableModel
 */
export interface AvailableModel {
  /** Model identifier (e.g., "openai/gpt-4o-mini") */
  id: string;
  /** Display name */
  name: string;
  /** Optional description */
  description?: string;
  /** Optional pricing information */
  pricing?: {
    /** Price per input token */
    input: number;
    /** Price per output token */
    output: number;
    /** Price per cached input token (if supported) */
    cachedInputTokens?: number;
    /** Price per cache creation input token (if supported) */
    cacheCreationInputTokens?: number;
  };
  /** Model specification details */
  specification?: ModelSpecification;
  /** Model type */
  modelType?: "language" | "embedding" | "image";
  /** Model capabilities */
  capabilities?: ModelCapabilities;
}
