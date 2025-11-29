# AI Model Communication Overview

This document explains how the Maze Race game communicates with AI models - what we send, what they see, and how responses flow back and forth.

## Table of Contents
- [Overview](#overview)
- [What We Send to AI Models](#what-we-send-to-ai-models)
- [What AI Models See](#what-ai-models-see)
- [How Messages Flow](#how-messages-flow)
- [JSON Examples](#json-examples)
- [Model Access & Authentication](#model-access--authentication)

---

## Overview

The game uses **Vercel AI Gateway** to communicate with AI models. Each model receives:
- A **text prompt** describing the maze situation
- Context about their position, history, and visible area
- Instructions on how to respond

Models respond with:
- A **single direction word**: `up`, `down`, `left`, or `right`
- (Optional) **Reasoning text** for models that support it (like DeepSeek R1)

---

## What We Send to AI Models

### The Prompt Structure

Every turn, we build a text prompt that includes:

1. **Goal**: "Navigate a maze to reach the exit"
2. **Current Step Number**: How many moves they've made
3. **Current Position**: Their X,Y coordinates
4. **Visible Area**: A 3×3 grid showing what they can see
5. **Path History**: Last 15 positions they've visited
6. **Recent Moves**: Last 10 directions they moved
7. **Warnings**: Loop detection, backtracking alerts
8. **Hints**: Unexplored directions, visited areas
9. **Instructions**: How to respond

### Example Prompt (What Gets Sent)

```
You are navigating a maze to reach the exit. Your goal is to reach the exit (E) in as few steps as possible.

You cannot see the entire maze, only your immediate 3×3 surroundings. You must use your memory of where you've been to navigate efficiently.

Current step: 5
Current position: (3, 4)

Your visible area (3×3 grid around you, you are in the center):
█ · █
V █ ·
? · E

Legend:
  █ = wall (cannot move here)
  · = open path
  S = start position
  E = exit (your goal!)
  ? = unknown (out of bounds or not visible)
  V = visited before (you've been here)
  V2, V3, etc. = visited multiple times (avoid revisiting)

Path History (last 15 positions):
- (1,1) (current)
- (2,1) (1 step ago)
- (3,1) (2 steps ago)
- (3,2) (3 steps ago)
- (3,3) (4 steps ago)
- (3,4) (5 steps ago)

Recent moves (last 10): right, right, down, down, down

⚠️ BACKTRACKING: You've returned to position (3,4) which you've visited 2 times. Consider exploring new areas.

From your current position, you've already explored:
- up: visited 1 time

💡 Unexplored directions from here: right, down. These lead to areas you haven't visited yet.

Available actions: up, down, left, right

IMPORTANT: 
- Avoid revisiting positions you've already explored (marked with V)
- Break any loops by trying unexplored directions
- Move towards the exit (E) when you can see it
- Explore systematically to avoid getting stuck

Respond with ONLY ONE WORD - the direction you want to move: up, down, left, or right.
```

---

## What AI Models See

### 1. Visible Area (3×3 Grid)

Models can only see a **3×3 grid** around their current position. They are always in the **center** of this grid.

**Symbols Used:**
- `█` = Wall (cannot move)
- `·` = Open path
- `S` = Start position
- `E` = Exit (goal)
- `?` = Unknown/out of bounds
- `V` = Visited once before
- `V2`, `V3`, etc. = Visited multiple times

**Example Visible Area:**
```
█ · █
V █ ·
? · E
```

This means:
- Top row: wall, path, wall
- Middle row: visited cell, wall, path
- Bottom row: unknown, path, exit

### 2. Path History

Models see the **last 15 positions** they've visited, with visit counts:

```
- (1,1) (current)
- (2,1) (1 step ago)
- (3,1) (2 steps ago)
- (3,2) visited 2 times (3 steps ago)
```

### 3. Move History

Models see their **last 10 moves**:
```
Recent moves: right, right, down, down, down, left, up, right, down, left
```

### 4. Warnings & Hints

**Loop Detection:**
```
⚠️ LOOP DETECTED: You've been repeating a pattern in your recent moves. Try a different direction to break the cycle.
```

**Backtracking Alert:**
```
⚠️ BACKTRACKING: You've returned to position (3,4) which you've visited 2 times. Consider exploring new areas.
```

**Unexplored Directions:**
```
💡 Unexplored directions from here: right, down. These lead to areas you haven't visited yet.
```

---

## How Messages Flow

### Step-by-Step Communication Flow

```
1. Game State → Build Prompt
   ↓
2. Send Prompt to AI Gateway
   ↓
3. AI Gateway → AI Model Provider (OpenAI, Anthropic, etc.)
   ↓
4. AI Model Processes & Responds
   ↓
5. Response Flows Back Through Gateway
   ↓
6. Parse Response → Extract Direction
   ↓
7. Update Game State → Move Model
   ↓
8. Repeat for Next Turn
```

### Detailed Flow Diagram

```
┌─────────────────┐
│  Game State     │
│  - Position     │
│  - History      │
│  - Visible Area │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  createMovePrompt() │
│  Builds text prompt │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  requestModelMove() │
│  Sends to Gateway   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  AI Gateway     │
│  Routes request │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  AI Model       │
│  (GPT-4, Claude,│
│   DeepSeek, etc)│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Response       │
│  "right"        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  parseDirection │
│  Extract "right"│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Update Position│
│  Move model     │
└─────────────────┘
```

### For Reasoning Models (DeepSeek R1, Claude Sonnet 4, etc.)

Some models support **reasoning** - they show their thinking process:

```
1. Model receives prompt
   ↓
2. Model "thinks" (reasoning stream)
   → "I can see the exit to the right. I should move right."
   ↓
3. Model responds (text stream)
   → "right"
   ↓
4. Both reasoning and response are captured
```

---

## JSON Examples

### Example 1: What We Send to the AI Gateway

```json
{
  "model": "openai/gpt-4o-mini",
  "prompt": "You are navigating a maze...\n[full prompt text here]",
  "temperature": 0.7,
  "maxTokens": 10
}
```

**Actual API Call:**
```javascript
const result = await generateText({
  model: "openai/gpt-4o-mini",
  prompt: "You are navigating a maze...",
  temperature: 0.7,
  maxTokens: 10
});
```

### Example 2: Visible Area Data Structure

```json
{
  "visible": {
    "grid": [
      ["wall", "path", "wall"],
      ["path", "path", "path"],
      ["null", "path", "exit"]
    ],
    "position": {
      "x": 3,
      "y": 4
    }
  }
}
```

**What the model sees (formatted):**
```
█ · █
· · ·
? · E
```

### Example 3: Path History Data

```json
{
  "pathTaken": [
    { "x": 1, "y": 1 },
    { "x": 2, "y": 1 },
    { "x": 3, "y": 1 },
    { "x": 3, "y": 2 },
    { "x": 3, "y": 3 },
    { "x": 3, "y": 4 }
  ],
  "currentPosition": { "x": 3, "y": 4 },
  "moveHistory": [
    { "direction": "right", "position": { "x": 2, "y": 1 }, "success": true },
    { "direction": "right", "position": { "x": 3, "y": 1 }, "success": true },
    { "direction": "down", "position": { "x": 3, "y": 2 }, "success": true },
    { "direction": "down", "position": { "x": 3, "y": 3 }, "success": true },
    { "direction": "down", "position": { "x": 3, "y": 4 }, "success": true }
  ]
}
```

### Example 4: Model Response (Simple Model)

```json
{
  "text": "right",
  "usage": {
    "promptTokens": 450,
    "completionTokens": 1,
    "totalTokens": 451
  }
}
```

**What we extract:**
```javascript
const direction = parseDirectionFromResponse("right");
// Returns: "right"
```

### Example 5: Model Response (Reasoning Model)

```json
{
  "text": "right",
  "reasoning": "I can see the exit (E) is to the right. I should move right to reach it.",
  "usage": {
    "promptTokens": 450,
    "completionTokens": 1,
    "reasoningTokens": 25,
    "totalTokens": 476
  }
}
```

**Streaming Response (for reasoning models):**

```json
// Part 1: Reasoning starts
{
  "type": "reasoning-delta",
  "text": "I can see the exit"
}

// Part 2: More reasoning
{
  "type": "reasoning-delta",
  "text": " is to the right."
}

// Part 3: Response starts
{
  "type": "text-delta",
  "text": "right"
}

// Final result
{
  "direction": "right",
  "rawResponse": "right",
  "reasoning": "I can see the exit is to the right.",
  "prompt": "[full prompt text]"
}
```

### Example 6: Complete Request/Response Cycle

**Request:**
```json
{
  "modelString": "openai/gpt-4o-mini",
  "visible": {
    "grid": [
      ["wall", "path", "wall"],
      ["path", "path", "path"],
      ["null", "path", "exit"]
    ],
    "position": { "x": 3, "y": 4 }
  },
  "moveHistory": ["right", "right", "down", "down", "down"],
  "stepCount": 5,
  "pathTaken": [
    { "x": 1, "y": 1 },
    { "x": 2, "y": 1 },
    { "x": 3, "y": 1 },
    { "x": 3, "y": 2 },
    { "x": 3, "y": 3 },
    { "x": 3, "y": 4 }
  ],
  "currentPosition": { "x": 3, "y": 4 }
}
```

**Response:**
```json
{
  "direction": "right",
  "rawResponse": "right",
  "prompt": "You are navigating a maze...\n[full prompt]"
}
```

**After Processing:**
```json
{
  "modelState": {
    "position": { "x": 4, "y": 4 },
    "stepCount": 6,
    "moveHistory": [
      // ... previous moves
      { "direction": "right", "position": { "x": 4, "y": 4 }, "success": true }
    ],
    "pathTaken": [
      // ... previous positions
      { "x": 4, "y": 4 }
    ]
  }
}
```

### Example 7: Chat Message Structure

```json
{
  "modelId": "model-1",
  "timestamp": 1704067200000,
  "status": "complete",
  "response": "right",
  "reasoning": "I can see the exit is to the right. Moving right will get me closer.",
  "stepNumber": 5
}
```

**Status Flow:**
```json
// Step 1: Thinking
{
  "modelId": "model-1",
  "status": "thinking",
  "stepNumber": 5
}

// Step 2: Reasoning (if supported)
{
  "modelId": "model-1",
  "status": "thinking",
  "reasoning": "I can see the exit...",
  "stepNumber": 5
}

// Step 3: Responding
{
  "modelId": "model-1",
  "status": "responding",
  "response": "right",
  "stepNumber": 5
}

// Step 4: Complete
{
  "modelId": "model-1",
  "status": "complete",
  "response": "right",
  "reasoning": "I can see the exit is to the right.",
  "stepNumber": 5
}
```

---

## Model Access & Authentication

### Authentication Methods

The game supports three authentication methods:

#### 1. OIDC (Vercel Sign In)
```json
{
  "type": "oidc",
  "oidcToken": "eyJhbGciOiJSUzI1NiIs...",
  "oidcRefreshToken": "refresh_token_here"
}
```

**How it works:**
- User signs in with Vercel
- Gets OIDC token automatically
- Token used for AI Gateway requests
- No API key needed

#### 2. Gateway API Key
```json
{
  "type": "gateway",
  "gatewayKey": "your-gateway-api-key"
}
```

**How it works:**
- User provides Vercel AI Gateway API key
- Used for all model requests
- Works with all providers

#### 3. Provider-Specific Keys
```json
{
  "type": "provider",
  "providerKeys": {
    "openai": "sk-...",
    "anthropic": "sk-ant-...",
    "xai": "xai-...",
    "google": "...",
    "mistral": "...",
    "deepseek": "...",
    "grok": "..."
  }
}
```

**How it works:**
- User provides keys for specific providers
- Game uses appropriate key based on model
- Example: `openai/gpt-4o` uses `providerKeys.openai`

### API Request Headers

**With OIDC:**
```http
POST https://ai-gateway.vercel.sh/v1/ai/generate
Authorization: Bearer <oidc-token>
Content-Type: application/json
```

**With Gateway Key:**
```http
POST https://ai-gateway.vercel.sh/v1/ai/generate
Authorization: Bearer <gateway-key>
Content-Type: application/json
```

**With Provider Key:**
```http
POST https://ai-gateway.vercel.sh/v1/ai/generate
Authorization: Bearer <provider-key>
Content-Type: application/json
```

### Model Selection

Models are identified by a **model string**:
- `openai/gpt-4o-mini`
- `anthropic/claude-sonnet-4`
- `deepseek/deepseek-r1`
- `xai/grok-2`
- `google/gemini-2.0-flash`

**Format:** `provider/model-name`

---

## Summary

### What Models Receive:
1. ✅ Text prompt with full context
2. ✅ Visible 3×3 area around them
3. ✅ Path history (last 15 positions)
4. ✅ Move history (last 10 moves)
5. ✅ Warnings (loops, backtracking)
6. ✅ Hints (unexplored directions)

### What Models Respond With:
1. ✅ Single direction word: `up`, `down`, `left`, or `right`
2. ✅ (Optional) Reasoning text for thinking models

### How It Works:
1. Game builds prompt from current state
2. Prompt sent to AI Gateway
3. Gateway routes to model provider
4. Model processes and responds
5. Response parsed to extract direction
6. Model moves in maze
7. Process repeats for next turn

### Key Points:
- Models see **limited information** (3×3 grid only)
- Models must use **memory** (path history) to navigate
- Responses are **simple** (one word)
- **Reasoning models** show their thinking process
- Authentication supports **OIDC, Gateway, or Provider keys**

---

## Code References

- **Prompt Creation**: `src/lib/ai.ts` → `createMovePrompt()`
- **Model Request**: `src/lib/ai.ts` → `requestModelMove()`
- **Response Parsing**: `src/lib/ai.ts` → `parseDirectionFromResponse()`
- **Race Execution**: `src/hooks/use-model-runner.ts` → `executeModelTurn()`
- **Visible Area**: `src/lib/maze.ts` → `getVisibleArea()` and `formatVisibleAreaForPrompt()`

