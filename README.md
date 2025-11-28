# Model Maze Race

<img width="1997" height="1251" alt="image" src="https://github.com/user-attachments/assets/dbba0f40-6b02-4962-a49d-36b894e71cee" />

> A competitive AI model evaluation game where multiple AI models race to escape procedurally generated mazes using limited visibility.

**Built for the [AI Gateway Hackathon](https://ai-gateway-game-hackathon.vercel.app/)** - A simulation game where AI models compete head-to-head in autonomous maze navigation challenges.

---

## Overview

Model Maze Race is a real-time competitive simulation where up to 10 AI models simultaneously navigate procedurally generated mazes. Each model can only see a 3×3 grid around their position, making navigation a true test of reasoning and spatial awareness. Models race to reach the exit, with performance tracked through steps taken, time elapsed, and success rate.

The game delivers a final ranked leaderboard based on each model's performance, making it perfect for comparing how different AI models handle sequential decision-making under limited information.

---

## What It Is

A **Simulation-type** model evaluation game that:

- **Runs autonomous races** - Models navigate independently without human intervention
- **Supports multiple models** - Race up to 10 different AI models simultaneously
- **Generates unique mazes** - Each race uses a procedurally generated maze with configurable difficulty
- **Tracks performance** - Records steps, time, path efficiency, and completion status
- **Ranks results** - Produces a final leaderboard ranking models by performance

Perfect for evaluating how different AI models (GPT-4o, Claude, Gemini, etc.) handle:
- Sequential decision-making
- Spatial reasoning with limited visibility
- Pathfinding and optimization
- Response consistency and reliability

---

## How It Works

### Core Mechanics

1. **Maze Generation**
   - Uses recursive backtracking algorithm to generate solvable mazes
   - Configurable size (15×15 to 45×45) and difficulty (easy to expert)
   - Ensures guaranteed path from start to exit

2. **Model Navigation**
   - Each model sees only a 3×3 grid centered on their position
   - Models receive prompts with their visible area and recent move history
   - AI responds with a direction (up, down, left, right)
   - Moves are validated and executed in parallel for all active models

3. **Race Execution**
   - All models start simultaneously at the maze entrance
   - Turn-based system: each turn, all active models make a move
   - Models race until they reach the exit, get stuck, or timeout (500 turns max)
   - Real-time visualization shows model positions and paths

4. **Performance Tracking**
   - Steps taken to reach exit
   - Total time elapsed
   - Path efficiency (vs. optimal path)
   - Final status (finished, stuck, timeout)

### Technical Flow

```
Setup → Generate Maze → Initialize Models → Start Race
                                              ↓
                                    [Turn Loop]
                                              ↓
                          Get Visible Area → Request AI Move → Validate → Update Position
                                              ↓
                                    Check Exit/Status
                                              ↓
                                    Display Results & Rankings
```

### AI Integration

- Uses **Vercel AI SDK** with **AI Gateway** to access 200+ models
- Supports both gateway API keys and provider-specific keys
- Models receive structured prompts with their visible maze area
- Responses are parsed to extract directional moves
- Real-time status updates show "thinking" → "responding" → "complete"

---

## Development

### Tech Stack

- **Framework**: Next.js 16 (App Router)
- **React**: 19.2.0
- **TypeScript**: 5.x
- **AI SDK**: Vercel AI SDK (`ai` package)
- **Styling**: Tailwind CSS 4.x + shadcn/ui components
- **Animations**: `motion/react`
- **State**: React Hooks + Context API
- **Storage**: localStorage (client-side only)

### Getting Started

1. **Install dependencies**
   ```bash
   pnpm install
   # or
   npm install
   ```

2. **Set up API keys**
   - Add your AI Gateway API key or provider-specific keys
   - Keys are encrypted and stored locally in localStorage
   - Access via the "Add Key" button in the UI

3. **Run development server**
   ```bash
   pnpm dev
   # or
   npm run dev
   ```

4. **Build for production**
   ```bash
   pnpm build
   pnpm start
   ```

### Project Structure

```
src/
├── app/                    # Next.js pages (layout, main page)
├── components/             # React components
│   ├── maze-grid.tsx       # Visual maze renderer
│   ├── race-hud.tsx        # Race status & live AI chat
│   ├── model-selector.tsx  # Model selection UI
│   ├── setup-stage.tsx     # Setup/configuration stage
│   ├── running-stage.tsx   # Active race display
│   ├── settings-panel.tsx  # Maze configuration panel
│   ├── hero-demo.tsx       # Hero section demo simulation
│   ├── header.tsx          # App header with controls
│   ├── api-key-modal.tsx    # API key configuration modal
│   ├── debug-panel.tsx     # Debug logs display
│   ├── ai-chat-panel.tsx   # Live AI chat panel
│   └── ui/                 # shadcn/ui components
├── hooks/                  # Custom React hooks
│   ├── use-maze.ts         # Maze state management
│   ├── use-model-runner.ts # Core racing logic
│   └── use-mobile.ts       # Mobile viewport detection
├── lib/                    # Core business logic
│   ├── maze.ts             # Maze generation & utilities
│   ├── ai.ts               # AI Gateway integration
│   ├── storage.ts          # localStorage utilities
│   └── utils.ts            # Utility functions
├── context/                # React Context providers
│   └── api-key-context.tsx # API key management context
└── types/                  # TypeScript definitions
```

### Key Features

- **Multi-model racing**: Up to 10 models race simultaneously
- **Live AI chat**: Real-time status updates and model responses
- **Debug mode**: View prompts, responses, and optimal path visualization
- **Speed control**: Adjustable race speed (1x to 10x)
- **Theme support**: Dark/light mode with system preference
- **Responsive design**: Works on desktop and mobile
- **Well-documented**: Clean codebase with comprehensive TSDoc comments

### Environment Setup

No environment variables required. API keys are managed through the UI and stored client-side only.

---

## What It's For

This project was built for the **AI Gateway Hackathon** ([ai-gateway-game-hackathon.vercel.app](https://ai-gateway-game-hackathon.vercel.app/)), which challenges developers to create competitive model-evaluation games using Vercel's AI Gateway and AI SDK.

### Hackathon Requirements Met

✅ **Simulation game** - Models compete autonomously without human intervention  
✅ **Head-to-head comparison** - Multiple models race simultaneously  
✅ **Start button** - Users launch races and watch competition play out  
✅ **Ranked results** - Final leaderboard ranks models by performance  
✅ **Vercel deployment** - Ready for deployment on Vercel  
✅ **AI Gateway integration** - Uses AI Gateway to access 200+ models  

### Use Cases

- **Model evaluation**: Compare how different AI models handle spatial reasoning
- **Performance benchmarking**: Measure response times and decision quality
- **Educational tool**: Demonstrate AI decision-making under uncertainty
- **Entertainment**: Watch AI models compete in real-time races

---

## License

MIT
