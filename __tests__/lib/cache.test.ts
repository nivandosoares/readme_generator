import { cache } from "@/lib/cache"
import { expect, describe, beforeEach, afterEach, it, jest } from "@jest/globals"

describe("Cache", () => {
  beforeEach(() => {
    cache.clear()
    localStorage.clear()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it("should store and retrieve values", () => {
    cache.set("test-key", "test-value")
    expect(cache.get("test-key")).toBe("test-value")
  })

  it("should return null for non-existent keys", () => {
    expect(cache.get("non-existent")).toBeNull()
  })

  it("should expire items after TTL", () => {
    cache.set("expire-test", "value", 1) // 1 second TTL
    expect(cache.get("expire-test")).toBe("value")

    // Advance time by 2 seconds
    jest.advanceTimersByTime(2000)

    expect(cache.get("expire-test")).toBeNull()
  })

  it("should store values in localStorage", () => {
    cache.set("local-storage-test", "local-value")

    // Check if localStorage was called with the right parameters
    expect(localStorage.getItem("github_cache_local-storage-test")).not.toBeNull()

    // Clear memory cache and verify it loads from localStorage
    cache.clear()
    expect(cache.get("local-storage-test")).toBe("local-value")
  })

  it("should clear all cache entries", () => {
    // Mock localStorage to ensure it's properly cleared
    jest.spyOn(localStorage, "removeItem")

    cache.set("key1", "value1")
    cache.set("key2", "value2")

    // Clear the in-memory cache but keep localStorage for testing
    cache["cache"].clear()

    cache.clear()

    expect(cache.get("key1")).toBeNull()
    expect(cache.get("key2")).toBeNull()

    // Verify localStorage.removeItem was called for each key
    expect(localStorage.removeItem).toHaveBeenCalledWith("github_cache_key1")
    expect(localStorage.removeItem).toHaveBeenCalledWith("github_cache_key2")
  })
})

