/**
 * Mock KV Namespace für Tests
 * Simuliert Cloudflare Workers KV mit In-Memory Storage
 */

export interface KVNamespace {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
  delete(key: string): Promise<void>;
  list(options?: { prefix?: string }): Promise<{ keys: Array<{ name: string }> }>;
}

export function createMockKV(): KVNamespace {
  const store = new Map<string, string>();

  return {
    get: async (key: string) => {
      return store.get(key) || null;
    },

    put: async (key: string, value: string, _options?: { expirationTtl?: number }) => {
      store.set(key, value);
    },

    delete: async (key: string) => {
      store.delete(key);
    },

    list: async (options?: { prefix?: string }) => {
      const keys: Array<{ name: string }> = [];
      
      for (const [key] of store) {
        if (!options?.prefix || key.startsWith(options.prefix)) {
          keys.push({ name: key });
        }
      }
      
      return { keys };
    },
  };
}

/**
 * Helper: Reset Mock KV Store
 */
export function resetMockKV(kv: KVNamespace): void {
  // Clear all entries (by deleting all keys)
  const kvAny = kv as any;
  if (kvAny.store && kvAny.store instanceof Map) {
    kvAny.store.clear();
  }
}
