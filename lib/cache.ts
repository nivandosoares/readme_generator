// Simple in-memory cache implementation
type CacheEntry<T> = {
  value: T
  expiry: number
}

class Cache {
  private cache: Map<string, CacheEntry<any>> = new Map()

  // Set a value in the cache with an expiration time in seconds
  set<T>(key: string, value: T, ttlSeconds = 300): void {
    const expiry = Date.now() + ttlSeconds * 1000
    this.cache.set(key, { value, expiry })

    // Also store in localStorage for persistence across page refreshes
    try {
      localStorage.setItem(`github_cache_${key}`, JSON.stringify({ value, expiry }))
    } catch (error) {
      // Ignore localStorage errors (e.g., in SSR or if quota exceeded)
    }
  }

  // Get a value from the cache
  get<T>(key: string): T | null {
    // First try memory cache
    const entry = this.cache.get(key)

    // If not in memory, try localStorage
    if (!entry) {
      try {
        const storedItem = localStorage.getItem(`github_cache_${key}`)
        if (storedItem) {
          const parsed = JSON.parse(storedItem) as CacheEntry<T>
          if (parsed.expiry > Date.now()) {
            this.cache.set(key, parsed) // Restore to memory cache
            return parsed.value
          } else {
            // Clean up expired localStorage item
            localStorage.removeItem(`github_cache_${key}`)
          }
        }
      } catch (error) {
        // Ignore localStorage errors
      }
      return null
    }

    // Check if the entry has expired
    if (entry.expiry <= Date.now()) {
      this.cache.delete(key)
      try {
        localStorage.removeItem(`github_cache_${key}`)
      } catch (error) {
        // Ignore localStorage errors
      }
      return null
    }

    return entry.value
  }

  // Clear all cache entries
  clear(): void {
    this.cache.clear()

    // Clear localStorage cache entries
    try {
      const keysToRemove: string[] = []

      // Find all keys that start with github_cache_
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith("github_cache_")) {
          keysToRemove.push(key)
        }
      }

      // Remove each key
      keysToRemove.forEach((key) => localStorage.removeItem(key))
    } catch (error) {
      // Ignore localStorage errors
    }
  }
}

// Export a singleton instance
export const cache = new Cache()

