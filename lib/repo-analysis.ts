import type { Repository, UserProfile, UserAnalysis } from "./types"
import { learnFromRepository, generateReadmeFromLearning, initializeLearningSystem } from "./readme-learning"

// Initialize the learning system when the module is loaded
initializeLearningSystem().catch((error) => {
  console.error("Failed to initialize learning system:", error)
})

/**
 * Enhanced repository analysis that extracts comprehensive information
 */
export async function analyzeRepository(
  repo: Repository,
  contents: string[] = [],
  packageJson: any = null,
): Promise<any> {
  // Learn from this repository if it has a README
  await learnFromRepository(repo)

  // Detect repository type based on name, description, and contents
  const repoType = detectRepositoryType(repo, contents)

  // Extract basic repository information
  const analysis = {
    name: repo.name,
    description: repo.description,
    language: repo.language,
    topics: repo.topics || [],
    license: repo.license?.name,
    licenseUrl: repo.license?.url,
    hasTests: contents.some((path) => path.includes("test") || path.includes("spec")),
    hasDocs: contents.some((path) => path.includes("docs") || path.includes("documentation")),
    hasCI: contents.some(
      (path) =>
        path.includes(".github/workflows") ||
        path.includes(".travis.yml") ||
        path.includes("circle.yml") ||
        path.includes(".gitlab-ci.yml"),
    ),
    hasContributing: contents.some(
      (path) => path.toLowerCase().includes("contributing") || path.toLowerCase().includes("contribute"),
    ),
    hasChangelog: contents.some(
      (path) => path.toLowerCase().includes("changelog") || path.toLowerCase().includes("changes"),
    ),
    installCommand: getInstallCommand(repo.language, repoType),
    runCommand: getRunCommand(repo.language, repoType),
    buildCommand: getBuildCommand(repo.language, repoType),
    testCommand: getTestCommand(repo.language, repoType),
    dependencies: packageJson?.dependencies ? Object.keys(packageJson.dependencies) : [],
    devDependencies: packageJson?.devDependencies ? Object.keys(packageJson.devDependencies) : [],
    peerDependencies: packageJson?.peerDependencies ? Object.keys(packageJson.peerDependencies) : [],
    structure: contents,
    packageJson: packageJson,
    repoType: repoType,
    owner: repo.owner.login,
    fullName: repo.full_name,
    defaultBranch: repo.default_branch,
    stars: repo.stargazers_count,
    forks: repo.forks_count,
    openIssues: repo.open_issues_count,
    createdAt: repo.created_at,
    updatedAt: repo.updated_at,
    homepage: repo.homepage,
    hasWiki: repo.has_wiki,
    isArchived: repo.archived,
    isTemplate: repo.is_template,
    mainEntryPoint: detectMainEntryPoint(contents, repoType, repo.language),
    configFiles: detectConfigFiles(contents, repoType),
    apiEndpoints: detectApiEndpoints(contents, repoType, repo.language),
    environmentVariables: detectEnvironmentVariables(contents, repoType, repo.language),
    codeStructure: analyzeCodeStructure(contents, repoType, repo.language),
  }

  // Add repository-specific analysis
  switch (repoType) {
    case "node":
      analysis.nodeVersion = packageJson?.engines?.node || "Not specified"
      analysis.npmVersion = packageJson?.engines?.npm || "Not specified"
      analysis.hasTypeScript = contents.some((path) => path.endsWith(".ts") || path.endsWith(".tsx"))
      analysis.hasReact = packageJson?.dependencies?.react || packageJson?.devDependencies?.react
      analysis.hasNextJs = packageJson?.dependencies?.next || packageJson?.devDependencies?.next
      analysis.scripts = packageJson?.scripts || {}
      break

    case "python":
      analysis.pythonVersion = detectPythonVersion(contents)
      analysis.hasPipenv = contents.some((path) => path === "Pipfile" || path === "Pipfile.lock")
      analysis.hasPoetry = contents.some((path) => path === "pyproject.toml")
      analysis.hasSetup = contents.some((path) => path === "setup.py")
      analysis.hasDjango = contents.some(
        (path) =>
          path.includes("django") ||
          path.includes("settings.py") ||
          path.includes("urls.py") ||
          path.includes("wsgi.py"),
      )
      analysis.hasFlask = contents.some((path) => path.includes("flask") || path.includes("app.py"))
      break

    case "linux-kernel":
      analysis.kernelVersion = detectKernelVersion(contents)
      analysis.architectures = detectSupportedArchitectures(contents)
      analysis.hasDrivers = contents.some((path) => path.startsWith("drivers/"))
      analysis.hasFilesystems = contents.some((path) => path.startsWith("fs/"))
      analysis.hasNetworking = contents.some((path) => path.startsWith("net/"))
      break

    case "web":
      analysis.hasJavaScript = contents.some((path) => path.endsWith(".js"))
      analysis.hasCSS = contents.some((path) => path.endsWith(".css"))
      analysis.hasHTML = contents.some((path) => path.endsWith(".html"))
      analysis.frameworks = detectWebFrameworks(contents, packageJson)
      break
  }

  return analysis
}

/**
 * Detects the type of repository based on its characteristics
 */
function detectRepositoryType(repo: Repository, contents: string[] = []): string {
  // Check for Linux kernel repository
  if (
    (repo.name.toLowerCase().includes("linux") || repo.description?.toLowerCase().includes("linux kernel")) &&
    (repo.language === "C" || contents.some((path) => path.includes("Makefile") || path.includes("Kconfig")))
  ) {
    return "linux-kernel"
  }

  // Check for operating system or kernel repository
  if (
    (repo.name.toLowerCase().includes("kernel") || repo.description?.toLowerCase().includes("kernel")) &&
    (repo.language === "C" || contents.some((path) => path.includes("Makefile")))
  ) {
    return "kernel"
  }

  // Check for C/C++ system software
  if (
    (repo.language === "C" || repo.language === "C++") &&
    contents.some((path) => path.includes("Makefile") || path.includes("CMakeLists.txt"))
  ) {
    return "c-system"
  }

  // Check for web application
  if (
    contents.some(
      (path) =>
        path.endsWith(".html") || path.endsWith(".css") || path.includes("index.html") || path.includes("style.css"),
    )
  ) {
    return "web"
  }

  // Check for mobile app
  if (
    contents.some(
      (path) =>
        path.includes("AndroidManifest.xml") ||
        path.includes("Info.plist") ||
        path.includes("AppDelegate") ||
        path.includes("MainActivity"),
    )
  ) {
    return "mobile"
  }

  // Check for data science project
  if (
    contents.some(
      (path) =>
        path.endsWith(".ipynb") || path.includes("data/") || path.includes("notebooks/") || path.includes("dataset"),
    ) ||
    (repo.topics &&
      repo.topics.some((topic) => topic.includes("data") || topic.includes("machine-learning") || topic.includes("ai")))
  ) {
    return "data-science"
  }

  // Default repository types based on language
  switch (repo.language?.toLowerCase()) {
    case "javascript":
    case "typescript":
      return "node"
    case "python":
      return "python"
    case "java":
      return "java"
    case "ruby":
      return "ruby"
    case "go":
      return "go"
    case "rust":
      return "rust"
    case "php":
      return "php"
    case "c#":
      return "dotnet"
    case "html":
    case "css":
      return "web"
    case "swift":
    case "kotlin":
    case "objective-c":
      return "mobile"
    case "r":
    case "jupyter notebook":
      return "data-science"
    default:
      return "generic"
  }
}

/**
 * Detects the main entry point of the repository
 */
function detectMainEntryPoint(contents: string[], repoType: string, language: string | null): string {
  switch (repoType) {
    case "node":
      if (contents.includes("index.js")) return "index.js"
      if (contents.includes("index.ts")) return "index.ts"
      if (contents.includes("src/index.js")) return "src/index.js"
      if (contents.includes("src/index.ts")) return "src/index.ts"
      if (contents.includes("app.js")) return "app.js"
      if (contents.includes("server.js")) return "server.js"
      return "Not detected"

    case "python":
      if (contents.includes("main.py")) return "main.py"
      if (contents.includes("app.py")) return "app.py"
      if (contents.includes("__main__.py")) return "__main__.py"
      return "Not detected"

    case "java":
      const mainClass = contents.find((path) => path.includes("Main.java") || path.includes("Application.java"))
      return mainClass || "Not detected"

    case "linux-kernel":
      return "init/main.c"

    default:
      return "Not detected"
  }
}

/**
 * Detects configuration files in the repository
 */
function detectConfigFiles(contents: string[], repoType: string): string[] {
  const configFiles: string[] = []

  // Common config files
  if (contents.includes(".env")) configFiles.push(".env")
  if (contents.includes(".gitignore")) configFiles.push(".gitignore")
  if (contents.includes(".editorconfig")) configFiles.push(".editorconfig")

  // Type-specific config files
  switch (repoType) {
    case "node":
      if (contents.includes("package.json")) configFiles.push("package.json")
      if (contents.includes("tsconfig.json")) configFiles.push("tsconfig.json")
      if (contents.includes(".eslintrc.json") || contents.includes(".eslintrc.js")) configFiles.push("ESLint config")
      if (contents.includes(".prettierrc") || contents.includes(".prettierrc.js")) configFiles.push("Prettier config")
      if (contents.includes("webpack.config.js")) configFiles.push("webpack.config.js")
      if (contents.includes("babel.config.js") || contents.includes(".babelrc")) configFiles.push("Babel config")
      break

    case "python":
      if (contents.includes("requirements.txt")) configFiles.push("requirements.txt")
      if (contents.includes("setup.py")) configFiles.push("setup.py")
      if (contents.includes("pyproject.toml")) configFiles.push("pyproject.toml")
      if (contents.includes("Pipfile")) configFiles.push("Pipfile")
      if (contents.includes("tox.ini")) configFiles.push("tox.ini")
      if (contents.includes(".flake8") || contents.includes("setup.cfg")) configFiles.push("Flake8 config")
      break

    case "linux-kernel":
      if (contents.includes("Kconfig")) configFiles.push("Kconfig")
      if (contents.includes(".config")) configFiles.push(".config")
      if (contents.includes("arch/x86/configs/")) configFiles.push("Architecture configs")
      break
  }

  return configFiles
}

/**
 * Detects API endpoints in the repository
 */
function detectApiEndpoints(contents: string[], repoType: string, language: string | null): string[] {
  // This is a simplified implementation
  // In a real-world scenario, this would involve parsing code files to extract API routes

  const apiEndpoints: string[] = []

  if (repoType === "node") {
    if (contents.some((path) => path.includes("routes/") || path.includes("api/"))) {
      apiEndpoints.push("API routes detected (see routes/ or api/ directories)")
    }
  }

  if (repoType === "python" && contents.some((path) => path.includes("views.py") || path.includes("routes.py"))) {
    apiEndpoints.push("API routes detected (see views.py or routes.py)")
  }

  return apiEndpoints
}

/**
 * Detects environment variables used in the repository
 */
function detectEnvironmentVariables(contents: string[], repoType: string, language: string | null): string[] {
  // This is a simplified implementation
  // In a real-world scenario, this would involve parsing code files to extract environment variables

  const envVars: string[] = []

  if (contents.includes(".env.example") || contents.includes(".env.sample")) {
    envVars.push("Environment variables detected (see .env.example or .env.sample)")
  }

  return envVars
}

/**
 * Analyzes the code structure of the repository
 */
function analyzeCodeStructure(contents: string[], repoType: string, language: string | null): any {
  // This is a simplified implementation
  // In a real-world scenario, this would involve parsing code files to extract structure

  const structure: any = {
    directories: [],
    mainFiles: [],
    testFiles: [],
    configFiles: [],
    documentationFiles: [],
  }

  // Extract directories
  contents.forEach((path) => {
    if (path.endsWith("/")) {
      structure.directories.push(path)
    } else if (path.includes("test") || path.includes("spec")) {
      structure.testFiles.push(path)
    } else if (path.includes("config") || path.endsWith(".json") || path.endsWith(".yml")) {
      structure.configFiles.push(path)
    } else if (path.includes("README") || path.includes("docs/") || path.endsWith(".md")) {
      structure.documentationFiles.push(path)
    } else {
      structure.mainFiles.push(path)
    }
  })

  return structure
}

/**
 * Detects the Python version used in the repository
 */
function detectPythonVersion(contents: string[]): string {
  // This is a simplified implementation
  // In a real-world scenario, this would involve parsing requirements files

  if (contents.includes("runtime.txt")) {
    return "Specified in runtime.txt"
  }

  return "Not specified"
}

/**
 * Detects the kernel version
 */
function detectKernelVersion(contents: string[]): string {
  // This is a simplified implementation
  // In a real-world scenario, this would involve parsing Makefile or version files

  return "Not detected (would require parsing Makefile or version files)"
}

/**
 * Detects supported architectures in a kernel repository
 */
function detectSupportedArchitectures(contents: string[]): string[] {
  const architectures: string[] = []

  if (contents.some((path) => path.startsWith("arch/x86/"))) architectures.push("x86")
  if (contents.some((path) => path.startsWith("arch/arm/"))) architectures.push("ARM")
  if (contents.some((path) => path.startsWith("arch/arm64/"))) architectures.push("ARM64")
  if (contents.some((path) => path.startsWith("arch/powerpc/"))) architectures.push("PowerPC")
  if (contents.some((path) => path.startsWith("arch/mips/"))) architectures.push("MIPS")
  if (contents.some((path) => path.startsWith("arch/riscv/"))) architectures.push("RISC-V")

  return architectures.length > 0 ? architectures : ["Not detected"]
}

/**
 * Detects web frameworks used in the repository
 */
function detectWebFrameworks(contents: string[], packageJson: any): string[] {
  const frameworks: string[] = []

  if (packageJson?.dependencies?.react || packageJson?.devDependencies?.react) frameworks.push("React")
  if (packageJson?.dependencies?.vue || packageJson?.devDependencies?.vue) frameworks.push("Vue.js")
  if (packageJson?.dependencies?.angular || packageJson?.devDependencies?.angular) frameworks.push("Angular")
  if (packageJson?.dependencies?.next || packageJson?.devDependencies?.next) frameworks.push("Next.js")
  if (packageJson?.dependencies?.nuxt || packageJson?.devDependencies?.nuxt) frameworks.push("Nuxt.js")
  if (packageJson?.dependencies?.svelte || packageJson?.devDependencies?.svelte) frameworks.push("Svelte")

  if (contents.some((path) => path.includes("bootstrap"))) frameworks.push("Bootstrap")
  if (contents.some((path) => path.includes("tailwind"))) frameworks.push("Tailwind CSS")

  return frameworks.length > 0 ? frameworks : ["None detected"]
}

/**
 * Get install command based on language and repository type
 */
function getInstallCommand(language: string | null, repoType: string): string {
  // Repository type-specific commands take precedence
  switch (repoType) {
    case "linux-kernel":
      return "git clone <repository-url>\ncd <repository-directory>"
    case "kernel":
    case "c-system":
      return "git clone <repository-url>\ncd <repository-directory>"
    case "node":
      return "git clone <repository-url>\ncd <repository-directory>\nnpm install"
    case "python":
      return "git clone <repository-url>\ncd <repository-directory>\npip install -r requirements.txt"
    case "data-science":
      return "git clone <repository-url>\ncd <repository-directory>\npip install -r requirements.txt"
    case "web":
      return "git clone <repository-url>\ncd <repository-directory>"
    case "mobile":
      if (language?.toLowerCase() === "swift") {
        return "git clone <repository-url>\ncd <repository-directory>\npod install"
      } else if (language?.toLowerCase() === "kotlin" || language?.toLowerCase() === "java") {
        return "git clone <repository-url>\ncd <repository-directory>\n./gradlew build"
      }
      return "git clone <repository-url>\ncd <repository-directory>"
  }

  // Language-specific commands as fallback
  switch (language?.toLowerCase()) {
    case "javascript":
    case "typescript":
      return "git clone <repository-url>\ncd <repository-directory>\nnpm install"
    case "python":
      return "git clone <repository-url>\ncd <repository-directory>\npip install -r requirements.txt"
    case "java":
      return "git clone <repository-url>\ncd <repository-directory>\n./mvnw install"
    case "ruby":
      return "git clone <repository-url>\ncd <repository-directory>\nbundle install"
    case "go":
      return "git clone <repository-url>\ncd <repository-directory>\ngo mod download"
    case "rust":
      return "git clone <repository-url>\ncd <repository-directory>\ncargo build"
    case "php":
      return "git clone <repository-url>\ncd <repository-directory>\ncomposer install"
    case "c#":
      return "git clone <repository-url>\ncd <repository-directory>\ndotnet restore"
    case "c":
    case "c++":
      return "git clone <repository-url>\ncd <repository-directory>\nmake"
    default:
      return "git clone <repository-url>\ncd <repository-directory>"
  }
}

/**
 * Get build command based on language and repository type
 */
function getBuildCommand(language: string | null, repoType: string): string {
  // Repository type-specific commands take precedence
  switch (repoType) {
    case "linux-kernel":
      return "make defconfig\nmake -j$(nproc)"
    case "kernel":
      return "make -j$(nproc)"
    case "c-system":
      return "make -j$(nproc)"
    case "node":
      return "npm run build"
    case "python":
      return "python setup.py build"
    case "web":
      return "npm run build"
    case "mobile":
      if (language?.toLowerCase() === "swift") {
        return "xcodebuild -workspace YourApp.xcworkspace -scheme YourApp -configuration Release"
      } else if (language?.toLowerCase() === "kotlin" || language?.toLowerCase() === "java") {
        return "./gradlew assembleRelease"
      }
      return "# See project documentation for build instructions"
  }

  // Language-specific commands as fallback
  switch (language?.toLowerCase()) {
    case "javascript":
    case "typescript":
      return "npm run build"
    case "python":
      return "python setup.py build"
    case "java":
      return "./mvnw package"
    case "ruby":
      return "bundle exec rake build"
    case "go":
      return "go build ./..."
    case "rust":
      return "cargo build --release"
    case "php":
      return "composer dump-autoload -o"
    case "c#":
      return "dotnet build --configuration Release"
    case "c":
    case "c++":
      return "make"
    default:
      return "# See project documentation for build instructions"
  }
}

/**
 * Get run command based on language and repository type
 */
function getRunCommand(language: string | null, repoType: string): string {
  // Repository type-specific commands take precedence
  switch (repoType) {
    case "linux-kernel":
      return "# To boot the kernel:\n# 1. Install the kernel: sudo make modules_install install\n# 2. Update bootloader: sudo update-grub\n# 3. Reboot: sudo reboot"
    case "kernel":
      return "# Follow specific instructions in the repository documentation for running this kernel"
    case "c-system":
      return "./bin/main # or the appropriate executable path"
    case "node":
      return "npm start"
    case "python":
      return "python main.py # or the appropriate entry point"
    case "web":
      return "# For static sites, open index.html in a browser\n# For dynamic sites, follow the framework-specific instructions"
    case "data-science":
      return "jupyter notebook # if notebook files are present\n# or\npython main.py # for script-based projects"
    case "mobile":
      return "# Use the appropriate IDE (Xcode for iOS, Android Studio for Android) to run the app on a simulator or device"
  }

  // Language-specific commands as fallback
  switch (language?.toLowerCase()) {
    case "javascript":
    case "typescript":
      return "npm start"
    case "python":
      return "python main.py"
    case "java":
      return "java -jar target/app.jar"
    case "ruby":
      return "ruby app.rb"
    case "go":
      return "./app # or the appropriate executable name"
    case "rust":
      return "./target/release/app # or the appropriate executable name"
    case "php":
      return "php -S localhost:8000"
    case "c#":
      return "dotnet run"
    case "c":
    case "c++":
      return "./app # or the appropriate executable name"
    default:
      return "# See documentation for running instructions"
  }
}

/**
 * Get test command based on language and repository type
 */
function getTestCommand(language: string | null, repoType: string): string {
  // Repository type-specific commands take precedence
  switch (repoType) {
    case "linux-kernel":
      return "# Run kernel self-tests:\nmake test\n\n# For more comprehensive testing, see the documentation in the 'tools/testing' directory"
    case "node":
      return "npm test"
    case "python":
      return "pytest"
    case "web":
      return "npm test"
    case "data-science":
      return "pytest"
  }

  // Language-specific commands as fallback
  switch (language?.toLowerCase()) {
    case "javascript":
    case "typescript":
      return "npm test"
    case "python":
      return "pytest"
    case "java":
      return "./mvnw test"
    case "ruby":
      return "bundle exec rake test"
    case "go":
      return "go test ./..."
    case "rust":
      return "cargo test"
    case "php":
      return "composer test"
    case "c#":
      return "dotnet test"
    case "c":
    case "c++":
      return "make test"
    default:
      return "# See documentation for testing instructions"
  }
}

// First, let's add a function to analyze existing markdown files in a repository
async function analyzeExistingMarkdown(
  repo: Repository,
  contents: string[] = [],
): Promise<{
  style: string
  headers: string[]
  format: string
}> {
  // Look for markdown files in the repository
  const markdownFiles = contents.filter(
    (path) => path.toLowerCase().endsWith(".md") || path.toLowerCase().endsWith(".markdown"),
  )

  // Default structure if no markdown files are found
  const defaultAnalysis = {
    style: "standard",
    headers: ["# ", "## ", "### ", "#### "],
    format: "github-flavored",
  }

  // If no markdown files are found, return default
  if (markdownFiles.length === 0) {
    return defaultAnalysis
  }

  try {
    // For a real implementation, we would fetch and analyze the content of markdown files
    // Here we'll return a default structure as a placeholder
    return defaultAnalysis
  } catch (error) {
    console.error("Error analyzing existing markdown:", error)
    return defaultAnalysis
  }
}

// Find the generateRepositoryInsights function and update it to handle undefined values and focus on positive aspects

// Update the repository insights generation to handle undefined values and focus on positive aspects
export function generateRepositoryInsights(repo: Repository, contents: string[] = [], analysis: any = null): string {
  // Make sure repo is defined
  if (!repo) {
    return "Repository information is unavailable."
  }

  // Make sure contents is an array
  const safeContents = Array.isArray(contents) ? contents : []

  // If analysis is not provided, generate it
  if (!analysis) {
    const repoType = detectRepositoryType(repo, safeContents)
    analysis = {
      repoType,
      // Add other basic properties
    }
  }

  // Format dates with validation
  let createdDate = "Not available"
  let updatedDate = "Not available"

  try {
    if (repo.created_at && !isNaN(new Date(repo.created_at).getTime())) {
      createdDate = new Date(repo.created_at).toLocaleDateString()
    }
  } catch (error) {
    console.error("Error formatting created date:", error)
  }

  try {
    if (repo.updated_at && !isNaN(new Date(repo.updated_at).getTime())) {
      updatedDate = new Date(repo.updated_at).toLocaleDateString()
    }
  } catch (error) {
    console.error("Error formatting updated date:", error)
  }

  // Calculate repository age with validation
  let ageInfo = ""
  try {
    if (repo.created_at && !isNaN(new Date(repo.created_at).getTime())) {
      const ageInDays = Math.floor((Date.now() - new Date(repo.created_at).getTime()) / (1000 * 60 * 60 * 24))
      const ageInYears = (ageInDays / 365).toFixed(1)
      ageInfo = `- **Age**: Approximately ${ageInYears} years old (${ageInDays} days)`
    }
  } catch (error) {
    console.error("Error calculating repository age:", error)
  }

  // Safe access to repository properties with defaults
  const repoName = repo.name || "Repository"
  const repoDescription = repo.description || "A software project"
  const repoOwnerLogin = repo.owner?.login || "owner"
  const repoOwnerUrl = repo.owner?.html_url || "#"
  const repoFullName = repo.full_name || `${repoOwnerLogin}/${repoName}`
  const repoUrl = repo.html_url || "#"
  const repoLanguage = repo.language || "Not specified"
  const repoLicense = repo.license?.name || "Not specified"
  const repoStars = repo.stargazers_count || 0
  const repoForks = repo.forks_count || 0
  const repoIssues = repo.open_issues_count || 0
  const repoTopics = repo.topics || []
  const repoHomepage = repo.homepage || ""

  // Generate the README content with focus on positive aspects
  let readme = `# ${repoName}

${repoDescription}

`

  // Only add badges if we have valid data
  if (repoLicense !== "Not specified") {
    readme += `![License](https://img.shields.io/badge/license-${encodeURIComponent(repoLicense)}-blue.svg) `
  }

  if (repoLanguage !== "Not specified") {
    readme += `![Language](https://img.shields.io/badge/language-${encodeURIComponent(repoLanguage)}-orange.svg) `
  }

  readme += `![Stars](https://img.shields.io/github/stars/${repoFullName}?style=social)

## Overview

**${repoName}** is a ${repoLanguage !== "Not specified" ? repoLanguage : "multi-language"} repository`

  if (createdDate !== "Not available") {
    readme += ` created on ${createdDate}`
  }

  readme += `. ${repoDescription}

### Key Statistics

`

  // Only include positive or non-zero metrics
  const stats = []

  if (repoStars > 0) {
    stats.push(`- **Stars**: ${repoStars}`)
  }

  if (repoForks > 0) {
    stats.push(`- **Forks**: ${repoForks}`)
  }

  if (repoIssues > 0) {
    stats.push(`- **Open Issues**: ${repoIssues}`)
  }

  if (repoLicense !== "Not specified") {
    stats.push(`- **License**: ${repoLicense}`)
  }

  if (updatedDate !== "Not available") {
    stats.push(`- **Last Updated**: ${updatedDate}`)
  }

  if (ageInfo) {
    stats.push(ageInfo)
  }

  // If we have no stats, add a placeholder
  if (stats.length === 0) {
    stats.push("- Repository statistics are not available")
  }

  readme += stats.join("\n")

  // Only add topics if we have them
  if (repoTopics && repoTopics.length > 0) {
    readme += `

### Topics/Tags

${repoTopics.map((topic) => `- ${topic}`).join("\n")}`
  }

  readme += `

## Installation

\`\`\`bash
${getInstallCommand(repoLanguage, analysis.repoType)}
\`\`\`

## Usage

\`\`\`bash
${getRunCommand(repoLanguage, analysis.repoType)}
\`\`\`

## Project Analysis

`

  if (repoLanguage !== "Not specified") {
    readme += `The primary language used in this repository is **${repoLanguage}**. ${getLanguageInsight(repoLanguage)}

`
  } else {
    readme += `This repository uses multiple programming languages or the primary language is not detected.

`
  }

  readme += generateComprehensiveInsights(repo, analysis, safeContents)

  readme += `

## Potential Use Cases

${getUseCases(repo, analysis.repoType)}

## Repository Structure

`

  // Only include positive aspects of the repository structure
  const structureItems = []

  if (analysis.hasTests) {
    structureItems.push("- **Tests**: Test files are present")
  }

  if (analysis.hasDocs) {
    structureItems.push("- **Documentation**: Documentation files are present")
  }

  if (analysis.hasCI) {
    structureItems.push("- **CI/CD**: Continuous Integration configuration is present")
  }

  if (analysis.hasContributing) {
    structureItems.push("- **Contributing Guidelines**: Present")
  }

  if (analysis.hasChangelog) {
    structureItems.push("- **Changelog**: Present")
  }

  // If we have no structure items, add a placeholder
  if (structureItems.length === 0) {
    structureItems.push("- Basic repository structure with source code")
  }

  readme += structureItems.join("\n")

  readme += `

## License

${analysis.license ? `This project is licensed under the ${analysis.license}.` : "No license information found in this repository."}

## Additional Resources

- [Repository Homepage](${repoUrl})`

  if (repoHomepage) {
    readme += `
- [Project Website](${repoHomepage})`
  }

  readme += `

---

*This README was automatically generated based on repository metadata and code analysis.*`

  return readme
}

// Keep all the existing helper functions...
// (generateComprehensiveInsights, getUseCases, getLanguageInsight, etc.)

/**
 * Generates comprehensive insights about a repository in markdown format
 */
export function generateRepositoryInsights_old(
  repo: Repository,
  contents: string[] = [],
  analysis: any = null,
): string {
  // Make sure repo is defined
  if (!repo) {
    return "Repository information is unavailable."
  }

  // Make sure contents is an array
  const safeContents = Array.isArray(contents) ? contents : []

  // If analysis is not provided, generate it
  if (!analysis) {
    const repoType = detectRepositoryType(repo, safeContents)
    analysis = {
      repoType,
      // Add other basic properties
    }
  }

  // Format dates
  const createdDate = new Date(repo.created_at).toLocaleDateString()
  const updatedDate = new Date(repo.updated_at).toLocaleDateString()

  // Calculate repository age
  const ageInDays = Math.floor((Date.now() - new Date(repo.created_at).getTime()) / (1000 * 60 * 60 * 24))
  const ageInYears = (ageInDays / 365).toFixed(1)

  // Determine activity level
  let activityLevel = "low"
  const daysSinceUpdate = Math.floor((Date.now() - new Date(repo.updated_at).getTime()) / (1000 * 60 * 60 * 24))

  if (daysSinceUpdate < 30) {
    activityLevel = "high"
  } else if (daysSinceUpdate < 90) {
    activityLevel = "medium"
  }

  // Determine popularity level based on stars
  let popularityLevel = "low"
  if (repo.stargazers_count > 1000) {
    popularityLevel = "very high"
  } else if (repo.stargazers_count > 100) {
    popularityLevel = "high"
  } else if (repo.stargazers_count > 10) {
    popularityLevel = "medium"
  }

  // Generate repository-type specific insights
  let typeSpecificInsights = ""
  if (analysis.repoType === "linux-kernel") {
    typeSpecificInsights = `
## Linux Kernel Specific Analysis

This repository appears to be a Linux kernel source tree or derivative. The Linux kernel is the core component of Linux operating systems and is responsible for managing system resources, hardware interactions, and providing essential services to user-space applications.

Key components typically include:
- **Kernel core**: Memory management, process scheduling, system calls
- **Device drivers**: Hardware support for various devices
- **File systems**: Support for different file system formats
- **Networking**: Network protocol implementations
- **Architecture-specific code**: Support for different CPU architectures

Building and running a kernel requires specific steps including configuration, compilation, and installation. This is not a typical application that can be "run" with a simple command.

### Architecture Support
${
  analysis.architectures && analysis.architectures.length > 0
    ? `This kernel appears to support the following architectures: ${analysis.architectures.join(", ")}`
    : "Architecture support information not detected."
}

### Key Subsystems
${analysis.hasDrivers ? "- **Drivers**: Device driver support is included" : ""}
${analysis.hasFilesystems ? "- **Filesystems**: Filesystem implementations are included" : ""}
${analysis.hasNetworking ? "- **Networking**: Network protocol implementations are included" : ""}
`
  } else if (analysis.repoType === "node") {
    typeSpecificInsights = `
## Node.js Project Analysis

This repository is a Node.js project. ${analysis.hasTypeScript ? "It uses TypeScript for type safety." : "It is written in JavaScript."}

### Framework Detection
${analysis.hasReact ? "- **React**: This project uses React for UI components" : ""}
${analysis.hasNextJs ? "- **Next.js**: This project is built with the Next.js framework" : ""}

### Package Information
- **Node Version**: ${analysis.nodeVersion || "Not specified"}
- **NPM Version**: ${analysis.npmVersion || "Not specified"}
- **Dependencies**: ${analysis.dependencies.length} dependencies
- **Dev Dependencies**: ${analysis.devDependencies.length} development dependencies

### Available Scripts
${
  analysis.scripts
    ? Object.entries(analysis.scripts)
        .map(([name, script]) => `- \`npm run ${name}\`: ${script}`)
        .join("\n")
    : "No scripts defined in package.json"
}
`
  } else if (analysis.repoType === "python") {
    typeSpecificInsights = `
## Python Project Analysis

This repository is a Python project. ${analysis.pythonVersion ? `It targets Python version: ${analysis.pythonVersion}` : ""}

### Framework Detection
${analysis.hasDjango ? "- **Django**: This project appears to be a Django web application" : ""}
${analysis.hasFlask ? "- **Flask**: This project appears to be a Flask web application" : ""}

### Dependency Management
${analysis.hasPipenv ? "- Uses **Pipenv** for dependency management" : ""}
${analysis.hasPoetry ? "- Uses **Poetry** for dependency management" : ""}
${analysis.hasSetup ? "- Uses **setup.py** for package installation" : ""}
`
  } else if (analysis.repoType === "web") {
    typeSpecificInsights = `
## Web Project Analysis

This repository is a web project.

### Technologies
${analysis.hasHTML ? "- **HTML**: This project uses HTML for markup" : ""}
${analysis.hasCSS ? "- **CSS**: This project uses CSS for styling" : ""}
${analysis.hasJavaScript ? "- **JavaScript**: This project uses JavaScript for interactivity" : ""}

### Frameworks
${
  analysis.frameworks && analysis.frameworks.length > 0
    ? `This project uses the following frameworks/libraries: ${analysis.frameworks.join(", ")}`
    : "No specific frameworks detected."
}
`
  } else if (analysis.repoType === "data-science") {
    typeSpecificInsights = `
## Data Science Project Analysis

This repository appears to be a data science or machine learning project.

### Project Structure
- ${safeContents.some((path) => path.includes("data/")) ? "**Data**: Contains datasets or data processing scripts" : ""}
- ${safeContents.some((path) => path.includes("notebooks/")) ? "**Notebooks**: Contains Jupyter notebooks for analysis" : ""}
- ${safeContents.some((path) => path.includes("models/")) ? "**Models**: Contains trained models or model definitions" : ""}
- ${safeContents.some((path) => path.includes("visualizations/")) ? "**Visualizations**: Contains data visualization code or outputs" : ""}

### Technologies
${safeContents.some((path) => path.includes("tensorflow")) ? "- **TensorFlow**: Uses TensorFlow for machine learning" : ""}
${safeContents.some((path) => path.includes("pytorch")) ? "- **PyTorch**: Uses PyTorch for machine learning" : ""}
${safeContents.some((path) => path.includes("scikit-learn")) ? "- **Scikit-learn**: Uses Scikit-learn for machine learning" : ""}
${safeContents.some((path) => path.includes("pandas")) ? "- **Pandas**: Uses Pandas for data manipulation" : ""}
${safeContents.some((path) => path.includes("numpy")) ? "- **NumPy**: Uses NumPy for numerical computing" : ""}
`
  } else if (analysis.repoType === "mobile") {
    typeSpecificInsights = `
## Mobile Application Analysis

This repository appears to be a mobile application project.

### Platform
${repo.language === "Swift" ? "- **iOS**: This is an iOS application written in Swift" : ""}
${repo.language === "Objective-C" ? "- **iOS**: This is an iOS application written in Objective-C" : ""}
${repo.language === "Kotlin" ? "- **Android**: This is an Android application written in Kotlin" : ""}
${repo.language === "Java" ? "- **Android**: This is an Android application written in Java" : ""}
${safeContents.some((path) => path.includes("flutter")) ? "- **Cross-platform**: This is a Flutter application" : ""}
${safeContents.some((path) => path.includes("react-native")) ? "- **Cross-platform**: This is a React Native application" : ""}

### Features
${safeContents.some((path) => path.includes("location")) ? "- **Location**: Uses location services" : ""}
${safeContents.some((path) => path.includes("camera")) ? "- **Camera**: Uses camera functionality" : ""}
${safeContents.some((path) => path.includes("notification")) ? "- **Notifications**: Implements push notifications" : ""}
${safeContents.some((path) => path.includes("auth")) ? "- **Authentication**: Implements user authentication" : ""}
`
  }

  // Generate code quality insights
  const codeQualityInsights = `
## Code Quality Analysis

### Repository Structure
- **Main Entry Point**: ${analysis.mainEntryPoint || "Not detected"}
- **Configuration Files**: ${analysis.configFiles && analysis.configFiles.length > 0 ? analysis.configFiles.join(", ") : "None detected"}
- **Testing**: ${analysis.hasTests ? "Test files are present" : "No test files detected"}
- **Documentation**: ${analysis.hasDocs ? "Documentation files are present" : "No documentation files detected"}
- **Continuous Integration**: ${analysis.hasCI ? "CI configuration is present" : "No CI configuration detected"}

### Best Practices
- **Contributing Guidelines**: ${analysis.hasContributing ? "Present" : "Not found"}
- **Changelog**: ${analysis.hasChangelog ? "Present" : "Not found"}
- **License**: ${analysis.license ? analysis.license : "Not specified"}
`

  // Generate security insights
  const securityInsights = `
## Security Considerations

${
  analysis.repoType === "node"
    ? "- **Dependencies**: Regular updates of dependencies are recommended to address security vulnerabilities\n" +
      "- **Input Validation**: Ensure all user inputs are properly validated\n" +
      "- **Authentication**: If implementing authentication, follow security best practices"
    : ""
}

${
  analysis.repoType === "web"
    ? "- **Cross-Site Scripting (XSS)**: Ensure all user-generated content is properly sanitized\n" +
      "- **Cross-Site Request Forgery (CSRF)**: Implement CSRF tokens for forms\n" +
      "- **Content Security Policy**: Consider implementing a CSP to mitigate XSS attacks"
    : ""
}

${
  analysis.repoType === "python"
    ? "- **Input Validation**: Ensure all user inputs are properly validated\n" +
      "- **SQL Injection**: Use parameterized queries or ORM to prevent SQL injection\n" +
      "- **Dependency Management**: Regularly update dependencies to address security vulnerabilities"
    : ""
}

${
  analysis.repoType === "linux-kernel"
    ? "- **Memory Safety**: Carefully manage memory allocations and deallocations\n" +
      "- **Privilege Escalation**: Be cautious with code that runs with elevated privileges\n" +
      "- **Input Validation**: Validate all inputs from user space"
    : ""
}
`

  // Generate performance insights
  const performanceInsights = `
## Performance Considerations

${
  analysis.repoType === "node"
    ? "- **Asynchronous Operations**: Ensure proper use of async/await or Promises\n" +
      "- **Memory Management**: Watch for memory leaks, especially in long-running processes\n" +
      "- **Caching**: Consider implementing caching for frequently accessed data"
    : ""
}

${
  analysis.repoType === "web"
    ? "- **Asset Optimization**: Minimize and compress CSS, JavaScript, and images\n" +
      "- **Lazy Loading**: Implement lazy loading for images and components\n" +
      "- **Code Splitting**: Split code into smaller chunks to improve load times"
    : ""
}

${
  analysis.repoType === "python"
    ? "- **Algorithmic Efficiency**: Review algorithms for time and space complexity\n" +
      "- **Database Queries**: Optimize database queries and consider indexing\n" +
      "- **Concurrency**: Use appropriate concurrency patterns for CPU or I/O bound tasks"
    : ""
}

${
  analysis.repoType === "linux-kernel"
    ? "- **Algorithmic Efficiency**: Kernel code should be optimized for performance\n" +
      "- **Locking**: Minimize lock contention and critical section size\n" +
      "- **Memory Access Patterns**: Optimize memory access patterns for cache efficiency"
    : ""
}
`

  // Generate insights based on repository data
  return `# Repository Insights: ${repo.name}

## Overview

**${repo.name}** is a ${repo.language || "multi-language"} repository created by [${repo.owner.login}](${repo.owner.html_url}) on ${createdDate}. ${repo.description || "No description provided."}

## Key Statistics

- **Stars**: ${repo.stargazers_count}
- **Forks**: ${repo.forks_count}
- **Open Issues**: ${repo.open_issues_count}
- **License**: ${repo.license?.name || "Not specified"}
- **Last Updated**: ${updatedDate}

${
  repo.topics.length > 0
    ? `
## Topics/Tags

${repo.topics.map((topic) => `- ${topic}`).join("\n")}
`
    : ""
}

## Technical Analysis

${
  repo.language
    ? `
The primary language used in this repository is **${repo.language}**. ${getLanguageInsight(repo.language)}
`
    : "No primary language has been identified for this repository."
}

${typeSpecificInsights}

${codeQualityInsights}

${securityInsights}

${performanceInsights}

## Repository Maturity

This repository is approximately **${ageInYears} years old** (${ageInDays} days) and shows a **${activityLevel} level of activity** based on recent updates.

The project has a **${popularityLevel} level of community interest** with ${repo.stargazers_count} stars and ${repo.forks_count} forks.

${repo.open_issues_count > 0 ? `There are currently **${repo.open_issues_count} open issues**, which ${repo.open_issues_count > 10 ? "indicates active development and community engagement" : "suggests a manageable project scope"}.` : "There are currently no open issues, which may indicate a stable project or low maintenance requirements."}

## Potential Use Cases

${getUseCases(repo, analysis.repoType)}

## Additional Resources

- [Repository Homepage](${repo.html_url})
${repo.homepage ? `- [Project Website](${repo.homepage})` : ""}

---

*This analysis was generated based on repository metadata and code analysis. For a more comprehensive understanding, consider exploring the repository directly.*
`
}

/**
 * Suggests potential use cases based on repository information and type
 */
function getUseCases(repo: Repository, repoType: string): string {
  if (!repo) return "Based on the repository information, this project could be useful for software development."

  // Repository type-specific use cases take precedence
  switch (repoType) {
    case "linux-kernel":
      return `Based on the repository information, this Linux kernel source could be useful for:
- Operating system development and customization
- Device driver development
- Embedded systems and IoT devices
- Learning about kernel architecture and implementation
- Research in operating systems and computer architecture
- Custom Linux distribution creation`

    case "kernel":
      return `Based on the repository information, this kernel project could be useful for:
- Operating system development
- Embedded systems programming
- System-level software development
- Computer architecture research
- Low-level programming education`

    case "c-system":
      return `Based on the repository information, this C/C++ system software could be useful for:
- System administration and management
- Hardware interaction and control
- Performance-critical applications
- Low-level system utilities
- Cross-platform system tools`

    case "node":
      return `Based on the repository information, this Node.js project could be useful for:
- Web application development
- API development and integration
- Server-side JavaScript applications
- Real-time applications with WebSockets
- Command-line tools and utilities`

    case "python":
      return `Based on the repository information, this Python project could be useful for:
- Data analysis and processing
- Web application development
- Automation and scripting
- Scientific computing and research
- Machine learning and AI applications`

    case "web":
      return `Based on the repository information, this web project could be useful for:
- Frontend web development
- User interface design and implementation
- Web application prototyping
- Learning web development technologies
- Building responsive and interactive websites`

    case "data-science":
      return `Based on the repository information, this data science project could be useful for:
- Data analysis and visualization
- Machine learning model development
- Statistical analysis and research
- Predictive modeling
- Data-driven decision making`

    case "mobile":
      return `Based on the repository information, this mobile application project could be useful for:
- Mobile app development
- Cross-platform mobile development
- User interface design for mobile
- Mobile-specific feature implementation
- Learning mobile development best practices`
  }

  // Default use cases based on language
  let useCases = "Based on the repository information, this project could be useful for:"

  // Add language-specific use cases
  if (repo.language) {
    switch (repo.language.toLowerCase()) {
      case "javascript":
      case "typescript":
        useCases += "\n- Web application development"
        useCases += "\n- Frontend user interfaces"
        if (repo.topics.some((t) => t.includes("node") || t.includes("server") || t.includes("backend"))) {
          useCases += "\n- Backend API services"
        }
        break
      case "python":
        useCases += "\n- Data analysis and visualization"
        useCases += "\n- Automation and scripting"
        if (
          repo.topics.some((t) => t.includes("ml") || t.includes("ai") || t.includes("machine") || t.includes("deep"))
        ) {
          useCases += "\n- Machine learning and AI applications"
        }
        break
      case "java":
      case "kotlin":
        useCases += "\n- Enterprise application development"
        useCases += "\n- Android mobile applications"
        useCases += "\n- Large-scale system architecture"
        break
      case "swift":
        useCases += "\n- iOS and macOS application development"
        useCases += "\n- Apple ecosystem integration"
        break
      case "go":
        useCases += "\n- Cloud-native applications"
        useCases += "\n- Microservices architecture"
        useCases += "\n- High-performance network services"
        break
      case "rust":
        useCases += "\n- Systems programming with memory safety"
        useCases += "\n- Performance-critical applications"
        useCases += "\n- WebAssembly development"
        break
      case "c":
      case "c++":
        useCases += "\n- System-level programming"
        useCases += "\n- Performance-critical applications"
        useCases += "\n- Hardware interaction"
        useCases += "\n- Embedded systems development"
        break
      default:
        useCases += "\n- Software development and collaboration"
        useCases += "\n- Code sharing and version control"
    }
  }

  // Add topic-based use cases
  if (repo.topics.length > 0) {
    if (repo.topics.some((t) => t.includes("api") || t.includes("rest") || t.includes("graphql"))) {
      useCases += "\n- API development and integration"
    }
    if (repo.topics.some((t) => t.includes("ui") || t.includes("ux") || t.includes("interface"))) {
      useCases += "\n- User interface design and implementation"
    }
    if (repo.topics.some((t) => t.includes("data") || t.includes("analytics"))) {
      useCases += "\n- Data processing and analytics"
    }
    if (repo.topics.some((t) => t.includes("tool") || t.includes("utility"))) {
      useCases += "\n- Developer tooling and utilities"
    }
  }

  return useCases
}

/**
 * Provides insights about a programming language
 */
function getLanguageInsight(language: string): string {
  if (!language) return ""

  const insights: Record<string, string> = {
    JavaScript: "JavaScript is widely used for web development, both frontend and backend (with Node.js).",
    TypeScript: "TypeScript adds static typing to JavaScript, enhancing code quality and developer experience.",
    Python:
      "Python is known for its simplicity and readability, commonly used in data science, AI, web development, and automation.",
    Java: "Java is a versatile, object-oriented language used in enterprise applications, Android development, and large-scale systems.",
    "C#": "C# is primarily used for Windows applications, game development with Unity, and web applications with ASP.NET.",
    PHP: "PHP is commonly used for web development and powers many content management systems like WordPress.",
    Ruby: "Ruby emphasizes simplicity and productivity, and is known for the Ruby on Rails web framework.",
    Go: "Go (Golang) is designed for simplicity, efficiency, and strong concurrency support, popular for cloud and network services.",
    Rust: "Rust focuses on safety and performance, particularly memory safety without garbage collection.",
    "C++":
      "C++ provides high performance and low-level memory manipulation, used in game engines, system software, and performance-critical applications.",
    C: "C is a low-level language used for operating systems, embedded systems, and performance-critical applications.",
    Swift: "Swift is Apple's language for iOS, macOS, watchOS, and tvOS application development.",
    Kotlin: "Kotlin is a modern alternative to Java, officially supported for Android development.",
    Dart: "Dart is used with the Flutter framework for cross-platform mobile application development.",
    HTML: "HTML is the standard markup language for creating web pages and web applications.",
    CSS: "CSS is used for styling and laying out web pages.",
    Shell: "Shell scripts automate system administration tasks and build processes.",
    R: "R is a language and environment for statistical computing and graphics, commonly used in data analysis.",
    "Jupyter Notebook": "Jupyter Notebooks provide an interactive computing environment for data science and research.",
    Scala: "Scala combines object-oriented and functional programming, often used for big data processing.",
    Haskell: "Haskell is a purely functional programming language with strong static typing and lazy evaluation.",
    Clojure: "Clojure is a dynamic, functional Lisp dialect that runs on the JVM, emphasizing immutability.",
    Elixir:
      "Elixir is a functional, concurrent language built on the Erlang VM, designed for scalability and maintainability.",
  }

  return insights[language] || `${language} is used for software development in this project.`
}

/**
 * Analyzes a user's repositories and returns an analysis object
 */
export function analyzeUserRepositories(user: UserProfile, repos: Repository[]): UserAnalysis {
  const topLanguages: { [language: string]: number } = {}
  const topTopics: string[] = []
  let totalStars = 0
  let totalForks = 0

  repos.forEach((repo) => {
    // Count languages
    if (repo.language) {
      topLanguages[repo.language] = (topLanguages[repo.language] || 0) + 1
    }

    // Collect topics
    if (repo.topics) {
      repo.topics.forEach((topic) => {
        if (!topTopics.includes(topic)) {
          topTopics.push(topic)
        }
      })
    }

    totalStars += repo.stargazers_count
    totalForks += repo.forks_count
  })

  // Sort languages by count
  const sortedLanguages = Object.entries(topLanguages)
    .sort(([, a], [, b]) => b - a)
    .reduce(
      (obj, [key, value]) => {
        obj[key] = value
        return obj
      },
      {} as { [language: string]: number },
    )

  // Select featured repos (e.g., most starred)
  const featuredRepos = repos.sort((a, b) => b.stargazers_count - a.stargazers_count).slice(0, 3)

  // Select recent activity (e.g., recently updated)
  const recentActivity = repos
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 5)

  const analysis: UserAnalysis = {
    username: user.login,
    name: user.name,
    bio: user.bio,
    location: user.location,
    company: user.company,
    blog: user.blog,
    twitter: user.twitter_username,
    email: user.email,
    followers: user.followers,
    following: user.following,
    totalStars: totalStars,
    totalForks: totalForks,
    totalRepos: repos.length,
    topLanguages: sortedLanguages,
    topTopics: topTopics.slice(0, 10), // Limit to top 10 topics
    featuredRepos: featuredRepos,
    recentActivity: recentActivity,
  }

  return analysis
}

/**
 * Generates enhanced insights about a user profile in markdown format
 */
export function generateProfileInsights(profile: UserProfile, repos: Repository[]): string {
  const analysis = analyzeUserRepositories(profile, repos)

  // Calculate contribution frequency (approx)
  const sortedByDate = [...repos].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())

  let contributionFrequency = "infrequent"
  if (sortedByDate.length > 0) {
    const mostRecentDate = new Date(sortedByDate[0].updated_at)
    const daysSinceLastContribution = Math.floor((Date.now() - mostRecentDate.getTime()) / (1000 * 60 * 60 * 24))

    if (daysSinceLastContribution < 7) {
      contributionFrequency = "very active"
    } else if (daysSinceLastContribution < 30) {
      contributionFrequency = "active"
    } else if (daysSinceLastContribution < 90) {
      contributionFrequency = "moderately active"
    }
  }

  // Calculate project diversity
  const uniqueLanguages = Object.keys(analysis.topLanguages).length
  const languageDiversity =
    uniqueLanguages > 5
      ? "highly diverse"
      : uniqueLanguages > 3
        ? "diverse"
        : uniqueLanguages > 1
          ? "somewhat specialized"
          : "specialized"

  // Identify collaboration patterns
  const collaborationScore = repos.reduce((sum, repo) => sum + repo.forks_count, 0) / repos.length
  const collaborationLevel =
    collaborationScore > 10
      ? "high collaboration"
      : collaborationScore > 3
        ? "moderate collaboration"
        : "individual contributor"

  return `# Developer Profile Analysis: ${profile.login}

## Career Insights

**${profile.login}** is a ${contributionFrequency} developer with a ${languageDiversity} technical portfolio, showing ${collaborationLevel} patterns. With ${analysis.totalRepos} public repositories and ${analysis.totalStars} total stars, this developer has demonstrated expertise primarily in ${Object.keys(analysis.topLanguages).slice(0, 3).join(", ")}.

## Technical Profile

### Primary Languages
${Object.entries(analysis.topLanguages)
  .slice(0, 5)
  .map(([lang, count]) => `- **${lang}**: ${count} repositories`)
  .join("\n")}

### Technical Focus
${
  analysis.topTopics.length > 0
    ? analysis.topTopics
        .slice(0, 8)
        .map((topic) => `- ${formatTopic(topic)}`)
        .join("\n")
    : "No specific technical focus identified from repository topics."
}

## Project Portfolio

${generatePortfolioSummary(analysis)}

## Contribution Analysis

- **Contribution Frequency**: ${contributionFrequency}
- **Language Diversity**: ${languageDiversity} (${uniqueLanguages} languages)
- **Collaboration Style**: ${collaborationLevel}
- **Repository Impact**: Average of ${(analysis.totalStars / analysis.totalRepos).toFixed(1)} stars per repository
- **Community Engagement**: ${analysis.followers} followers and following ${analysis.following} users

## Professional Recommendations

Based on this developer's profile, they would be well-suited for:

${generateCareerRecommendations(analysis)}

---

*This analysis was generated based on public GitHub data.*`
}

/**
 * Generate a portfolio summary from the user analysis
 */
function generatePortfolioSummary(analysis: UserAnalysis): string {
  if (!analysis || !analysis.featuredRepos || analysis.featuredRepos.length === 0) {
    return "No notable projects found."
  }

  // Identify the most significant projects
  const sortedProjects = [...analysis.featuredRepos].sort(
    (a, b) => b.stargazers_count + b.forks_count - (a.stargazers_count + a.forks_count),
  )

  const projectsAnalysis = sortedProjects
    .slice(0, 3)
    .map((repo) => {
      const impact = repo.stargazers_count > 50 ? "high-impact" : repo.stargazers_count > 10 ? "notable" : "promising"

      return `### [${repo.name}](${repo.html_url})
A ${impact} ${repo.language || "multi-language"} project with ${repo.stargazers_count} stars and ${repo.forks_count} forks.
${repo.description ? `> ${repo.description}` : "No description provided."}`
    })
    .join("\n\n")

  return projectsAnalysis
}

/**
 * Generate career recommendations based on user profile
 */
function generateCareerRecommendations(analysis: UserAnalysis): string {
  const languages = Object.keys(analysis.topLanguages)
  const recommendations: string[] = []

  // Language-based recommendations
  if (languages.includes("JavaScript") || languages.includes("TypeScript")) {
    recommendations.push("- **Frontend Engineering**: Developing responsive web applications")
  }

  if (languages.includes("Python")) {
    if (analysis.topTopics.some((t) => t.includes("ml") || t.includes("ai") || t.includes("data"))) {
      recommendations.push("- **Data Science/Machine Learning**: Building and deploying ML models")
    } else {
      recommendations.push("- **Python Development**: Building backends, automation, or data processing systems")
    }
  }

  if (languages.includes("Java") || languages.includes("C#")) {
    recommendations.push("- **Enterprise Software Development**: Building robust business applications")
  }

  if (languages.includes("Go") || languages.includes("Rust")) {
    recommendations.push("- **Systems Programming**: Developing high-performance infrastructure software")
  }

  if (languages.includes("Swift") || languages.includes("Kotlin")) {
    recommendations.push("- **Mobile Application Development**: Creating native mobile experiences")
  }

  // Topic-based recommendations
  if (analysis.topTopics.some((t) => t.includes("api") || t.includes("server") || t.includes("backend"))) {
    recommendations.push("- **Backend Engineering**: Designing and implementing APIs and services")
  }

  if (analysis.topTopics.some((t) => t.includes("devops") || t.includes("docker") || t.includes("kubernetes"))) {
    recommendations.push("- **DevOps/Infrastructure**: Managing cloud infrastructure and CI/CD pipelines")
  }

  // Add default recommendation if none found
  if (recommendations.length === 0) {
    recommendations.push("- **Software Engineering**: General software development across various domains")
  }

  return recommendations.join("\n")
}

/**
 * Generates a user profile README with enhanced AI insights
 */
function createUserProfileReadme(analysis: UserAnalysis): string {
  // Get language badges
  const languageBadges = Object.keys(analysis.topLanguages)
    .slice(0, 5)
    .map(
      (lang) =>
        `![${lang}](https://img.shields.io/badge/-${encodeURIComponent(lang)}-blue?style=flat-square&logo=${lang.toLowerCase()})`,
    )
    .join(" ")

  // Create a brief introduction based on the user's top languages and interests
  const introduction = generatePersonalizedIntro(analysis)

  return `# Hi there 👋, I'm ${analysis.name || analysis.username}

${analysis.bio || introduction}

## About Me

- 📍 ${analysis.location || "Earth"}
- 🏢 ${analysis.company || ""}
${analysis.blog ? `- 🌐 [Website](${analysis.blog})` : ""}
${analysis.twitter ? `- 🐦 [Twitter](https://twitter.com/${analysis.twitter})` : ""}
${analysis.email ? `- 📫 [Email](mailto:${analysis.email})` : ""}

## 🔧 Technologies & Skills

${languageBadges}

${generateSkillsSection(analysis)}

${generateProjectHighlights(analysis)}

## 📝 Recent Activity

${analysis.recentActivity.map((repo: any) => `- Updated [${repo.name}](${repo.html_url}) on ${new Date(repo.updated_at).toLocaleDateString()}`).join("\n")}

---

<p align="center">
  <img src="https://komarev.com/ghpvc/?username=${analysis.username}" alt="Profile views" />
</p>

*This profile README was generated with the GitHub README Generator.*
`
}

/**
 * Generates a personalized introduction based on user analysis
 */
function generatePersonalizedIntro(analysis: UserAnalysis): string {
  if (!analysis || !analysis.topLanguages) {
    return "I'm a developer passionate about building software and sharing my work with the community."
  }

  const languages = Object.keys(analysis.topLanguages)
  const mainLanguage = languages.length > 0 ? languages[0] : null

  if (!mainLanguage) {
    return "I'm a developer passionate about building software and sharing my work with the community."
  }

  const languageDescriptions: Record<string, string> = {
    JavaScript: "web development",
    TypeScript: "type-safe web applications",
    Python: "data science and automation",
    Java: "enterprise applications",
    "C#": ".NET development",
    Go: "high-performance systems",
    Rust: "systems programming",
    PHP: "web applications",
    Ruby: "elegant web solutions",
    Swift: "iOS applications",
    Kotlin: "Android development",
    C: "low-level systems",
    "C++": "performance-critical applications",
  }

  const description = languageDescriptions[mainLanguage] || "software development"

  return `I'm a developer specializing in ${description} with ${languages.length > 1 ? `experience in ${languages.slice(1, 3).join(", ")}` : "a passion for coding"}. With ${analysis.totalRepos} public repositories and ${analysis.totalStars} stars, I enjoy building and sharing projects with the community.`
}

/**
 * Generates a skills section based on languages and topics
 */
function generateSkillsSection(analysis: UserAnalysis): string {
  if (!analysis || !analysis.topTopics || analysis.topTopics.length === 0) {
    return ""
  }

  return `### Areas of Interest
${analysis.topTopics.map((topic) => `- ${formatTopic(topic)}`).join("\n")}
`
}

/**
 * Format a topic with proper capitalization
 */
function formatTopic(topic: string): string {
  if (!topic) return ""

  // Handle special cases like "api", "ui", "ux"
  if (topic.toLowerCase() === "api") return "API"
  if (topic.toLowerCase() === "ui") return "UI"
  if (topic.toLowerCase() === "ux") return "UX"
  if (topic.toLowerCase() === "css") return "CSS"
  if (topic.toLowerCase() === "html") return "HTML"
  if (topic.toLowerCase() === "js") return "JavaScript"
  if (topic.toLowerCase() === "ts") return "TypeScript"

  // Split by hyphens and capitalize each word
  return topic
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

/**
 * Generates project highlights section
 */
function generateProjectHighlights(analysis: UserAnalysis): string {
  if (!analysis || !analysis.featuredRepos || analysis.featuredRepos.length === 0) {
    return ""
  }

  return `## 🏆 Featured Projects

${analysis.featuredRepos
  .map(
    (repo) =>
      `### [${repo.name}](${repo.html_url})
${repo.description ? `> ${repo.description}` : ""}
${repo.language ? `**Language**: ${repo.language}` : ""} ⭐ ${repo.stargazers_count} stars
`,
  )
  .join("\n")}`
}

/**
 * Generates a README file based on repository analysis
 */
async function generateReadmeFromAnalysis_old(
  repo: Repository,
  contents: string[] = [],
  packageJson: any = null,
): Promise<string> {
  const analysis = await analyzeRepository(repo, contents, packageJson)
  return generateRepositoryInsights(repo, contents, analysis)
}

/**
 * Generates a README file based on repository analysis
 */
async function generateComprehensiveInsights(
  repo: Repository,
  analysis: any,
  contents: string[] = [],
): Promise<string> {
  let insights = ""

  if (analysis.hasTests) {
    insights += "- **Tests**: Test files are present\n"
  }

  if (analysis.hasDocs) {
    insights += "- **Documentation**: Documentation files are present\n"
  }

  if (analysis.hasCI) {
    insights += "- **CI/CD**: Continuous Integration configuration is present\n"
  }

  if (analysis.hasContributing) {
    insights += "- **Contributing Guidelines**: Present\n"
  }

  if (analysis.hasChangelog) {
    insights += "- **Changelog**: Present\n"
  }

  if (analysis.dependencies && analysis.dependencies.length > 0) {
    insights += `- **Dependencies**: ${analysis.dependencies.length} dependencies\n`
  }

  if (analysis.devDependencies && analysis.devDependencies.length > 0) {
    insights += `- **Dev Dependencies**: ${analysis.devDependencies.length} development dependencies\n`
  }

  if (analysis.peerDependencies && analysis.peerDependencies.length > 0) {
    insights += `- **Peer Dependencies**: ${analysis.peerDependencies.length} peer dependencies\n`
  }

  if (analysis.configFiles && analysis.configFiles.length > 0) {
    insights += `- **Configuration Files**: ${analysis.configFiles.join(", ")}\n`
  }

  if (analysis.apiEndpoints && analysis.apiEndpoints.length > 0) {
    insights += `- **API Endpoints**: ${analysis.apiEndpoints.join(", ")}\n`
  }

  if (analysis.environmentVariables && analysis.environmentVariables.length > 0) {
    insights += `- **Environment Variables**: ${analysis.environmentVariables.join(", ")}\n`
  }

  if (analysis.codeStructure) {
    insights += `- **Code Structure**: Analyzed code structure\n`
  }

  if (analysis.nodeVersion) {
    insights += `- **Node Version**: ${analysis.nodeVersion}\n`
  }

  if (analysis.npmVersion) {
    insights += `- **NPM Version**: ${analysis.npmVersion}\n`
  }

  if (analysis.hasTypeScript) {
    insights += `- **TypeScript**: This project uses TypeScript\n`
  }

  if (analysis.hasReact) {
    insights += `- **React**: This project uses React\n`
  }

  if (analysis.hasNextJs) {
    insights += `- **Next.js**: This project uses Next.js\n`
  }

  if (analysis.scripts) {
    insights += `- **Scripts**: Available scripts in package.json\n`
  }

  if (analysis.pythonVersion) {
    insights += `- **Python Version**: ${analysis.pythonVersion}\n`
  }

  if (analysis.hasPipenv) {
    insights += `- **Pipenv**: This project uses Pipenv\n`
  }

  if (analysis.hasPoetry) {
    insights += `- **Poetry**: This project uses Poetry\n`
  }

  if (analysis.hasSetup) {
    insights += `- **Setup.py**: This project uses setup.py\n`
  }

  if (analysis.hasDjango) {
    insights += `- **Django**: This project uses Django\n`
  }

  if (analysis.hasFlask) {
    insights += `- **Flask**: This project uses Flask\n`
  }

  if (analysis.kernelVersion) {
    insights += `- **Kernel Version**: ${analysis.kernelVersion}\n`
  }

  if (analysis.architectures) {
    insights += `- **Architectures**: ${analysis.architectures.join(", ")}\n`
  }

  if (analysis.hasDrivers) {
    insights += `- **Drivers**: This project has drivers\n`
  }

  if (analysis.hasFilesystems) {
    insights += `- **Filesystems**: This project has filesystems\n`
  }

  if (analysis.hasNetworking) {
    insights += `- **Networking**: This project has networking\n`
  }

  if (analysis.hasJavaScript) {
    insights += `- **JavaScript**: This project uses JavaScript\n`
  }

  if (analysis.hasCSS) {
    insights += `- **CSS**: This project uses CSS\n`
  }

  if (analysis.hasHTML) {
    insights += `- **HTML**: This project uses HTML\n`
  }

  if (analysis.frameworks) {
    insights += `- **Frameworks**: ${analysis.frameworks.join(", ")}\n`
  }

  if (insights === "") {
    insights = "No specific insights found for this repository."
  }

  return insights
}

// Update the generateReadmeFromAnalysis function to use our learning-based approach
export async function generateReadmeFromAnalysis(analysis: any): Promise<string> {
  try {
    if (!analysis) {
      throw new Error("Analysis object is undefined or null")
    }

    // Create a minimal repository object from the analysis
    const repo: Repository = {
      name: analysis.name,
      description: analysis.description,
      language: analysis.language,
      topics: analysis.topics || [],
      license: analysis.license ? { name: analysis.license, key: "", url: "" } : null,
      owner: { login: analysis.owner || "owner", avatar_url: "", html_url: "" },
      full_name: analysis.fullName || `${analysis.owner || "owner"}/${analysis.name}`,
      html_url: "",
      created_at: analysis.createdAt || new Date().toISOString(),
      updated_at: analysis.updatedAt || new Date().toISOString(),
      pushed_at: "",
      homepage: analysis.homepage || "",
      size: 0,
      stargazers_count: analysis.stars || 0,
      watchers_count: 0,
      forks_count: analysis.forks || 0,
      open_issues_count: analysis.openIssues || 0,
      default_branch: analysis.defaultBranch || "main",
      private: false,
      fork: false,
      url: "",
      visibility: "public",
    }

    // Use our learning-based approach to generate the README
    return await generateReadmeFromLearning(repo, analysis)
  } catch (error) {
    console.error("Error generating README content:", error)
    return `# ${analysis?.name || "Project"}

${analysis?.description || "No description available."}

## Error

There was an error generating the complete README. Please check the repository details and try again.
`
  }
}

// Keep all the existing command functions...
// (getInstallCommand, getBuildCommand, getRunCommand, getTestCommand)

// Keep all the existing user profile analysis functions...
// (analyzeUserRepositories, generateProfileInsights, etc.)

// Export the functions
export { createUserProfileReadme }

