/**
 * Main application page - Model Maze Race Landing/Setup
 * Server Component that renders client components
 *
 * @module HomePage
 */

import { SetupStage } from "@/components/landing/setup-stage";
import { Header } from "@/components/shared/header";

/**
 * Main application page component
 * Server Component that renders client components
 *
 * @returns HomePage JSX element
 */
export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="container mx-auto px-4">
        <SetupStage />
      </main>
    </div>
  );
}
