"use server"

import type { Repository } from "./types"
import { analyzeRepository, generateReadmeFromAnalysis } from "./llm"

// Rate limiting configuration
const RATE_LIMIT = 10 // requests per minute
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute in milliseconds
const requestCounts = new Map<string, { count: number; resetTime: number }>()

// Rate limiting function
function checkRateLimit(userId: string): boolean {
  const now = Date.now()
  const userRateLimit = requestCounts.get(userId)

  if (!userRateLimit || now > userRateLimit.resetTime) {
    // Reset rate limit if window has passed
    requestCounts.set(userId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    return true
  }

  if (userRateLimit.count >= RATE_LIMIT) {
    return false // Rate limit exceeded
  }

  // Increment count
  userRateLimit.count += 1
  requestCounts.set(userId, userRateLimit)
  return true
}

export async function fetchUserRepos(username: string): Promise<Repository[]> {
  try {
    // Apply rate limiting
    if (!checkRateLimit(`user_${username}`)) {
      throw new Error("Rate limit exceeded. Please try again later.")
    }

    const response = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=10`, {
      headers: {
        Accept: "application/vnd.github.v3+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    })

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("GitHub user not found")
      }
      if (response.status === 403) {
        throw new Error("GitHub API rate limit exceeded")
      }
      throw new Error(`GitHub API error: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error("Error fetching repositories:", error)
    throw error
  }
}

// Function to fetch top-level repository contents only
async function fetchTopLevelContents(repo: Repository): Promise<string[]> {
  try {
    const response = await fetch(`https://api.github.com/repos/${repo.full_name}/contents`, {
      headers: {
        Accept: "application/vnd.github.v3+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    })

    if (!response.ok) {
      if (response.status === 403) {
        console.warn(`Rate limit exceeded when fetching contents for ${repo.full_name}`)
        return []
      }
      if (response.status === 404) {
        console.warn(`Contents not found for ${repo.full_name}`)
        return []
      }
      console.warn(`Error fetching contents for ${repo.full_name}: ${response.status}`)
      return []
    }

    const contents = await response.json()

    if (!Array.isArray(contents)) {
      return [contents.name]
    }

    return contents.map((item: any) => item.name)
  } catch (error) {
    console.error("Error fetching top-level contents:", error)
    return []
  }
}

// Function to fetch common important files that might exist in the repo
async function fetchImportantFiles(repo: Repository): Promise<string[]> {
  const importantFiles = [
    "package.json",
    "requirements.txt",
    "setup.py",
    "Gemfile",
    "pom.xml",
    "build.gradle",
    "go.mod",
    "Cargo.toml",
    ".github/workflows/main.yml",
    ".travis.yml",
    "circle.yml",
    ".gitlab-ci.yml",
    "README.md",
    "CONTRIBUTING.md",
    "LICENSE",
    ".gitignore",
  ]

  const results: string[] = []

  for (const file of importantFiles) {
    try {
      const response = await fetch(`https://api.github.com/repos/${repo.full_name}/contents/${file}`, {
        headers: {
          Accept: "application/vnd.github.v3+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
      })

      if (response.ok) {
        results.push(file)
      }
    } catch (error) {
      // Ignore errors for individual files
    }
  }

  return results
}

// Function to check if common directories exist
async function checkCommonDirectories(repo: Repository): Promise<string[]> {
  const commonDirs = [
    "src",
    "app",
    "lib",
    "test",
    "tests",
    "docs",
    "examples",
    "scripts",
    "public",
    "assets",
    "dist",
    "build",
  ]

  const results: string[] = []

  for (const dir of commonDirs) {
    try {
      const response = await fetch(`https://api.github.com/repos/${repo.full_name}/contents/${dir}`, {
        headers: {
          Accept: "application/vnd.github.v3+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
      })

      if (response.ok) {
        results.push(`${dir}/`)
      }
    } catch (error) {
      // Ignore errors for individual directories
    }
  }

  return results
}

export async function fetchRepoContents(repo: Repository): Promise<string[]> {
  try {
    // Get top-level contents
    const topLevelContents = await fetchTopLevelContents(repo)

    // Get important files
    const importantFiles = await fetchImportantFiles(repo)

    // Check common directories
    const commonDirs = await checkCommonDirectories(repo)

    // Combine all results
    const allContents = [...new Set([...topLevelContents, ...importantFiles, ...commonDirs])]

    if (allContents.length === 0) {
      // If we couldn't fetch any contents, return some basic structure based on language
      return getDefaultStructure(repo.language)
    }

    return allContents
  } catch (error) {
    console.error("Error fetching repository contents:", error)
    // Return default structure based on language if we can't fetch contents
    return getDefaultStructure(repo.language)
  }
}

// Function to provide a default structure based on language
function getDefaultStructure(language: string | null): string[] {
  switch (language?.toLowerCase()) {
    case "javascript":
      return ["package.json", "src/", "public/", "README.md", ".gitignore"]
    case "typescript":
      return ["package.json", "tsconfig.json", "src/", "public/", "README.md", ".gitignore"]
    case "python":
      return ["requirements.txt", "setup.py", "src/", "tests/", "README.md", ".gitignore"]
    case "java":
      return ["pom.xml", "src/main/java/", "src/test/java/", "README.md", ".gitignore"]
    case "go":
      return ["go.mod", "main.go", "pkg/", "cmd/", "README.md", ".gitignore"]
    case "ruby":
      return ["Gemfile", "lib/", "spec/", "README.md", ".gitignore"]
    case "rust":
      return ["Cargo.toml", "src/", "tests/", "README.md", ".gitignore"]
    case "php":
      return ["index.php", "composer.json", "css/", "js/", "templates/", "README.md", ".gitignore"]
    case "c#":
      return ["*.csproj", "Program.cs", "src/", "README.md", ".gitignore"]
    case "c":
    case "c++":
      return ["CMakeLists.txt", "Makefile", "src/", "include/", "README.md", ".gitignore"]
    default:
      return ["src/", "README.md", "LICENSE", ".gitignore"]
  }
}

// Function to fetch package.json content if it exists
async function fetchPackageJson(repo: Repository): Promise<any | null> {
  try {
    const response = await fetch(`https://api.github.com/repos/${repo.full_name}/contents/package.json`, {
      headers: {
        Accept: "application/vnd.github.v3+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json()

    // GitHub API returns content as base64 encoded
    const content = atob(data.content)
    return JSON.parse(content)
  } catch (error) {
    console.error("Error fetching package.json:", error)
    return null
  }
}

export async function generateRepoReadme(repo: Repository) {
  try {
    // 1. Fetch repository contents
    const contents = await fetchRepoContents(repo)

    // 2. Fetch package.json if it exists
    const packageJson = await fetchPackageJson(repo)

    // 3. Analyze repository structure and metadata
    const analysis = await analyzeRepository(repo, contents, packageJson)

    // 4. Generate README using the analysis
    const readme = await generateReadmeFromAnalysis(analysis)

    return { success: true, readme }
  } catch (error) {
    console.error("Error generating README:", error)
    throw error
  }
}

