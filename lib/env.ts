// Environment variable configuration
export const env = {
  // OpenAI API key for AI-powered features
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || "",

  // Check if OpenAI API key is available
  hasOpenAIKey: () => {
    return !!process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.length > 0
  },

  // GitHub API configuration
  GITHUB_API_URL: "https://api.github.com",

  // Application configuration
  APP_NAME: "GitHub README Generator",
  APP_VERSION: "1.0.0",

  // Feature flags
  ENABLE_AI_FEATURES: true,

  // Default values
  DEFAULT_README_TEMPLATE: "default",
  MAX_REPOS_TO_FETCH: 100,

  // Error messages
  ERROR_MESSAGES: {
    OPENAI_API_QUOTA: "OpenAI API quota exceeded. Using template-based generation instead.",
    GITHUB_API_RATE_LIMIT: "GitHub API rate limit exceeded. Please try again later or add a GitHub token.",
    USER_NOT_FOUND: "GitHub user not found. Please check the username and try again.",
    REPO_NOT_FOUND: "GitHub repository not found. Please check the URL and try again.",
    GENERAL_ERROR: "An error occurred. Please try again later.",
  },
}

