import "@testing-library/jest-dom"
import { jest } from "@jest/globals"

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}

  return {
    getItem(key: string) {
      return store[key] || null
    },
    setItem(key: string, value: string) {
      store[key] = value.toString()
    },
    removeItem(key: string) {
      delete store[key]
    },
    clear() {
      store = {}
    },
  }
})()

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
})

// Mock fetch
global.fetch = jest.fn()

// Mock window.URL.createObjectURL
global.URL.createObjectURL = jest.fn(() => "mock-url")
global.URL.revokeObjectURL = jest.fn()

// Mock IntersectionObserver
class IntersectionObserver {
  observe = jest.fn()
  disconnect = jest.fn()
  unobserve = jest.fn()
}

Object.defineProperty(window, "IntersectionObserver", {
  writable: true,
  configurable: true,
  value: IntersectionObserver,
})

// Mock ResizeObserver
class ResizeObserver {
  observe = jest.fn()
  disconnect = jest.fn()
  unobserve = jest.fn()
}

Object.defineProperty(window, "ResizeObserver", {
  writable: true,
  configurable: true,
  value: ResizeObserver,
})

