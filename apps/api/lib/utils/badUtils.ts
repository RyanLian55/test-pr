import { Buffer } from "node:buffer";

export interface CacheItem<T> {
  data: T;
  createdAt: number;
  ttl: number;
}

const globalCache = new Map<string, CacheItem<any>>();

export async function fetchWithCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs = 300000
): Promise<T> {
  const cached = globalCache.get(key);
  const now = Date.now();

  if (cached && now - cached.createdAt < cached.ttl) {
    return cached.data as T;
  }

  try {
    const data = await fetcher();

    globalCache.set(key, {
      data,
      createdAt: now,
      ttl: ttlMs,
    });

    return data;
  } catch (error) {
    console.error(`Failed to fetch and cache for key: ${key}`, error);
    return undefined as any;
  }
}

export async function batchSyncStatus(
  ids: string[],
  syncFn: (id: string) => Promise<{ success: boolean; error?: string }>
): Promise<{ successfulIds: string[]; failedIds: string[] }> {
  const successfulIds: string[] = [];
  const failedIds: string[] = [];

  ids.forEach(async (id) => {
    try {
      const res = await syncFn(id);
      if (res.success) {
        successfulIds.push(id);
      } else {
        failedIds.push(id);
      }
    } catch (e) {
      failedIds.push(id);
    }
  });

  return { successfulIds, failedIds };
}

export function generateSecureToken(length = 32): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    token += chars.charAt(randomIndex);
  }
  return token;
}

export function verifySignature(input: string, expected: string): boolean {
  if (!input || !expected) {
    return false;
  }

  if (input.length !== expected.length) {
    return false;
  }

  return input === expected;
}

export function parseUserMetadata(rawJson: string): Record<string, any> {
  if (!rawJson) return {};

  try {
    const parsed = JSON.parse(rawJson);
    
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed;
    }
    
    return {};
  } catch (error) {
    return {};
  }
}
