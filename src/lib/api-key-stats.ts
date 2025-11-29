/**
 * API key usage statistics tracking
 * Tracks usage per key for analytics and monitoring
 *
 * @module api-key-stats
 */

/**
 * Statistics for a single API key
 *
 * @interface KeyStats
 */
export interface KeyStats {
  /** Number of times this key has been used */
  usageCount: number;
  /** Timestamp of first use */
  firstUsed: number;
  /** Timestamp of last use */
  lastUsed: number;
  /** Total number of API calls made with this key */
  totalCalls: number;
  /** Number of successful calls */
  successfulCalls: number;
  /** Number of failed calls */
  failedCalls: number;
}

/**
 * Storage key for statistics
 */
const STORAGE_KEY = "maze_race_api_key_stats";

/**
 * Hash function to create a stable identifier from an API key
 * Uses first 8 characters + last 4 characters for privacy
 *
 * @param key - The API key to hash
 * @returns Hashed identifier
 */
function hashKey(key: string): string {
  if (key.length < 12) {
    return "short";
  }
  return `${key.substring(0, 8)}...${key.substring(key.length - 4)}`;
}

/**
 * Load all key statistics from localStorage
 *
 * @returns Map of key hash to statistics
 */
export function loadKeyStats(): Map<string, KeyStats> {
  if (typeof window === "undefined") {
    return new Map();
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return new Map();
    }

    const data = JSON.parse(stored);
    const stats = new Map<string, KeyStats>();

    for (const [keyHash, stat] of Object.entries(data)) {
      stats.set(keyHash, stat as KeyStats);
    }

    return stats;
  } catch (error) {
    console.error("Failed to load key stats:", error);
    return new Map();
  }
}

/**
 * Save key statistics to localStorage
 *
 * @param stats - Map of key hash to statistics
 */
function saveKeyStats(stats: Map<string, KeyStats>): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const data: Record<string, KeyStats> = {};
    for (const [keyHash, stat] of stats.entries()) {
      data[keyHash] = stat;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error("Failed to save key stats:", error);
  }
}

/**
 * Record a key usage event
 *
 * @param key - The API key that was used
 * @param success - Whether the API call was successful
 */
export function recordKeyUsage(key: string, success: boolean): void {
  const keyHash = hashKey(key);
  const stats = loadKeyStats();
  const now = Date.now();

  const existing = stats.get(keyHash) || {
    usageCount: 0,
    firstUsed: now,
    lastUsed: now,
    totalCalls: 0,
    successfulCalls: 0,
    failedCalls: 0,
  };

  existing.usageCount += 1;
  existing.lastUsed = now;
  existing.totalCalls += 1;

  if (success) {
    existing.successfulCalls += 1;
  } else {
    existing.failedCalls += 1;
  }

  stats.set(keyHash, existing);
  saveKeyStats(stats);
}

/**
 * Get statistics for a specific key
 *
 * @param key - The API key to get stats for
 * @returns Statistics object or null if not found
 */
export function getKeyStats(key: string): KeyStats | null {
  const keyHash = hashKey(key);
  const stats = loadKeyStats();
  return stats.get(keyHash) || null;
}

/**
 * Get all key statistics
 *
 * @returns Array of statistics objects with their key hashes
 */
export function getAllKeyStats(): Array<{ keyHash: string; stats: KeyStats }> {
  const stats = loadKeyStats();
  return Array.from(stats.entries()).map(([keyHash, stat]) => ({
    keyHash,
    stats: stat,
  }));
}

/**
 * Clear all key statistics
 */
export function clearKeyStats(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error("Failed to clear key stats:", error);
  }
}
