"use server"

import type { Repository } from "./types"
import { analyzeRepository, generateReadmeFromAnalysis } from "./llm"
import { githubApi } from "./github-api"

// Update the fetchUserRepos function
export async function fetchUserRepos(username: string): Promise<Repository[]> {
  try {
    return await githubApi.fetchUserRepos(username)
  } catch (error) {
    console.error("Error fetching repositories:", error)
    throw error
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

// Update the fetchPackageJson function to check if the file exists first

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

// Update the generateRepoReadme function to handle the case when package.json doesn't exist

// Find the generateRepoReadme function and update it
export async function generateRepoReadme(repo: Repository) {
  try {
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

