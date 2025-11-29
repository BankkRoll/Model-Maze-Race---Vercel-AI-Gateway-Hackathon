/**
 * About page - Technical documentation and whitepaper
 * Explains the architecture, algorithms, and AI integration
 *
 * @module AboutPage
 */

import { Header } from "@/components/shared/header";
import { Separator } from "@/components/ui/separator";

/**
 * About page component
 * Provides comprehensive technical documentation
 *
 * @returns AboutPage JSX element
 */
export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <article className="max-w-none">
          <header className="mb-12 text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold text-primary mb-4">
              Model Maze Race
            </h1>
            <p className="text-xl text-muted-foreground">
              Technical Whitepaper & Implementation Guide
            </p>
            <p className="text-muted-foreground text-sm">
              A comprehensive deep-dive into the algorithms, AI integration, and
              technical architecture behind autonomous maze racing simulations.
            </p>
          </header>

          <div className="space-y-12">
            <section>
              <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">
                Introduction
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Model Maze Race is an autonomous simulation platform where
                multiple AI models compete head-to-head to navigate procedurally
                generated mazes. Each model operates independently with limited
                visibility—seeing only a 3×3 grid around their current
                position—making navigation a true test of spatial reasoning,
                memory, and decision-making under uncertainty.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-4">
                The system is built on Next.js 16 with React 19, leveraging
                Vercel's AI Gateway to access 150+ language models. Models
                receive structured text prompts containing their visible area,
                movement history, and contextual warnings, then respond with
                directional moves that are validated and executed in real-time.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                This document provides a comprehensive technical overview of the
                maze generation algorithms, AI prompt engineering, response
                verification, race execution logic, and the complete data flow
                between the client, AI Gateway, and language models.
              </p>
            </section>

            <Separator />

            <section>
              <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">
                Maze Generation Algorithm
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                The foundation of Model Maze Race lies in its maze generation
                system, which uses a modified Recursive Backtracking algorithm
                to create solvable mazes with guaranteed paths from start to
                exit.
              </p>

              <h3 className="text-xl sm:text-2xl font-semibold mt-4 sm:mt-6 mb-2 sm:mb-3">
                Recursive Backtracking Implementation
              </h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                The algorithm begins with a grid filled entirely with walls. The
                start position is fixed at (1, 1) and the exit at (width-2,
                height-2), ensuring they're always on valid path cells. The
                generation process uses a stack-based depth-first approach:
              </p>

              <ol className="list-decimal list-inside space-y-3 text-muted-foreground mb-6 ml-4">
                <li>
                  Initialize the grid with walls, set start and exit positions
                </li>
                <li>
                  Begin at the start position, mark as visited, push to stack
                </li>
                <li>
                  Find unvisited neighbors exactly 2 cells away (leaving walls
                  between paths)
                </li>
                <li>Randomly select a neighbor, carve a path to it</li>
                <li>Mark the new cell as visited, push to stack, repeat</li>
                <li>If no neighbors exist, backtrack by popping from stack</li>
                <li>Continue until stack is empty (all cells processed)</li>
              </ol>

              <div className="bg-muted/50 border border-border rounded-lg p-3 sm:p-4 mb-6 overflow-hidden">
                <pre className="text-xs sm:text-sm overflow-x-auto overflow-y-visible">
                  <code className="block whitespace-pre">{`function generateMaze(config) {
  const maze = Array(height).fill(null)
    .map(() => Array(width).fill("wall"));
  
  maze[1][1] = "start";
  maze[height-2][width-2] = "exit";
  
  const stack = [{x: 1, y: 1}];
  const visited = new Set();
  
  while (stack.length > 0) {
    const current = stack[stack.length - 1];
    const neighbors = getUnvisitedNeighbors(current, 2);
    
    if (neighbors.length === 0) {
      stack.pop(); // Backtrack
      continue;
    }
    
    const next = randomNeighbor(neighbors);
    carvePath(current, next); // Remove wall between
    visited.add(\`\${next.x},\${next.y}\`);
    stack.push(next);
  }
  
  addComplexity(maze, config.difficulty);
  return { maze, start, exit };
}`}</code>
                </pre>
              </div>

              <div className="mt-4 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                <p className="text-xs font-medium text-primary mb-1">
                  💡 Why 2 Cells Away?
                </p>
                <p className="text-xs text-muted-foreground">
                  By checking neighbors 2 cells away instead of 1, the algorithm
                  ensures walls remain between paths, creating proper maze
                  structure. This prevents wide hallways and maintains the
                  single-cell path width constraint.
                </p>
              </div>

              <h3 className="text-xl sm:text-2xl font-semibold mt-4 sm:mt-6 mb-2 sm:mb-3">
                Difficulty-Based Complexity
              </h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                After the base maze is generated, additional walls are removed
                based on the selected difficulty level to create alternative
                routes:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-6 ml-4">
                <li>
                  <strong>Easy:</strong> 15-20% additional paths removed,
                  creating multiple viable routes
                </li>
                <li>
                  <strong>Medium:</strong> 10-15% additional paths, balanced
                  complexity
                </li>
                <li>
                  <strong>Hard:</strong> 5-10% additional paths, fewer
                  alternative routes
                </li>
                <li>
                  <strong>Expert:</strong> 0-5% additional paths, primarily
                  single optimal route
                </li>
              </ul>

              <h3 className="text-xl sm:text-2xl font-semibold mt-4 sm:mt-6 mb-2 sm:mb-3">
                Pathfinding & Verification
              </h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                The system uses multiple pathfinding algorithms to analyze
                generated mazes:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-6 ml-4">
                <li>
                  <strong>Depth-First Search (DFS):</strong> Finds all possible
                  paths from start to exit for visualization and analysis
                </li>
                <li>
                  <strong>Breadth-First Search (BFS):</strong> Calculates the
                  optimal shortest path length for performance comparison
                </li>
                <li>
                  <strong>Jaccard Similarity:</strong> Measures path uniqueness
                  when generating multiple paths, ensuring variety in route
                  selection
                </li>
              </ul>
            </section>

            <Separator />

            <section>
              <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">
                AI Prompt Structure & Data Transmission
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Each turn, the system constructs a comprehensive text prompt
                that provides the AI model with all necessary context to make an
                informed decision. The prompt is engineered to balance
                information density with clarity, ensuring models can
                effectively navigate despite limited visibility.
              </p>

              <h3 className="text-xl sm:text-2xl font-semibold mt-4 sm:mt-6 mb-2 sm:mb-3">
                Prompt Components
              </h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Every prompt sent to an AI model contains the following
                structured information:
              </p>

              <div className="space-y-4 mb-6">
                <div className="bg-muted/50 border border-border rounded-lg p-4">
                  <h4 className="font-semibold mb-2">1. Goal & Instructions</h4>
                  <p className="text-sm text-muted-foreground">
                    Clear objective statement: "Navigate a maze to reach the
                    exit (E) in as few steps as possible." Includes constraints
                    about limited visibility and the need to rely on memory.
                  </p>
                </div>

                <div className="bg-muted/50 border border-border rounded-lg p-4">
                  <h4 className="font-semibold mb-2">2. Current State</h4>
                  <p className="text-sm text-muted-foreground">
                    Step number (how many moves made), current position as (x,
                    y) coordinates. This provides temporal and spatial context.
                  </p>
                </div>

                <div className="bg-muted/50 border border-border rounded-lg p-4 sm:p-6">
                  <h4 className="font-semibold text-base sm:text-lg mb-3 sm:mb-4">
                    3. Visible Area (3×3 Grid)
                  </h4>
                  <p className="text-muted-foreground mb-4 leading-relaxed">
                    The most critical piece of information: a 3×3 grid showing
                    exactly what the model can see from its current position.
                    The model is always at the
                    <strong className="text-foreground"> center</strong> of this
                    grid, with the surrounding 8 cells representing what's
                    immediately adjacent.
                  </p>

                  <div className="mb-4">
                    <p className="text-sm font-medium mb-3 text-foreground">
                      How It Works:
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground ml-2">
                      <li>
                        The system calculates a 3×3 view centered on the model's
                        current position
                      </li>
                      <li>
                        Each cell shows its type (wall, path, start, exit) or if
                        it's been visited before
                      </li>
                      <li>
                        Out-of-bounds cells (at maze edges) are marked as
                        "unknown" (?)
                      </li>
                      <li>
                        Previously visited cells are marked with "V" (once) or
                        "V2", "V3", etc. (multiple visits)
                      </li>
                    </ul>
                  </div>

                  <div className="bg-background border border-border rounded-lg p-3 sm:p-4 mb-3 sm:mb-4">
                    <p className="text-xs font-medium text-muted-foreground mb-2 sm:mb-3 uppercase tracking-wide">
                      Example Visible Area
                    </p>
                    <div className="grid grid-cols-3 gap-1 max-w-[140px] sm:max-w-[160px] md:max-w-[180px] mx-auto mb-3">
                      {[
                        ["█", "wall"],
                        ["·", "path"],
                        ["█", "wall"],
                        ["V", "visited"],
                        ["·", "path", true],
                        ["█", "wall"],
                        ["█", "wall"],
                        ["·", "path"],
                        ["E", "exit"],
                      ].map(([symbol, type, isCenter], idx) => (
                        <div
                          key={idx}
                          className={`
                            aspect-square flex items-center justify-center text-xs sm:text-sm font-mono
                            rounded border-2 relative
                            ${
                              type === "wall"
                                ? "bg-muted border-border text-muted-foreground"
                                : type === "path"
                                  ? isCenter
                                    ? "bg-primary/20 border-primary text-primary font-semibold"
                                    : "bg-background border-border text-foreground"
                                  : type === "visited"
                                    ? "bg-primary/10 border-primary/30 text-primary font-semibold"
                                    : type === "exit"
                                      ? "bg-chart-1/20 border-chart-1/40 text-chart-1 font-bold"
                                      : "bg-muted/50 border-border text-muted-foreground"
                            }
                          `}
                        >
                          {symbol}
                          {isCenter && (
                            <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full border border-background" />
                          )}
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-center text-muted-foreground space-y-1">
                      <span className="block">
                        Center cell (highlighted) = your current position
                      </span>
                      <span className="block">
                        Paths only connect in cardinal directions
                        (up/down/left/right)
                      </span>
                      <span className="block">
                        Diagonals are walls; exit visible bottom
                      </span>
                    </p>
                  </div>

                  <div className="bg-background border border-border rounded-lg p-3 sm:p-4">
                    <p className="text-xs font-medium text-muted-foreground mb-2 sm:mb-3 uppercase tracking-wide">
                      ASCII Representation (What AI Sees)
                    </p>
                    <pre className="text-xs sm:text-sm bg-muted/50 p-2 sm:p-3 rounded font-mono text-center overflow-x-auto overflow-y-visible">
                      <code className="block whitespace-pre">{`█ · █
V · █
█ · E`}</code>
                    </pre>
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono">█</span>
                          <span className="text-muted-foreground">
                            Wall (blocked)
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono">·</span>
                          <span className="text-muted-foreground">
                            Open path
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono">S</span>
                          <span className="text-muted-foreground">
                            Start position
                          </span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono">E</span>
                          <span className="text-muted-foreground">
                            Exit (goal)
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono">?</span>
                          <span className="text-muted-foreground">
                            Unknown/out of bounds
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono">V</span>
                          <span className="text-muted-foreground">
                            Visited (avoid revisiting)
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                    <p className="text-xs font-medium text-primary mb-1">
                      💡 Key Insight
                    </p>
                    <p className="text-xs text-muted-foreground">
                      The model must use this limited 3×3 view combined with
                      memory of past positions to build a mental map of the
                      maze. This constraint makes navigation a true test of
                      spatial reasoning and memory.
                    </p>
                  </div>
                </div>

                <div className="bg-muted/50 border border-border rounded-lg p-4 sm:p-6">
                  <h4 className="font-semibold text-base sm:text-lg mb-3 sm:mb-4">
                    4. Path History (Last 15 Positions)
                  </h4>
                  <p className="text-muted-foreground mb-4 leading-relaxed">
                    A chronological record of where the model has been,
                    providing essential context for decision-making. This
                    history helps models avoid revisiting areas and understand
                    their exploration progress.
                  </p>

                  <div className="mb-4">
                    <p className="text-sm font-medium mb-3 text-foreground">
                      What's Included:
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground ml-2">
                      <li>
                        The last 15 positions visited, listed from most recent
                        to oldest
                      </li>
                      <li>
                        Each position shows (x, y) coordinates and how many
                        steps ago it was visited
                      </li>
                      <li>
                        Positions visited multiple times are marked with visit
                        counts
                      </li>
                      <li>
                        Temporal markers like "(current)", "(1 step ago)", "(2
                        steps ago)" provide context
                      </li>
                    </ul>
                  </div>

                  <div className="bg-background border border-border rounded-lg p-3 sm:p-4 mb-3 sm:mb-4">
                    <p className="text-xs font-medium text-muted-foreground mb-2 sm:mb-3 uppercase tracking-wide">
                      Example Path History
                    </p>
                    <div className="space-y-2">
                      {[
                        { pos: "(3, 4)", time: "current", visits: 1 },
                        { pos: "(3, 3)", time: "1 step ago", visits: 1 },
                        { pos: "(2, 3)", time: "2 steps ago", visits: 1 },
                        { pos: "(2, 4)", time: "3 steps ago", visits: 2 },
                        { pos: "(1, 4)", time: "4 steps ago", visits: 1 },
                      ].map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2 rounded bg-muted/30 border border-border/50"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-mono font-semibold text-foreground w-16">
                              {item.pos}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {item.time}
                            </span>
                          </div>
                          {item.visits > 1 && (
                            <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary font-medium">
                              visited {item.visits}×
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-background border border-border rounded-lg p-3 sm:p-4">
                    <p className="text-xs font-medium text-muted-foreground mb-2 sm:mb-3 uppercase tracking-wide">
                      Text Format (What AI Sees)
                    </p>
                    <pre className="text-xs sm:text-sm bg-muted/50 p-2 sm:p-3 rounded font-mono overflow-x-auto overflow-y-visible">
                      <code className="block whitespace-pre">{`- (3,4) (current)
- (3,3) (1 step ago)
- (2,3) (2 steps ago)
- (2,4) - visited 2 times (3 steps ago)
- (1,4) (4 steps ago)
- (1,3) (5 steps ago)
- (1,2) (6 steps ago)
...`}</code>
                    </pre>
                  </div>

                  <div className="mt-4 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                    <p className="text-xs font-medium text-primary mb-1">
                      💡 Why This Matters
                    </p>
                    <p className="text-xs text-muted-foreground">
                      By tracking where they've been, models can identify
                      backtracking, detect loops, and make informed decisions
                      about which directions to explore. The visit count helps
                      models understand when they're repeatedly visiting the
                      same area.
                    </p>
                  </div>
                </div>

                <div className="bg-muted/50 border border-border rounded-lg p-4 sm:p-6">
                  <h4 className="font-semibold text-base sm:text-lg mb-3 sm:mb-4">
                    5. Recent Moves (Last 10)
                  </h4>
                  <p className="text-muted-foreground mb-4 leading-relaxed">
                    A sequence of the last 10 directional moves made by the
                    model. This history enables the system to detect repeating
                    patterns (loops) and helps models understand their recent
                    navigation behavior.
                  </p>

                  <div className="mb-4">
                    <p className="text-sm font-medium mb-3 text-foreground">
                      Format & Purpose:
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground ml-2">
                      <li>
                        Comma-separated list of directions: "up, right, down,
                        left, up, right, ..."
                      </li>
                      <li>
                        Only the most recent 10 moves are included to keep
                        prompts concise
                      </li>
                      <li>
                        Used by the system to detect loops (repeating patterns
                        like "up, right, down, left" repeated)
                      </li>
                      <li>
                        Helps models recognize when they're stuck in a cycle
                      </li>
                    </ul>
                  </div>

                  <div className="bg-background border border-border rounded-lg p-3 sm:p-4 mb-3 sm:mb-4">
                    <p className="text-xs font-medium text-muted-foreground mb-2 sm:mb-3 uppercase tracking-wide">
                      Example Move History
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {[
                        "up",
                        "right",
                        "down",
                        "left",
                        "up",
                        "right",
                        "down",
                        "left",
                      ].map((move, idx) => (
                        <div
                          key={idx}
                          className="px-3 py-1.5 rounded bg-primary/10 border border-primary/20 text-primary text-xs font-medium font-mono"
                        >
                          {move}
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-3 text-center">
                      Text format: "up, right, down, left, up, right, down,
                      left"
                    </p>
                  </div>

                  <div className="mt-4 p-3 bg-destructive/5 border border-destructive/20 rounded-lg">
                    <p className="text-xs font-medium text-destructive mb-1">
                      ⚠️ Loop Detection
                    </p>
                    <p className="text-xs text-muted-foreground">
                      When the system detects a repeating pattern in the last 8
                      moves, it generates a warning: "⚠️ LOOP DETECTED: You've
                      been repeating a pattern in your recent moves. Try a
                      different direction to break the cycle."
                    </p>
                  </div>
                </div>

                <div className="bg-muted/50 border border-border rounded-lg p-4">
                  <h4 className="font-semibold mb-2">
                    6. Intelligent Warnings
                  </h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    System-generated alerts based on behavior analysis:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                    <li>
                      <strong>Loop Detection:</strong> "⚠️ LOOP DETECTED: You've
                      been repeating a pattern in your recent moves."
                    </li>
                    <li>
                      <strong>Backtracking:</strong> "⚠️ BACKTRACKING: You've
                      returned to position (x,y) which you've visited N times."
                    </li>
                  </ul>
                </div>

                <div className="bg-muted/50 border border-border rounded-lg p-4">
                  <h4 className="font-semibold mb-2">7. Contextual Hints</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Proactive suggestions to guide exploration:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                    <li>
                      Explored directions from current position with visit
                      counts
                    </li>
                    <li>
                      Unexplored directions: "💡 Unexplored directions from
                      here: up, right"
                    </li>
                  </ul>
                </div>
              </div>

              <h3 className="text-xl sm:text-2xl font-semibold mt-4 sm:mt-6 mb-2 sm:mb-3">
                Complete Example Prompt
              </h3>
              <div className="bg-muted/50 border border-border rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 overflow-hidden">
                <pre className="text-xs sm:text-sm overflow-x-auto overflow-y-visible">
                  <code className="block whitespace-pre">{`You are navigating a maze to reach the exit. Your goal is to reach the exit (E) in as few steps as possible.

You cannot see the entire maze, only your immediate 3×3 surroundings. You must use your memory of where you've been to navigate efficiently.

Current step: 5
Current position: (3, 4)

Your visible area (3×3 grid around you, you are in the center):
█ · █
V · █
█ · E

Legend:
  █ = wall (cannot move here)
  · = open path
  S = start position
  E = exit (your goal!)
  ? = unknown (out of bounds or not visible)
  V = visited before (you've been here)
  V2, V3, etc. = visited multiple times (avoid revisiting)

Path History (last 15 positions):
- (3,4) (current)
- (3,3) (1 step ago)
- (2,3) (2 steps ago)
- (2,4) - visited 2 times (3 steps ago)
- (1,4) (4 steps ago)

Recent moves (last 10): up, right, down, left, up

⚠️ LOOP DETECTED: You've been repeating a pattern in your recent moves. Try a different direction to break the cycle.

⚠️ BACKTRACKING: You've returned to position (3,4) which you've visited 2 times. Consider exploring new areas.

From your current position, you've already explored:
- up: visited 1 time
- left: visited 2 times

💡 Unexplored directions from here: right, down. These lead to areas you haven't visited yet.

Available actions: up, down, left, right

IMPORTANT: 
- Avoid revisiting positions you've already explored (marked with V)
- Break any loops by trying unexplored directions
- Move towards the exit (E) when you can see it
- Explore systematically to avoid getting stuck

Respond with ONLY ONE WORD - the direction you want to move: up, down, left, or right.`}</code>
                </pre>
              </div>

              <h3 className="text-xl sm:text-2xl font-semibold mt-4 sm:mt-6 mb-2 sm:mb-3">
                How Past Steps Are Included
              </h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                The system maintains comprehensive state for each model, which
                is selectively included in prompts to balance context with token
                efficiency:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-6 ml-4">
                <li>
                  <strong>Path History:</strong> The last 15 positions from the{" "}
                  <code className="bg-muted px-1 rounded text-xs">
                    pathTaken
                  </code>{" "}
                  array are included, showing coordinates, visit counts, and
                  temporal markers
                </li>
                <li>
                  <strong>Move History:</strong> The last 10 directions from{" "}
                  <code className="bg-muted px-1 rounded text-xs">
                    moveHistory
                  </code>{" "}
                  are included as a comma-separated list
                </li>
                <li>
                  <strong>Visit Tracking:</strong> Each cell in the visible area
                  is analyzed against the full path history to mark visited
                  cells with "V" or "V2", "V3" for multiple visits
                </li>
                <li>
                  <strong>Pattern Analysis:</strong> The system analyzes the
                  full move history to detect repeating patterns (loops) and
                  revisiting behavior (backtracking), then includes contextual
                  warnings
                </li>
                <li>
                  <strong>Performance Optimization:</strong> While the full path
                  history is maintained internally, only the last 200 positions
                  are analyzed for prompt generation to prevent token bloat
                </li>
              </ul>

              <div className="mt-4 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                <p className="text-xs font-medium text-primary mb-1">
                  💡 Token Efficiency
                </p>
                <p className="text-xs text-muted-foreground">
                  Limiting history to the last 15 positions and 10 moves keeps
                  prompts concise while maintaining sufficient context. The
                  system analyzes up to 200 positions internally for visit
                  tracking, but only includes the most relevant recent history
                  in prompts.
                </p>
              </div>
            </section>

            <Separator />

            <section>
              <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">
                Response Verification & Validation
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                When AI models respond, the system performs multiple layers of
                validation to ensure moves are valid, safe, and executable. This
                verification process is critical for maintaining race integrity
                and preventing invalid state transitions.
              </p>

              <h3 className="text-xl sm:text-2xl font-semibold mt-4 sm:mt-6 mb-2 sm:mb-3">
                Response Parsing
              </h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Models respond with natural language text, which must be parsed
                to extract a valid direction. The parsing algorithm uses a
                multi-stage approach:
              </p>

              <div className="bg-muted/50 border border-border rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 overflow-hidden">
                <pre className="text-xs sm:text-sm overflow-x-auto overflow-y-visible">
                  <code className="block whitespace-pre">{`function parseDirectionFromResponse(response: string): Direction | null {
  const cleaned = response.toLowerCase().trim();
  
  if (["up", "down", "left", "right"].includes(cleaned)) {
    return cleaned as Direction;
  }
  
  if (cleaned.includes("up")) return "up";
  if (cleaned.includes("down")) return "down";
  if (cleaned.includes("left")) return "left";
  if (cleaned.includes("right")) return "right";
  
  return null;
}`}</code>
                </pre>
              </div>

              <h3 className="text-xl sm:text-2xl font-semibold mt-4 sm:mt-6 mb-2 sm:mb-3">
                Move Validation
              </h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                After parsing, the system validates that the move is physically
                possible within the maze constraints:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-6 ml-4">
                <li>
                  <strong>Boundary Check:</strong> Verifies the target position
                  is within maze bounds (0 ≤ x &lt; width, 0 ≤ y &lt; height)
                </li>
                <li>
                  <strong>Wall Collision:</strong> Ensures the target cell is
                  not a wall (must be "path", "start", or "exit")
                </li>
                <li>
                  <strong>Adjacency Check:</strong> Validates that the move is
                  to an adjacent cell (exactly 1 cell away in a cardinal
                  direction)
                </li>
                <li>
                  <strong>State Consistency:</strong> Verifies the model's
                  current position matches the expected state before applying
                  the move
                </li>
              </ul>

              <h3 className="text-xl sm:text-2xl font-semibold mt-4 sm:mt-6 mb-2 sm:mb-3">
                Error Handling & Recovery
              </h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                When validation fails or models return invalid responses, the
                system implements graceful degradation:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-6 ml-4">
                <li>
                  <strong>Invalid Direction:</strong> If parsing returns null,
                  the model is marked as "stuck" and removed from active racing
                </li>
                <li>
                  <strong>Invalid Move:</strong> If validation fails, the move
                  is rejected, the model remains at its current position, and
                  the status is updated to "stuck"
                </li>
                <li>
                  <strong>API Errors:</strong> Network failures or API errors
                  are caught, logged, and the model is marked as "timeout" or
                  "error" depending on the failure type
                </li>
                <li>
                  <strong>Race Continuity:</strong> Other models continue racing
                  independently, ensuring one model's failure doesn't affect
                  others
                </li>
              </ul>

              <div className="mt-4 p-3 bg-destructive/5 border border-destructive/20 rounded-lg">
                <p className="text-xs font-medium text-destructive mb-1">
                  ⚠️ Graceful Degradation
                </p>
                <p className="text-xs text-muted-foreground">
                  When a model fails to provide a valid move, it's marked as
                  "stuck" but the race continues for other models. This ensures
                  one model's failure doesn't crash the entire race, maintaining
                  system stability.
                </p>
              </div>

              <h3 className="text-xl sm:text-2xl font-semibold mt-4 sm:mt-6 mb-2 sm:mb-3">
                Reasoning Model Support
              </h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                For models that support reasoning (DeepSeek R1, Claude Sonnet 4,
                GPT-o1, etc.), the system streams both reasoning text and the
                final response:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-6 ml-4">
                <li>
                  <strong>Dual Streaming:</strong> Reasoning tokens and response
                  tokens are streamed separately, allowing real-time display of
                  the model's thought process
                </li>
                <li>
                  <strong>Response Extraction:</strong> Only the final response
                  text is used for direction parsing; reasoning is displayed for
                  transparency but doesn't affect move execution
                </li>
                <li>
                  <strong>Status Updates:</strong> The system provides real-time
                  status updates: "thinking" → "responding" → "complete", with
                  optional reasoning text displayed in the UI
                </li>
              </ul>
            </section>

            <Separator />

            <section>
              <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">
                Race Execution Logic
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                The race execution system manages parallel model execution,
                state synchronization, and performance optimization. All models
                operate independently but are processed in synchronized turns,
                creating a fair competitive environment.
              </p>

              <h3 className="text-xl sm:text-2xl font-semibold mt-4 sm:mt-6 mb-2 sm:mb-3">
                State Management
              </h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Each model maintains independent state throughout the race:
              </p>
              <div className="bg-muted/50 border border-border rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 overflow-hidden">
                <pre className="text-xs sm:text-sm overflow-x-auto overflow-y-visible">
                  <code className="block whitespace-pre">{`interface ModelState {
  config: ModelConfig;           // Model identifier, capabilities
  position: Position;            // Current (x, y) coordinates
  moveHistory: Direction[];      // Array of all moves made
  pathTaken: Position[];          // Array of all positions visited
  status: "waiting" | "thinking" | "responding" | 
         "moving" | "finished" | "stuck" | "timeout";
  stepCount: number;              // Number of moves made
  chatMessages: AIChatMessage[]; // Prompts and responses
}`}</code>
                </pre>
              </div>

              <h3 className="text-xl sm:text-2xl font-semibold mt-4 sm:mt-6 mb-2 sm:mb-3">
                Parallel Execution Algorithm
              </h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                The race loop processes all active models simultaneously each
                turn:
              </p>

              <div className="bg-muted/50 border border-border rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 overflow-hidden">
                <pre className="text-xs sm:text-sm overflow-x-auto overflow-y-visible">
                  <code className="block whitespace-pre">{`async function startRace(maze, exitPos) {
  initializeModels(modelConfigs, startPos);
  
  while (hasActiveModels()) {
    if (isPaused) {
      await waitForResume();
      continue;
    }
    
    const promises = activeModels.map(async (model) => {
      const visible = getVisibleArea(maze, model.position);
      
      const prompt = createMovePrompt(
        visible,
        model.moveHistory.slice(-10),
        model.stepCount,
        model.pathTaken.slice(-200),
        model.position
      );
      
      const result = await requestModelMove(
        model.config.id,
        visible,
        model.moveHistory,
        model.stepCount,
        model.pathTaken,
        model.position,
        apiKey,
        model.config.capabilities
      );
      
      const direction = result.direction;
      if (!direction) {
        model.status = "stuck";
        return;
      }
      
      const nextPos = calculateNextPosition(model.position, direction);
      if (!isValidMove(maze, model.position, nextPos)) {
        model.status = "stuck";
        return;
      }
      
      model.position = nextPos;
      model.moveHistory.push(direction);
      model.pathTaken.push(nextPos);
      model.stepCount++;
      
      if (nextPos.x === exitPos.x && nextPos.y === exitPos.y) {
        model.status = "finished";
        return;
      }
      
      if (model.stepCount >= maxTurns) {
        model.status = "timeout";
        return;
      }
    });
    
    await Promise.all(promises);
    
    await delay(1000 / speedMultiplier);
  }
  
  return calculateRankings(models);
}`}</code>
                </pre>
              </div>

              <div className="mt-4 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                <p className="text-xs font-medium text-primary mb-1">
                  💡 Parallel Execution
                </p>
                <p className="text-xs text-muted-foreground">
                  All models make moves simultaneously each turn using
                  Promise.all(), ensuring fair competition. Each model's request
                  is independent and doesn't block others, allowing races to
                  complete efficiently even with slow-responding models.
                </p>
              </div>

              <h3 className="text-xl sm:text-2xl font-semibold mt-4 sm:mt-6 mb-2 sm:mb-3">
                Performance Optimizations
              </h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                The system implements several optimizations to ensure smooth
                execution even with multiple models racing simultaneously:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-6 ml-4">
                <li>
                  <strong>Path History Limiting:</strong> Only the last 200
                  positions are analyzed for prompt generation, preventing token
                  bloat while maintaining sufficient context
                </li>
                <li>
                  <strong>Move History Limiting:</strong> Only the last 10 moves
                  are included in prompts, focusing on recent patterns
                </li>
                <li>
                  <strong>AbortController:</strong> Races can be cancelled
                  mid-execution, with all pending requests aborted cleanly
                </li>
                <li>
                  <strong>Timeout Tracking:</strong> All setTimeout calls are
                  tracked in a Set and cleared on component unmount, preventing
                  memory leaks
                </li>
                <li>
                  <strong>State Batching:</strong> Updates are batched to
                  prevent excessive re-renders, improving UI responsiveness
                </li>
                <li>
                  <strong>Speed Multiplier:</strong> Adjustable delay between
                  turns (1x = 1000ms, 5x = 200ms, 10x = 100ms) allows users to
                  control race pace
                </li>
              </ul>

              <h3 className="text-xl sm:text-2xl font-semibold mt-4 sm:mt-6 mb-2 sm:mb-3">
                Ranking Algorithm
              </h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Models are ranked using a multi-criteria system that prioritizes
                completion and efficiency:
              </p>
              <ol className="list-decimal list-inside space-y-2 text-muted-foreground mb-6 ml-4">
                <li>
                  <strong>Completion Status:</strong> Models that reached the
                  exit rank above those that got stuck or timed out
                </li>
                <li>
                  <strong>Steps Taken:</strong> Among finished models, fewer
                  steps = better rank (efficiency metric)
                </li>
                <li>
                  <strong>Time Elapsed:</strong> Faster completion serves as a
                  tiebreaker for models with equal step counts
                </li>
                <li>
                  <strong>Path Efficiency:</strong> Steps taken vs. optimal path
                  length ratio is calculated for comparison (displayed but not
                  used for ranking)
                </li>
              </ol>
            </section>

            <Separator />

            <section>
              <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">
                Technical Overview
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Understanding the complete data flow between the client
                application, AI Gateway, and language models is essential for
                comprehending how the system operates end-to-end.
              </p>

              <h3 className="text-xl sm:text-2xl font-semibold mt-4 sm:mt-6 mb-2 sm:mb-3">
                Request Flow: Client → Gateway → Model
              </h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                When a model needs to make a move, the following sequence
                occurs:
              </p>

              <div className="space-y-4 mb-6">
                <div className="bg-muted/50 border border-border rounded-lg p-4">
                  <h4 className="font-semibold mb-2">
                    1. Prompt Construction (Client)
                  </h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    The client builds a text prompt containing:
                  </p>
                  <ul className="list-disc list-inside text-sm text-muted-foreground ml-4">
                    <li>Visible 3×3 area (ASCII grid)</li>
                    <li>Path history (last 15 positions)</li>
                    <li>Move history (last 10 directions)</li>
                    <li>Warnings and hints</li>
                    <li>Instructions for response format</li>
                  </ul>
                </div>

                <div className="bg-muted/50 border border-border rounded-lg p-4">
                  <h4 className="font-semibold mb-2">
                    2. API Request (Client → Gateway)
                  </h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    HTTP POST request to Vercel AI Gateway:
                  </p>
                  <pre className="text-xs sm:text-sm bg-background p-2 rounded mt-2 overflow-x-auto overflow-y-visible">
                    <code className="block whitespace-pre">{`POST https://ai-gateway.vercel.sh/v1/ai/generate
Authorization: Bearer <token>
Content-Type: application/json

{
  "model": "openai/gpt-4o-mini",
  "prompt": "...",
  "maxTokens": 10,
  "temperature": 0.7
}`}</code>
                  </pre>
                </div>

                <div className="bg-muted/50 border border-border rounded-lg p-4">
                  <h4 className="font-semibold mb-2">3. Gateway Processing</h4>
                  <p className="text-sm text-muted-foreground">
                    AI Gateway authenticates, routes to the appropriate provider
                    API, and manages rate limiting, caching, and error handling.
                  </p>
                </div>

                <div className="bg-muted/50 border border-border rounded-lg p-4">
                  <h4 className="font-semibold mb-2">
                    4. Provider API (Gateway → Provider)
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    The gateway forwards the request to the provider's API
                    (OpenAI, Anthropic, etc.) using the appropriate
                    authentication method.
                  </p>
                </div>

                <div className="bg-muted/50 border border-border rounded-lg p-4">
                  <h4 className="font-semibold mb-2">5. Model Processing</h4>
                  <p className="text-sm text-muted-foreground">
                    The language model processes the prompt and generates a
                    response, which may include reasoning tokens for
                    reasoning-capable models.
                  </p>
                </div>
              </div>

              <h3 className="text-xl sm:text-2xl font-semibold mt-4 sm:mt-6 mb-2 sm:mb-3">
                Response Flow: Model → Gateway → Client
              </h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                The response flows back through the same chain:
              </p>

              <div className="space-y-4 mb-6">
                <div className="bg-muted/50 border border-border rounded-lg p-4">
                  <h4 className="font-semibold mb-2">1. Model Response</h4>
                  <p className="text-sm text-muted-foreground">
                    The model returns text (e.g., "right" or "I'll move right to
                    explore the unexplored area"). For reasoning models, this
                    includes both reasoning and response tokens.
                  </p>
                </div>

                <div className="bg-muted/50 border border-border rounded-lg p-4">
                  <h4 className="font-semibold mb-2">2. Gateway Streaming</h4>
                  <p className="text-sm text-muted-foreground">
                    The gateway streams the response back to the client, with
                    separate streams for reasoning and response tokens when
                    applicable.
                  </p>
                </div>

                <div className="bg-muted/50 border border-border rounded-lg p-4">
                  <h4 className="font-semibold mb-2">3. Client Processing</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    The client receives and processes the response:
                  </p>
                  <ul className="list-disc list-inside text-sm text-muted-foreground ml-4">
                    <li>
                      Parses direction from text (exact match or contains check)
                    </li>
                    <li>
                      Validates move (boundary, wall collision, adjacency)
                    </li>
                    <li>Updates model state (position, history, status)</li>
                    <li>Checks exit conditions and timeouts</li>
                    <li>Updates UI with new position and status</li>
                  </ul>
                </div>
              </div>

              <h3 className="text-xl sm:text-2xl font-semibold mt-4 sm:mt-6 mb-2 sm:mb-3">
                Data Structures & Types
              </h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                The system uses TypeScript interfaces to ensure type safety
                throughout the data flow:
              </p>

              <div className="bg-muted/50 border border-border rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 overflow-hidden">
                <pre className="text-xs sm:text-sm overflow-x-auto overflow-y-visible">
                  <code className="block whitespace-pre">{`interface Position {
  x: number;
  y: number;
}

interface VisibleArea {
  grid: CellType[][];  // 3×3 grid of cell types
}

interface AIChatMessage {
  modelId: string;
  timestamp: number;
  status: "thinking" | "responding" | "complete";
  prompt?: string;
  response?: string;
  reasoning?: string;
  stepNumber: number;
}

interface ModelState {
  config: ModelConfig;
  position: Position;
  moveHistory: Direction[];
  pathTaken: Position[];
  status: ModelStatus;
  stepCount: number;
  chatMessages: AIChatMessage[];
}`}</code>
                </pre>
              </div>

              <h3 className="text-xl sm:text-2xl font-semibold mt-4 sm:mt-6 mb-2 sm:mb-3">
                Authentication Methods
              </h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                The system supports three authentication methods for accessing
                AI models:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-6 ml-4">
                <li>
                  <strong>OIDC (Vercel Sign In):</strong> Users sign in with
                  Vercel, receive OIDC tokens automatically, and the system uses
                  these tokens for AI Gateway requests. No API key management
                  required.
                </li>
                <li>
                  <strong>Gateway API Key:</strong> Users provide a Vercel AI
                  Gateway API key, which works with all providers through the
                  gateway.
                </li>
                <li>
                  <strong>Provider Keys:</strong> Users can provide direct API
                  keys for specific providers (OpenAI, Anthropic, xAI, Google,
                  Mistral, DeepSeek, Groq). The system automatically selects the
                  appropriate key based on the model identifier.
                </li>
              </ul>
            </section>

            <Separator />

            <section>
              <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">
                Technology Stack
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Model Maze Race is built on a modern, performant technology
                stack optimized for real-time AI interactions and smooth user
                experience.
              </p>

              <h3 className="text-xl sm:text-2xl font-semibold mt-4 sm:mt-6 mb-2 sm:mb-3">
                Core Framework
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div className="bg-muted/50 border border-border rounded-lg p-4">
                  <h4 className="font-semibold mb-2">Next.js 16</h4>
                  <p className="text-sm text-muted-foreground">
                    App Router architecture with Server Components for optimal
                    performance, API routes for OAuth handling, and built-in
                    optimizations for React 19.
                  </p>
                </div>
                <div className="bg-muted/50 border border-border rounded-lg p-4">
                  <h4 className="font-semibold mb-2">React 19.2.0</h4>
                  <p className="text-sm text-muted-foreground">
                    Latest React features including concurrent rendering,
                    improved hooks, and enhanced performance for complex state
                    management.
                  </p>
                </div>
                <div className="bg-muted/50 border border-border rounded-lg p-4">
                  <h4 className="font-semibold mb-2">TypeScript 5.x</h4>
                  <p className="text-sm text-muted-foreground">
                    Full type safety throughout the codebase with comprehensive
                    TSDoc comments for documentation and IDE support.
                  </p>
                </div>
                <div className="bg-muted/50 border border-border rounded-lg p-4">
                  <h4 className="font-semibold mb-2">Turbopack</h4>
                  <p className="text-sm text-muted-foreground">
                    Next-generation bundler providing fast development builds
                    and hot module replacement.
                  </p>
                </div>
              </div>

              <h3 className="text-xl sm:text-2xl font-semibold mt-4 sm:mt-6 mb-2 sm:mb-3">
                AI & API Integration
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div className="bg-muted/50 border border-border rounded-lg p-4">
                  <h4 className="font-semibold mb-2">Vercel AI SDK</h4>
                  <p className="text-sm text-muted-foreground">
                    Unified SDK providing{" "}
                    <code className="bg-background px-1 rounded text-xs">
                      generateText
                    </code>
                    ,{" "}
                    <code className="bg-background px-1 rounded text-xs">
                      streamText
                    </code>
                    , and{" "}
                    <code className="bg-background px-1 rounded text-xs">
                      createGateway
                    </code>{" "}
                    functions for seamless AI model integration.
                  </p>
                </div>
                <div className="bg-muted/50 border border-border rounded-lg p-4">
                  <h4 className="font-semibold mb-2">AI Gateway</h4>
                  <p className="text-sm text-muted-foreground">
                    Vercel's unified gateway providing access to 150+ language
                    models from multiple providers with consistent API, rate
                    limiting, caching, and authentication.
                  </p>
                </div>
              </div>

              <h3 className="text-xl sm:text-2xl font-semibold mt-4 sm:mt-6 mb-2 sm:mb-3">
                UI & Styling
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div className="bg-muted/50 border border-border rounded-lg p-4">
                  <h4 className="font-semibold mb-2">Tailwind CSS 4.x</h4>
                  <p className="text-sm text-muted-foreground">
                    Utility-first CSS framework for rapid UI development with
                    responsive design utilities and dark mode support.
                  </p>
                </div>
                <div className="bg-muted/50 border border-border rounded-lg p-4">
                  <h4 className="font-semibold mb-2">shadcn/ui</h4>
                  <p className="text-sm text-muted-foreground">
                    High-quality component library built on Radix UI primitives,
                    providing accessible, customizable components (Button, Card,
                    Tabs, Switch, etc.).
                  </p>
                </div>
                <div className="bg-muted/50 border border-border rounded-lg p-4">
                  <h4 className="font-semibold mb-2">motion/react</h4>
                  <p className="text-sm text-muted-foreground">
                    Animation library for smooth transitions, page animations,
                    and interactive UI elements.
                  </p>
                </div>
                <div className="bg-muted/50 border border-border rounded-lg p-4">
                  <h4 className="font-semibold mb-2">lucide-react</h4>
                  <p className="text-sm text-muted-foreground">
                    Comprehensive icon library with 1000+ icons, tree-shakeable
                    and optimized for React.
                  </p>
                </div>
              </div>

              <h3 className="text-xl sm:text-2xl font-semibold mt-4 sm:mt-6 mb-2 sm:mb-3">
                Storage & Authentication
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div className="bg-muted/50 border border-border rounded-lg p-4">
                  <h4 className="font-semibold mb-2">localStorage</h4>
                  <p className="text-sm text-muted-foreground">
                    Client-side storage for settings, API keys (encrypted), and
                    game configuration. All data remains on the client device.
                  </p>
                </div>
                <div className="bg-muted/50 border border-border rounded-lg p-4">
                  <h4 className="font-semibold mb-2">next-themes</h4>
                  <p className="text-sm text-muted-foreground">
                    Theme management library providing dark/light mode with
                    system preference detection and smooth transitions.
                  </p>
                </div>
                <div className="bg-muted/50 border border-border rounded-lg p-4">
                  <h4 className="font-semibold mb-2">OAuth 2.0 / OIDC</h4>
                  <p className="text-sm text-muted-foreground">
                    Standard authentication protocols for Vercel sign-in
                    integration, providing secure token-based authentication
                    without API key management.
                  </p>
                </div>
              </div>
            </section>

            <Separator />

            <footer className="mt-12 pt-8 border-t">
              <p className="text-muted-foreground text-sm text-center">
                This project was built for the{" "}
                <a
                  href="https://ai-gateway-game-hackathon.vercel.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  AI Gateway Hackathon
                </a>
              </p>
            </footer>
          </div>
        </article>
      </main>
    </div>
  );
}
