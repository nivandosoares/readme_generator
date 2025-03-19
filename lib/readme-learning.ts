import type { Repository } from "./types"
import { githubApi } from "./github-api"

// Types for our learning system
interface ReadmePattern {
  sections: SectionPattern[]
  style: StylePattern
  frequency: number // How often this pattern appears
}

interface SectionPattern {
  title: string
  level: number // Heading level (1 for #, 2 for ##, etc.)
  content: string[]
  frequency: number
  position: number // Typical position in the document
  keywords: string[] // Common keywords found in this section
}

interface StylePattern {
  usesEmoji: boolean
  usesShields: boolean
  usesCodeBlocks: boolean
  usesTables: boolean
  usesImages: boolean
  averageSectionLength: number
  headerStyle: string // e.g., "# Title" vs "Title\n====="
}

// Global pattern storage - in a real implementation, this would be persisted
const learnedPatterns: Map<string, ReadmePattern[]> = new Map()

/**
 * Analyzes a README file to extract its structure and patterns
 */
export async function analyzeReadmeStructure(readme: string): Promise<ReadmePattern | null> {
  if (!readme || readme.trim().length === 0) {
    return null
  }

  try {
    // Split the README into lines for analysis
    const lines = readme.split("\n")

    // Extract sections
    const sections: SectionPattern[] = []
    let currentSection: SectionPattern | null = null
    let currentContent: string[] = []

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]

      // Check if this is a heading
      const headingMatch = line.match(/^(#{1,6})\s+(.+)$/)

      if (headingMatch) {
        // If we were already building a section, save it
        if (currentSection) {
          currentSection.content = currentContent
          sections.push(currentSection)
          currentContent = []
        }

        // Start a new section
        currentSection = {
          title: headingMatch[2],
          level: headingMatch[1].length,
          content: [],
          frequency: 1,
          position: sections.length,
          keywords: extractKeywords(headingMatch[2]),
        }
      } else if (currentSection) {
        // Add to current section content
        currentContent.push(line)
      } else if (line.trim().length > 0) {
        // This is content before any heading, create an "Introduction" section
        if (!currentSection) {
          currentSection = {
            title: "Introduction",
            level: 0, // No heading
            content: [],
            frequency: 1,
            position: 0,
            keywords: [],
          }
        }
        currentContent.push(line)
      }
    }

    // Add the last section if there is one
    if (currentSection) {
      currentSection.content = currentContent
      sections.push(currentSection)
    }

    // Analyze style patterns
    const style: StylePattern = {
      usesEmoji: /:[a-z_]+:/i.test(readme) || /[\u{1F300}-\u{1F6FF}]/u.test(readme),
      usesShields: readme.includes("shields.io") || (readme.includes("![") && readme.includes("badge")),
      usesCodeBlocks: readme.includes("```"),
      usesTables: readme.includes("|") && readme.includes("---"),
      usesImages: readme.includes("![") && !readme.includes("shields.io"),
      averageSectionLength: sections.reduce((sum, section) => sum + section.content.length, 0) / (sections.length || 1),
      headerStyle: readme.includes("===") || readme.includes("---") ? "underline" : "hash",
    }

    return {
      sections,
      style,
      frequency: 1,
    }
  } catch (error) {
    console.error("Error analyzing README structure:", error)
    return null
  }
}

/**
 * Extract common keywords from a string
 */
function extractKeywords(text: string): string[] {
  // Remove special characters and convert to lowercase
  const cleanText = text.toLowerCase().replace(/[^\w\s]/g, "")

  // Split into words
  const words = cleanText.split(/\s+/)

  // Filter out common words and short words
  const commonWords = new Set([
    "the",
    "a",
    "an",
    "and",
    "or",
    "but",
    "in",
    "on",
    "at",
    "to",
    "for",
    "with",
    "by",
    "about",
    "as",
    "of",
  ])
  return words.filter((word) => word.length > 2 && !commonWords.has(word))
}

/**
 * Learn from a repository's README
 */
export async function learnFromRepository(repo: Repository): Promise<void> {
  try {
    // Check if the repository has a README
    const readmeExists = await githubApi.fileExists(repo.owner.login, repo.name, "README.md")

    if (!readmeExists) {
      return // No README to learn from
    }

    // Fetch the README content
    const readmeContent = await githubApi.fetchFileContent(repo.owner.login, repo.name, "README.md")

    // Analyze the README structure
    const pattern = await analyzeReadmeStructure(readmeContent)

    if (!pattern) {
      return // Couldn't analyze the README
    }

    // Categorize the repository
    const category = categorizeRepository(repo)

    // Store the pattern
    if (!learnedPatterns.has(category)) {
      learnedPatterns.set(category, [])
    }

    const patterns = learnedPatterns.get(category)!

    // Check if we have a similar pattern already
    const similarPatternIndex = findSimilarPattern(patterns, pattern)

    if (similarPatternIndex >= 0) {
      // Update the existing pattern
      const existingPattern = patterns[similarPatternIndex]
      existingPattern.frequency += 1

      // Merge sections
      mergeSections(existingPattern.sections, pattern.sections)
    } else {
      // Add as a new pattern
      patterns.push(pattern)
    }
  } catch (error) {
    console.error("Error learning from repository:", error)
  }
}

/**
 * Categorize a repository based on its characteristics
 */
function categorizeRepository(repo: Repository): string {
  // Start with language as the base category
  let category = repo.language || "unknown"

  // Add more specific categorization based on topics, name, description
  if (repo.topics && repo.topics.length > 0) {
    // Check for specific frameworks or types
    if (repo.topics.some((topic) => ["react", "vue", "angular"].includes(topic.toLowerCase()))) {
      category += "-frontend"
    } else if (repo.topics.some((topic) => ["api", "backend", "server"].includes(topic.toLowerCase()))) {
      category += "-backend"
    } else if (
      repo.topics.some((topic) => ["ml", "ai", "machine-learning", "data-science"].includes(topic.toLowerCase()))
    ) {
      category += "-ml"
    }
  }

  // Check name and description for more clues
  const nameAndDesc = (repo.name + " " + (repo.description || "")).toLowerCase()

  if (nameAndDesc.includes("awesome") || nameAndDesc.includes("list")) {
    category += "-list"
  } else if (
    nameAndDesc.includes("boilerplate") ||
    nameAndDesc.includes("starter") ||
    nameAndDesc.includes("template")
  ) {
    category += "-template"
  } else if (nameAndDesc.includes("docs") || nameAndDesc.includes("documentation")) {
    category += "-docs"
  }

  return category
}

/**
 * Find a similar pattern in the existing patterns
 */
function findSimilarPattern(patterns: ReadmePattern[], newPattern: ReadmePattern): number {
  for (let i = 0; i < patterns.length; i++) {
    const pattern = patterns[i]

    // Check if the sections are similar
    const sectionSimilarity = calculateSectionSimilarity(pattern.sections, newPattern.sections)

    // If more than 70% similar, consider it the same pattern
    if (sectionSimilarity > 0.7) {
      return i
    }
  }

  return -1
}

/**
 * Calculate similarity between two sets of sections
 */
function calculateSectionSimilarity(sections1: SectionPattern[], sections2: SectionPattern[]): number {
  // Count matching sections
  let matches = 0

  for (const section1 of sections1) {
    for (const section2 of sections2) {
      // Check if titles are similar
      const titleSimilarity = calculateStringSimilarity(section1.title.toLowerCase(), section2.title.toLowerCase())

      // If titles are similar and positions are close, consider it a match
      if (titleSimilarity > 0.8 && Math.abs(section1.position - section2.position) <= 2) {
        matches++
        break
      }
    }
  }

  // Calculate similarity as a ratio of matches to total unique sections
  const uniqueSections = new Set([
    ...sections1.map((s) => s.title.toLowerCase()),
    ...sections2.map((s) => s.title.toLowerCase()),
  ])

  return matches / uniqueSections.size
}

/**
 * Calculate string similarity using Levenshtein distance
 */
function calculateStringSimilarity(str1: string, str2: string): number {
  const len1 = str1.length
  const len2 = str2.length

  // If either string is empty, the similarity is 0
  if (len1 === 0 || len2 === 0) {
    return 0
  }

  // Create a matrix to store the distances
  const matrix: number[][] = []

  // Initialize the matrix
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i]
  }

  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j
  }

  // Fill the matrix
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // deletion
        matrix[i][j - 1] + 1, // insertion
        matrix[i - 1][j - 1] + cost, // substitution
      )
    }
  }

  // Calculate the Levenshtein distance
  const distance = matrix[len1][len2]

  // Convert to similarity (0 to 1)
  return 1 - distance / Math.max(len1, len2)
}

/**
 * Merge two sets of sections, updating frequencies and content
 */
function mergeSections(existingSections: SectionPattern[], newSections: SectionPattern[]): void {
  for (const newSection of newSections) {
    // Find a matching section in the existing sections
    const matchingSection = existingSections.find(
      (section) => calculateStringSimilarity(section.title.toLowerCase(), newSection.title.toLowerCase()) > 0.8,
    )

    if (matchingSection) {
      // Update the existing section
      matchingSection.frequency += 1

      // Update position (weighted average)
      matchingSection.position =
        (matchingSection.position * matchingSection.frequency + newSection.position) / (matchingSection.frequency + 1)

      // Merge keywords
      for (const keyword of newSection.keywords) {
        if (!matchingSection.keywords.includes(keyword)) {
          matchingSection.keywords.push(keyword)
        }
      }

      // We could also analyze and merge content patterns here
    } else {
      // Add as a new section
      existingSections.push(newSection)
    }
  }

  // Sort sections by position
  existingSections.sort((a, b) => a.position - b.position)
}

/**
 * Get the best README pattern for a repository
 */
export function getBestPatternForRepository(repo: Repository): ReadmePattern | null {
  const category = categorizeRepository(repo)

  // Check if we have patterns for this category
  if (!learnedPatterns.has(category)) {
    // Try to find a more general category
    const generalCategory = category.split("-")[0]

    if (!learnedPatterns.has(generalCategory)) {
      return null // No patterns found
    }

    // Use the most frequent pattern from the general category
    const patterns = learnedPatterns.get(generalCategory)!
    return patterns.sort((a, b) => b.frequency - a.frequency)[0]
  }

  // Get the most frequent pattern for this category
  const patterns = learnedPatterns.get(category)!
  return patterns.sort((a, b) => b.frequency - a.frequency)[0]
}

/**
 * Learn from popular repositories in a specific language or topic
 */
export async function learnFromPopularRepositories(language: string, count = 10): Promise<void> {
  try {
    // This would be a call to GitHub API to get popular repositories
    // For now, we'll simulate it
    const popularRepos = await simulateFetchPopularRepos(language, count)

    // Learn from each repository
    for (const repo of popularRepos) {
      await learnFromRepository(repo)
    }

    console.log(`Learned from ${popularRepos.length} popular ${language} repositories`)
  } catch (error) {
    console.error("Error learning from popular repositories:", error)
  }
}

/**
 * Simulate fetching popular repositories (in a real implementation, this would use the GitHub API)
 */
async function simulateFetchPopularRepos(language: string, count: number): Promise<Repository[]> {
  // In a real implementation, this would be a call to GitHub API
  // For now, we'll return an empty array
  return []
}

/**
 * Generate a README based on learned patterns
 */
export async function generateReadmeFromLearning(repo: Repository, analysis: any): Promise<string> {
  // Get the best pattern for this repository
  const pattern = getBestPatternForRepository(repo)

  if (!pattern) {
    // Fall back to a basic README if no pattern is found
    return generateBasicReadme(repo, analysis)
  }

  // Generate a README based on the pattern
  return generateReadmeFromPattern(repo, analysis, pattern)
}

/**
 * Generate a basic README when no pattern is found
 */
function generateBasicReadme(repo: Repository, analysis: any): string {
  // Safe access to repository properties with defaults
  const repoName = repo.name || "Repository"
  const repoDescription = repo.description || "A software project"
  const repoLanguage = repo.language || "Not specified"

  return `# ${repoName}

${repoDescription}

## Installation

\`\`\`bash
# Clone the repository
git clone https://github.com/${repo.full_name}.git
cd ${repoName}

# Install dependencies
${getInstallCommandForLanguage(repoLanguage)}
\`\`\`

## Usage

\`\`\`bash
${getUsageCommandForLanguage(repoLanguage)}
\`\`\`

## Features

- Feature 1
- Feature 2
- Feature 3

## License

${repo.license?.name || "This project is licensed under the terms of the license included in the repository."}
`
}

/**
 * Get install command for a language
 */
function getInstallCommandForLanguage(language: string): string {
  switch (language.toLowerCase()) {
    case "javascript":
    case "typescript":
      return "npm install"
    case "python":
      return "pip install -r requirements.txt"
    case "ruby":
      return "bundle install"
    case "go":
      return "go mod download"
    case "rust":
      return "cargo build"
    case "java":
      return "mvn install"
    case "c#":
      return "dotnet restore"
    default:
      return "# Install dependencies according to your project requirements"
  }
}

/**
 * Get usage command for a language
 */
function getUsageCommandForLanguage(language: string): string {
  switch (language.toLowerCase()) {
    case "javascript":
    case "typescript":
      return "npm start"
    case "python":
      return "python main.py"
    case "ruby":
      return "ruby app.rb"
    case "go":
      return "go run main.go"
    case "rust":
      return "cargo run"
    case "java":
      return "java -jar target/app.jar"
    case "c#":
      return "dotnet run"
    default:
      return "# Run the application according to your project requirements"
  }
}

/**
 * Generate a README based on a pattern
 */
function generateReadmeFromPattern(repo: Repository, analysis: any, pattern: ReadmePattern): string {
  let readme = ""

  // Generate each section based on the pattern
  for (const section of pattern.sections) {
    // Generate heading
    const heading = "#".repeat(section.level) + (section.level > 0 ? " " : "") + section.title

    // Generate content based on section title and repository data
    const content = generateSectionContent(section.title, repo, analysis)

    // Add to README
    readme += `${heading}\n\n${content}\n\n`
  }

  // Apply style patterns
  if (pattern.style.usesShields) {
    // Add badges at the top
    const badges = generateBadges(repo)
    readme = readme.replace(/^(# .+\n\n)/, `$1${badges}\n\n`)
  }

  return readme
}

/**
 * Generate content for a section based on its title
 */
function generateSectionContent(sectionTitle: string, repo: Repository, analysis: any): string {
  const title = sectionTitle.toLowerCase()

  // Handle common section types
  if (title === "introduction" || title === "") {
    return repo.description || "A software project."
  } else if (title.includes("install") || title.includes("getting started") || title.includes("setup")) {
    return generateInstallationSection(repo, analysis)
  } else if (title.includes("usage") || title.includes("example")) {
    return generateUsageSection(repo, analysis)
  } else if (title.includes("feature")) {
    return generateFeaturesSection(repo, analysis)
  } else if (title.includes("api") || title.includes("documentation")) {
    return generateApiSection(repo, analysis)
  } else if (title.includes("contribute") || title.includes("contributing")) {
    return generateContributingSection(repo)
  } else if (title.includes("license")) {
    return generateLicenseSection(repo)
  } else if (title.includes("author") || title.includes("credit") || title.includes("acknowledgement")) {
    return generateAuthorsSection(repo)
  } else {
    // Generic section
    return "This section needs to be filled with relevant information."
  }
}

/**
 * Generate installation section
 */
function generateInstallationSection(repo: Repository, analysis: any): string {
  const language = repo.language || ""
  const installCommand = getInstallCommandForLanguage(language)

  return `\`\`\`bash
# Clone the repository
git clone https://github.com/${repo.full_name}.git
cd ${repo.name}

# Install dependencies
${installCommand}
\`\`\``
}

/**
 * Generate usage section
 */
function generateUsageSection(repo: Repository, analysis: any): string {
  const language = repo.language || ""
  const usageCommand = getUsageCommandForLanguage(language)

  return `\`\`\`bash
${usageCommand}
\`\`\`

For more detailed usage instructions, please refer to the documentation.`
}

/**
 * Generate features section
 */
function generateFeaturesSection(repo: Repository, analysis: any): string {
  // In a real implementation, this would analyze the repository to identify features
  return `- Feature 1
- Feature 2
- Feature 3`
}

/**
 * Generate API section
 */
function generateApiSection(repo: Repository, analysis: any): string {
  // In a real implementation, this would analyze the repository to identify API endpoints
  return `This section would contain API documentation.

\`\`\`javascript
// Example API usage
const api = require('${repo.name}');
const result = api.doSomething();
\`\`\``
}

/**
 * Generate contributing section
 */
function generateContributingSection(repo: Repository): string {
  return `Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (\`git checkout -b feature/amazing-feature\`)
3. Commit your changes (\`git commit -m 'Add some amazing feature'\`)
4. Push to the branch (\`git push origin feature/amazing-feature\`)
5. Open a Pull Request`
}

/**
 * Generate license section
 */
function generateLicenseSection(repo: Repository): string {
  return repo.license?.name
    ? `This project is licensed under the ${repo.license.name}.`
    : "This project is licensed under the terms of the license included in the repository."
}

/**
 * Generate authors section
 */
function generateAuthorsSection(repo: Repository): string {
  return `- **${repo.owner.login}** - *Initial work* - [${repo.owner.login}](https://github.com/${repo.owner.login})

See also the list of [contributors](https://github.com/${repo.full_name}/contributors) who participated in this project.`
}

/**
 * Generate badges for a repository
 */
function generateBadges(repo: Repository): string {
  const badges = []

  // License badge
  if (repo.license?.name) {
    badges.push(`![License](https://img.shields.io/badge/license-${encodeURIComponent(repo.license.name)}-blue.svg)`)
  }

  // Language badge
  if (repo.language) {
    badges.push(`![Language](https://img.shields.io/badge/language-${encodeURIComponent(repo.language)}-orange.svg)`)
  }

  // Stars badge
  badges.push(`![Stars](https://img.shields.io/github/stars/${repo.full_name}?style=social)`)

  return badges.join(" ")
}

/**
 * Initialize the learning system by learning from popular repositories
 */
export async function initializeLearningSystem(): Promise<void> {
  // Learn from popular repositories in different languages
  const languages = ["JavaScript", "Python", "Java", "Go", "Ruby", "Rust", "C#", "C++"]

  for (const language of languages) {
    await learnFromPopularRepositories(language, 5)
  }

  console.log("Learning system initialized")
}

