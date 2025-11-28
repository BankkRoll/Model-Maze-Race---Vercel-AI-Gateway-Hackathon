/**
 * Utility functions for common operations
 *
 * @module utils
 */

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge and deduplicate class names
 * Combines clsx and tailwind-merge for optimal class name handling
 *
 * @param inputs - Variable number of class name inputs
 * @returns Merged and deduplicated class name string
 *
 * @example
 * ```tsx
 * cn("px-4", "py-2", "px-6") // Returns: "py-2 px-6" (px-4 is overridden)
 * cn("text-red-500", condition && "text-blue-500") // Conditional classes
 * ```
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
