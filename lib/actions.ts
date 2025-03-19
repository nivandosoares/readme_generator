"use server"

import type { Repository } from "./types"
import {
  analyzeRepository,
  analyzeUserRepositories,
  createUserProfileReadme,
  generateProfileInsights,
  generateReadmeFromAnalysis,
} from "./repo-analysis"
import { githubApi } from "./github-api"
import { learnFromRepository } from "./readme-learning"

// Update the fetchUserRepos function
export async function fetchUserRepos(username: string): Promise<Repository[]> {
  try {
    return await githubApi.fetchUserRepos(username)
  } catch (error) {
    console.error("Error fetching repositories:", error)
    throw error
  }
}

// Add a function to fetch a repository by URL
export async function fetchRepoByUrl(url: string): Promise<Repository | null> {
  try {
    // Parse the GitHub URL to extract owner and repo name
    const { owner, repo } = parseGitHubUrl(url)
    if (!owner || !repo) {
      throw new Error("Invalid GitHub repository URL")
    }

    return await githubApi.fetchRepo(owner, repo)
  } catch (error) {
    console.error("Error fetching repository by URL:", error)
    throw error
  }
}

// Helper function to parse GitHub URLs
export async function parseGitHubUrl(url: string): Promise<{ owner: string | null; repo: string | null }> {
  try {
    const urlObj = new URL(url);

    // Check if it's a GitHub URL
    if (!urlObj.hostname.includes("github.com")) {
      console.warn("Not a GitHub URL:", url);
      return { owner: null, repo: null };
    }

    // Extract path segments
    const pathSegments = urlObj.pathname.split("/").filter(Boolean);

    // GitHub repository URLs have the format: github.com/:owner/:repo
    if (pathSegments.length >= 2) {
      return {
        owner: pathSegments[0],
        repo: pathSegments[1],
      };
    }

    console.warn("Invalid GitHub repository URL format:", url);
    return { owner: null, repo: null };
  } catch (error) {
    console.error("Error parsing GitHub URL:", error);
    return { owner: null, repo: null };
  }
}
// Function to fetch repository contents with error handling for large directories
export async function fetchRepoContents(repo: Repository): Promise<string[]> {
  try {
    // Get the root directory contents
    const data = await githubApi.fetchRepoContents(repo.owner.login, repo.name)

    // Extract file and directory names
    const contents = Array.isArray(data) ? data.map((item: any) => item.path) : [data.path]

    // If we couldn't get any contents, return default structure
    if (contents.length === 0) {
      return getDefaultStructure(repo.language)
    }

    return contents
  } catch (error) {
    console.error("Error fetching repository contents:", error)
    // Fallback to a basic structure if we can't fetch contents
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

// Find the fetchPackageJson function and update it
async function fetchPackageJson(repo: Repository): Promise<any | null> {
  try {
    // Only attempt to fetch package.json for JavaScript/TypeScript repositories
    if (!["JavaScript", "TypeScript", "javascript", "typescript"].includes(repo.language || "")) {
      return null
    }

    // Check if package.json exists before trying to fetch it
    const exists = await githubApi.fileExists(repo.owner.login, repo.name, "package.json")
    if (!exists) {
      console.log(`No package.json found in ${repo.full_name}`)
      return null
    }

    const content = await githubApi.fetchFileContent(repo.owner.login, repo.name, "package.json")
    return JSON.parse(content)
  } catch (error) {
    console.error("Error fetching package.json:", error)
    return null // Return null instead of throwing to prevent breaking the README generation
  }
}

// Update the generateRepoReadme function to use our learning-based approach
export async function generateRepoReadme(repo: Repository) {
  try {
    // Validate repository data
    if (!repo || !repo.name) {
      throw new Error("Invalid repository data")
    }

    // Learn from this repository if it has a README
    await learnFromRepository(repo)

    // 1. Fetch repository contents
    const contents = await fetchRepoContents(repo)

    // 2. Fetch package.json if it exists (and only for JS/TS repos)
    let packageJson = null
    if (["JavaScript", "TypeScript", "javascript", "typescript"].includes(repo.language || "")) {
      try {
        packageJson = await fetchPackageJson(repo)
      } catch (error) {
        console.log("Could not fetch package.json, continuing without it")
        // Continue without package.json
      }
    }

    // 3. Perform comprehensive repository analysis
    const analysis = await analyzeRepository(repo, contents, packageJson)

    // 4. Generate README using the enhanced analysis
    const readme = await generateReadmeFromAnalysis(analysis)

    return { success: true, readme, analysis: analysis }
  } catch (error) {
    console.error("Error generating README:", error)
    throw error
  }
}

// Add a function to generate a user profile README
export async function generateUserProfileReadme(username: string, includeInsights = true) {
  try {
    // 1. Fetch user profile information
    const userProfile = await githubApi.fetchUserProfile(username)

    // 2. Fetch user repositories
    const repos = await githubApi.fetchUserRepos(username, 100) // Fetch up to 100 repos

    // Learn from each repository
    for (const repo of repos) {
      await learnFromRepository(repo)
    }

    // 3. Analyze user repositories
    const analysis = analyzeUserRepositories(userProfile, repos)

    // 4. Generate README using enhanced processing
    let readme = createUserProfileReadme(analysis)

    // 5. Always include insights (changed default to true)
    if (includeInsights) {
      try {
        const insights = generateProfileInsights(userProfile, repos)

        // Extract key sections from insights for inclusion
        const insightsSections = insights
          .split("\n\n")
          .filter(
            (section) =>
              section.includes("Technical Profile") ||
              section.includes("Career Insights") ||
              section.includes("Contribution Analysis") ||
              section.includes("Professional Recommendations"),
          )

        // Insert insights as a dedicated section
        const readmeParts = readme.split("## 📝 Recent Activity")
        readme =
          readmeParts[0] +
          "\n\n## 🔍 Professional Profile Analysis\n\n" +
          insightsSections.join("\n\n") +
          "\n\n## 📝 Recent Activity" +
          readmeParts[1]
      } catch (error) {
        console.error("Error generating insights:", error)
        // Continue with base README if insights generation fails
      }
    }

    return { success: true, readme, profile: userProfile, repos }
  } catch (error) {
    console.error("Error generating user profile README:", error)
    throw error
  }
}

