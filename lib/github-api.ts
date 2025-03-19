import { cache } from "./cache"
import type { Repository, UserProfile } from "./types"

// Rate limiting configuration
const RATE_LIMIT = 10 // requests per minute
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute in milliseconds
const requestCounts = new Map<string, { count: number; resetTime: number }>()

// GitHub API client with caching, rate limiting, and retries
export class GitHubApiClient {
  private baseUrl = "https://api.github.com"
  private token?: string
  private retryCount = 3
  private retryDelay = 1000

  constructor(token?: string) {
    this.token = token
  }

  // Set GitHub token (optional)
  setToken(token: string): void {
    this.token = token
  }

  // Check rate limit for a specific user or IP
  private checkRateLimit(identifier: string): boolean {
    const now = Date.now()
    const userRateLimit = requestCounts.get(identifier)

    if (!userRateLimit || now > userRateLimit.resetTime) {
      // Reset rate limit if window has passed
      requestCounts.set(identifier, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
      return true
    }

    if (userRateLimit.count >= RATE_LIMIT) {
      return false // Rate limit exceeded
    }

    // Increment count
    userRateLimit.count += 1
    requestCounts.set(identifier, userRateLimit)
    return true
  }

  // Fetch with retries and exponential backoff
  private async fetchWithRetry(url: string, options: RequestInit = {}, retries = this.retryCount): Promise<Response> {
    try {
      const response = await fetch(url, options)

      // Handle rate limiting from GitHub
      if (response.status === 403 && response.headers.get("X-RateLimit-Remaining") === "0") {
        const resetTime = response.headers.get("X-RateLimit-Reset")
        if (resetTime && retries > 0) {
          const waitTime = Number.parseInt(resetTime) * 1000 - Date.now()
          // If reset time is reasonable (less than 2 minutes), wait for it
          if (waitTime > 0 && waitTime < 120000) {
            await new Promise((resolve) => setTimeout(resolve, waitTime + 1000))
            return this.fetchWithRetry(url, options, retries - 1)
          }
        }
      }

      // Retry on server errors or network issues
      if (!response.ok && response.status >= 500 && retries > 0) {
        const delay = this.retryDelay * Math.pow(2, this.retryCount - retries)
        await new Promise((resolve) => setTimeout(resolve, delay))
        return this.fetchWithRetry(url, options, retries - 1)
      }

      return response
    } catch (error) {
      if (retries > 0) {
        const delay = this.retryDelay * Math.pow(2, this.retryCount - retries)
        await new Promise((resolve) => setTimeout(resolve, delay))
        return this.fetchWithRetry(url, options, retries - 1)
      }
      throw error
    }
  }

  // Create headers for GitHub API requests
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      Accept: "application/vnd.github.v3+json",
      "X-GitHub-Api-Version": "2022-11-28",
    }

    if (this.token) {
      headers["Authorization"] = `token ${this.token}`
    }

    return headers
  }

  // Fetch user repositories with caching
  async fetchUserRepos(username: string, perPage = 10): Promise<Repository[]> {
    // Check cache first
    const cacheKey = `user_repos_${username}_${perPage}`
    const cachedData = cache.get<Repository[]>(cacheKey)
    if (cachedData) {
      return cachedData
    }

    // Apply rate limiting
    const identifier = `user_${username}`
    if (!this.checkRateLimit(identifier)) {
      throw new Error("Rate limit exceeded. Please try again later.")
    }

    try {
      const response = await this.fetchWithRetry(
        `${this.baseUrl}/users/${username}/repos?sort=updated&per_page=${perPage}`,
        {
          headers: this.getHeaders(),
        },
      )

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("GitHub user not found")
        }
        if (response.status === 403) {
          const rateLimitRemaining = response.headers.get("X-RateLimit-Remaining")
          if (rateLimitRemaining === "0") {
            const resetTime = response.headers.get("X-RateLimit-Reset")
            const resetDate = resetTime ? new Date(Number.parseInt(resetTime) * 1000) : new Date(Date.now() + 3600000)
            throw new Error(`GitHub API rate limit exceeded. Resets at ${resetDate.toLocaleTimeString()}`)
          }
          throw new Error("GitHub API access forbidden")
        }
        throw new Error(`GitHub API error: ${response.status}`)
      }

      const data = await response.json()

      // Cache the result for 5 minutes
      cache.set(cacheKey, data, 300)

      return data
    } catch (error) {
      console.error("Error fetching repositories:", error)
      throw error
    }
  }

  // Fetch a specific repository
  async fetchRepo(owner: string, repo: string): Promise<Repository> {
    // Check cache first
    const cacheKey = `repo_${owner}_${repo}`
    const cachedData = cache.get<Repository>(cacheKey)
    if (cachedData) {
      return cachedData
    }

    // Apply rate limiting
    const identifier = `repo_${owner}_${repo}`
    if (!this.checkRateLimit(identifier)) {
      throw new Error("Rate limit exceeded. Please try again later.")
    }

    try {
      const response = await this.fetchWithRetry(`${this.baseUrl}/repos/${owner}/${repo}`, {
        headers: this.getHeaders(),
      })

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Repository not found")
        }
        if (response.status === 403) {
          const rateLimitRemaining = response.headers.get("X-RateLimit-Remaining")
          if (rateLimitRemaining === "0") {
            throw new Error("GitHub API rate limit exceeded")
          }
          throw new Error("GitHub API access forbidden")
        }
        throw new Error(`GitHub API error: ${response.status}`)
      }

      const data = await response.json()

      // Cache the result for 5 minutes
      cache.set(cacheKey, data, 300)

      return data
    } catch (error) {
      console.error(`Error fetching repository ${owner}/${repo}:`, error)
      throw error
    }
  }

  // Fetch user profile information
  async fetchUserProfile(username: string): Promise<UserProfile> {
    // Check cache first
    const cacheKey = `user_profile_${username}`
    const cachedData = cache.get<UserProfile>(cacheKey)
    if (cachedData) {
      return cachedData
    }

    // Apply rate limiting
    const identifier = `user_${username}`
    if (!this.checkRateLimit(identifier)) {
      throw new Error("Rate limit exceeded. Please try again later.")
    }

    try {
      const response = await this.fetchWithRetry(`${this.baseUrl}/users/${username}`, {
        headers: this.getHeaders(),
      })

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("GitHub user not found")
        }
        if (response.status === 403) {
          const rateLimitRemaining = response.headers.get("X-RateLimit-Remaining")
          if (rateLimitRemaining === "0") {
            throw new Error("GitHub API rate limit exceeded")
          }
          throw new Error("GitHub API access forbidden")
        }
        throw new Error(`GitHub API error: ${response.status}`)
      }

      const data = await response.json()

      // Cache the result for 10 minutes
      cache.set(cacheKey, data, 600)

      return data
    } catch (error) {
      console.error(`Error fetching user profile for ${username}:`, error)
      throw error
    }
  }

  // Fetch repository contents with caching
  async fetchRepoContents(owner: string, repo: string, path = ""): Promise<any> {
    // Check cache first
    const cacheKey = `repo_contents_${owner}_${repo}_${path}`
    const cachedData = cache.get<any>(cacheKey)
    if (cachedData) {
      return cachedData
    }

    // Apply rate limiting
    const identifier = `repo_${owner}_${repo}`
    if (!this.checkRateLimit(identifier)) {
      throw new Error("Rate limit exceeded. Please try again later.")
    }

    try {
      const url = path
        ? `${this.baseUrl}/repos/${owner}/${repo}/contents/${path}`
        : `${this.baseUrl}/repos/${owner}/${repo}/contents`

      const response = await this.fetchWithRetry(url, { headers: this.getHeaders() })

      if (!response.ok) {
        if (response.status === 403) {
          const rateLimitRemaining = response.headers.get("X-RateLimit-Remaining")
          if (rateLimitRemaining === "0") {
            throw new Error("GitHub API rate limit exceeded")
          }
          throw new Error("GitHub API access forbidden")
        }
        if (response.status === 404) {
          throw new Error("Repository contents not found")
        }
        throw new Error(`GitHub API error: ${response.status}`)
      }

      const data = await response.json()

      // Cache the result for 5 minutes
      cache.set(cacheKey, data, 300)

      return data
    } catch (error) {
      console.error(`Error fetching repository contents for ${owner}/${repo}/${path}:`, error)
      throw error
    }
  }

  // Fetch file content from a repository
  async fetchFileContent(owner: string, repo: string, path: string): Promise<string> {
    // Check cache first
    const cacheKey = `file_content_${owner}_${repo}_${path}`
    const cachedData = cache.get<string>(cacheKey)
    if (cachedData) {
      return cachedData
    }

    // Apply rate limiting
    const identifier = `file_${owner}_${repo}`
    if (!this.checkRateLimit(identifier)) {
      throw new Error("Rate limit exceeded. Please try again later.")
    }

    try {
      const response = await this.fetchWithRetry(`${this.baseUrl}/repos/${owner}/${repo}/contents/${path}`, {
        headers: this.getHeaders(),
      })

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`File not found: ${path}`)
        }
        throw new Error(`Failed to fetch file: ${response.status}`)
      }

      const data = await response.json()

      // GitHub API returns content as base64 encoded
      const content = atob(data.content)

      // Cache the result for 10 minutes
      cache.set(cacheKey, content, 600)

      return content
    } catch (error) {
      console.error(`Error fetching file content for ${owner}/${repo}/${path}:`, error)
      throw error
    }
  }

  /**
   * Check if a file exists in a repository
   */
  async fileExists(owner: string, repo: string, path: string): Promise<boolean> {
    // Check cache first
    const cacheKey = `file_exists_${owner}_${repo}_${path}`
    const cachedData = cache.get<boolean>(cacheKey)
    if (cachedData !== null) {
      return cachedData
    }

    try {
      const response = await this.fetchWithRetry(`${this.baseUrl}/repos/${owner}/${repo}/contents/${path}`, {
        method: "HEAD",
        headers: this.getHeaders(),
      })

      const exists = response.ok

      // Cache the result for 10 minutes
      cache.set(cacheKey, exists, 600)

      return exists
    } catch (error) {
      return false
    }
  }
}

// Export a singleton instance
export const githubApi = new GitHubApiClient()

