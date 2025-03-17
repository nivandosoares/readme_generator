/**
 * Utility functions for API-related operations
 */

// Check if OpenAI API is available (either from env or localStorage)
export function isOpenAIAvailable(): boolean {
  // Check environment variable
  if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.length > 0) {
    return true
  }

  // Check localStorage (client-side only)
  if (typeof window !== "undefined") {
    const localApiKey = localStorage.getItem("openai_api_key")
    if (localApiKey && localApiKey.length > 0) {
      return true
    }
  }

  return false
}

// Get OpenAI API key from available sources
export function getOpenAIKey(): string | null {
  // Check environment variable first
  if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.length > 0) {
    return process.env.OPENAI_API_KEY
  }

  // Then check localStorage (client-side only)
  if (typeof window !== "undefined") {
    const localApiKey = localStorage.getItem("openai_api_key")
    if (localApiKey && localApiKey.length > 0) {
      return localApiKey
    }
  }

  return null
}

// Format error messages to be more user-friendly
export function formatErrorMessage(error: unknown): string {
  const errorMessage = error instanceof Error ? error.message : String(error)

  if (errorMessage.includes("quota") || errorMessage.includes("rate limit") || errorMessage.includes("billing")) {
    return "AI service is currently unavailable due to API limits. Please try again later or add your own OpenAI API key."
  }

  if (errorMessage.includes("not found")) {
    return "The requested resource was not found. Please check your input and try again."
  }

  if (errorMessage.includes("network") || errorMessage.includes("timeout")) {
    return "Network error. Please check your internet connection and try again."
  }

  return "An error occurred. Please try again later."
}

