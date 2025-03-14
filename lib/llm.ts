"use server"

import type { Repository } from "./types"

// Interface for repository analysis
interface RepositoryAnalysis {
  name: string
  description: string
  language: string
  topics: string[]
  structure: string[]
  license: string | null
  hasTests: boolean
  hasDocs: boolean
  hasCI: boolean
  installCommand: string
  runCommand: string
  packageJson: any | null
  dependencies: string[]
  devDependencies: string[]
}

// This function analyzes a repository based on its metadata and contents
export async function analyzeRepository(
  repo: Repository,
  contents: string[],
  packageJson: any | null,
): Promise<RepositoryAnalysis> {
  // Determine if the repository has certain features
  const hasTests = contents.some(
    (path) =>
      path.toLowerCase().includes("test") ||
      path.toLowerCase().includes("spec") ||
      path.toLowerCase().includes("__tests__"),
  )

  const hasDocs = contents.some(
    (path) =>
      path.toLowerCase().includes("docs") ||
      path.toLowerCase().includes("documentation") ||
      path.toLowerCase().includes("wiki") ||
      path.toLowerCase().includes("readme") ||
      path.toLowerCase().includes("contributing"),
  )

  const hasCI = contents.some(
    (path) =>
      path.toLowerCase().includes(".github/workflows") ||
      path.toLowerCase().includes(".travis.yml") ||
      path.toLowerCase().includes("circle.yml") ||
      path.toLowerCase().includes(".gitlab-ci.yml") ||
      path.toLowerCase().includes(".github/actions"),
  )

  // Extract dependencies from package.json if available
  const dependencies = packageJson?.dependencies ? Object.keys(packageJson.dependencies) : []
  const devDependencies = packageJson?.devDependencies ? Object.keys(packageJson.devDependencies) : []

  // File detection helpers
  const hasFile = (filename: string) =>
    contents.some(
      (path) =>
        path.toLowerCase() === filename.toLowerCase() || path.toLowerCase().endsWith(`/${filename.toLowerCase()}`),
    )

  const hasExtension = (ext: string) => contents.some((path) => path.toLowerCase().endsWith(`.${ext.toLowerCase()}`))

  // Detect language and set appropriate commands
  let language = repo.language || "Unknown"
  let installCommand = ""
  let runCommand = ""

  // JavaScript/TypeScript detection
  const hasPackageJson = hasFile("package.json")
  const hasNodeModules = contents.some((path) => path.toLowerCase().includes("node_modules"))
  const hasYarnLock = hasFile("yarn.lock")
  const hasPnpmLock = hasFile("pnpm-lock.yaml")
  const hasNpmLock = hasFile("package-lock.json")
  const hasTsConfig = hasFile("tsconfig.json")
  const hasJsFiles = hasExtension("js")
  const hasTsFiles = hasExtension("ts") || hasExtension("tsx")

  // Python detection
  const hasRequirementsTxt = hasFile("requirements.txt")
  const hasSetupPy = hasFile("setup.py")
  const hasPipfile = hasFile("pipfile")
  const hasPyFiles = hasExtension("py")

  // Ruby detection
  const hasGemfile = hasFile("gemfile")
  const hasRbFiles = hasExtension("rb")

  // Java detection
  const hasPomXml = hasFile("pom.xml")
  const hasGradleFile = hasFile("build.gradle") || hasFile("build.gradle.kts")
  const hasJavaFiles = hasExtension("java")

  // Go detection
  const hasGoMod = hasFile("go.mod")
  const hasGoFiles = hasExtension("go")

  // Rust detection
  const hasCargoToml = hasFile("cargo.toml")
  const hasRustFiles = hasExtension("rs")

  // PHP detection
  const hasComposerJson = hasFile("composer.json")
  const hasPhpFiles = hasExtension("php")

  // C# detection
  const hasCsprojFile = contents.some((path) => path.toLowerCase().endsWith(".csproj"))
  const hasCsFiles = hasExtension("cs")

  // C/C++ detection
  const hasCMake = hasFile("CMakeLists.txt")
  const hasMakefile = hasFile("makefile")
  const hasCFiles = hasExtension("c")
  const hasCppFiles = hasExtension("cpp") || hasExtension("cc") || hasExtension("cxx")

  // Determine language and commands based on file detection
  if (
    language.toLowerCase() === "javascript" ||
    language.toLowerCase() === "typescript" ||
    hasPackageJson ||
    hasJsFiles ||
    hasTsFiles
  ) {
    language = hasTsFiles || hasTsConfig ? "TypeScript" : "JavaScript"

    if (hasPackageJson) {
      if (hasYarnLock) {
        installCommand = "yarn install"
        runCommand = packageJson?.scripts?.dev ? "yarn dev" : packageJson?.scripts?.start ? "yarn start" : "yarn"
      } else if (hasPnpmLock) {
        installCommand = "pnpm install"
        runCommand = packageJson?.scripts?.dev ? "pnpm dev" : packageJson?.scripts?.start ? "pnpm start" : "pnpm"
      } else {
        installCommand = "npm install"
        runCommand = packageJson?.scripts?.dev ? "npm run dev" : packageJson?.scripts?.start ? "npm start" : "npm run"
      }
    } else {
      installCommand = "npm install"
      runCommand = "npm start"
    }
  } else if (language.toLowerCase() === "python" || hasPyFiles || hasRequirementsTxt || hasSetupPy || hasPipfile) {
    language = "Python"

    if (hasPipfile) {
      installCommand = "pipenv install"
      runCommand = "pipenv run python main.py"
    } else if (hasRequirementsTxt) {
      installCommand = "pip install -r requirements.txt"
      runCommand = "python main.py"
    } else if (hasSetupPy) {
      installCommand = "pip install -e ."
      runCommand = `python -m ${repo.name.replace(/-/g, "_")}`
    } else {
      installCommand = "pip install -r requirements.txt"
      runCommand = "python main.py"
    }
  } else if (language.toLowerCase() === "ruby" || hasRbFiles || hasGemfile) {
    language = "Ruby"

    if (hasGemfile) {
      installCommand = "bundle install"
      runCommand = "bundle exec ruby app.rb"
    } else {
      installCommand = "gem install bundler && bundle install"
      runCommand = "ruby app.rb"
    }
  } else if (language.toLowerCase() === "java" || hasJavaFiles || hasPomXml || hasGradleFile) {
    language = "Java"

    if (hasPomXml) {
      installCommand = "mvn install"
      runCommand = "mvn exec:java"
    } else if (hasGradleFile) {
      installCommand = "./gradlew build"
      runCommand = "./gradlew run"
    } else {
      installCommand = "javac Main.java"
      runCommand = "java Main"
    }
  } else if (language.toLowerCase() === "go" || hasGoFiles || hasGoMod) {
    language = "Go"

    if (hasGoMod) {
      installCommand = "go mod download"
      runCommand = "go run ."
    } else {
      installCommand = "go get ./..."
      runCommand = "go run main.go"
    }
  } else if (language.toLowerCase() === "rust" || hasRustFiles || hasCargoToml) {
    language = "Rust"

    installCommand = "cargo build"
    runCommand = "cargo run"
  } else if (language.toLowerCase() === "php" || hasPhpFiles || hasComposerJson) {
    language = "PHP"

    if (hasComposerJson) {
      installCommand = "composer install"
      runCommand = "php -S localhost:8000"
    } else {
      installCommand = "# No installation required for basic PHP projects"
      runCommand = "php -S localhost:8000"
    }
  } else if (language.toLowerCase() === "c#" || hasCsFiles || hasCsprojFile) {
    language = "C#"

    installCommand = "dotnet restore"
    runCommand = "dotnet run"
  } else if (language.toLowerCase() === "c" || language.toLowerCase() === "c++" || hasCFiles || hasCppFiles) {
    language = hasCppFiles ? "C++" : "C"

    if (hasCMake) {
      installCommand = "mkdir build && cd build && cmake .."
      runCommand = "cd build && make && ./main"
    } else if (hasMakefile) {
      installCommand = "make"
      runCommand = "./main"
    } else {
      installCommand = hasCppFiles ? "g++ -o main main.cpp" : "gcc -o main main.c"
      runCommand = "./main"
    }
  } else {
    // Default fallback - use generic commands based on detected language
    installCommand = "# Installation steps depend on your specific environment"
    runCommand = "# Run commands depend on your specific environment"
  }

  return {
    name: repo.name,
    description: repo.description || "",
    language,
    topics: repo.topics || [],
    structure: contents,
    license: repo.license?.name || null,
    hasTests,
    hasDocs,
    hasCI,
    installCommand,
    runCommand,
    packageJson,
    dependencies,
    devDependencies,
  }
}

// This function generates a README based on the repository analysis
export async function generateReadmeFromAnalysis(analysis: RepositoryAnalysis): Promise<string> {
  try {
    // Load the appropriate template based on the repository language
    const template = getReadmeTemplate(analysis.language)

    // Replace placeholders in the template with actual values
    let readme = template
      .replace(/{{name}}/g, analysis.name)
      .replace(/{{description}}/g, analysis.description || "No description provided")
      .replace(/{{language}}/g, analysis.language)
      .replace(/{{license}}/g, analysis.license || "No license specified")
      .replace(/{{installCommand}}/g, analysis.installCommand)
      .replace(/{{runCommand}}/g, analysis.runCommand)

    // Add topics/tags if available
    if (analysis.topics && analysis.topics.length > 0) {
      const topicsSection = `
## Tags/Topics

${analysis.topics.map((topic) => `- ${topic}`).join("\n")}
`
      readme = readme.replace("{{topics}}", topicsSection)
    } else {
      readme = readme.replace("{{topics}}", "")
    }

    // Add file structure if available
    if (analysis.structure && analysis.structure.length > 0) {
      // Limit to 20 files to keep it manageable
      const displayedStructure = analysis.structure.slice(0, 20)
      const structureSection = `
## Project Structure

\`\`\`
${displayedStructure.join("\n")}${analysis.structure.length > 20 ? "\n... (and more files)" : ""}
\`\`\`
`
      readme = readme.replace("{{structure}}", structureSection)
    } else {
      readme = readme.replace("{{structure}}", "")
    }

    // Add dependencies if available
    let dependenciesSection = ""
    if (analysis.dependencies.length > 0 || analysis.devDependencies.length > 0) {
      dependenciesSection = `
## Dependencies

${
  analysis.dependencies.length > 0
    ? `
### Main Dependencies

${analysis.dependencies.map((dep) => `- ${dep}`).join("\n")}
`
    : ""
}

${
  analysis.devDependencies.length > 0
    ? `
### Development Dependencies

${analysis.devDependencies.map((dep) => `- ${dep}`).join("\n")}
`
    : ""
}
`
    }

    readme = readme.replace("{{dependencies}}", dependenciesSection)

    // Add badges
    const badges = []
    badges.push(`![Language](https://img.shields.io/badge/language-${encodeURIComponent(analysis.language)}-blue)`)

    if (analysis.license) {
      badges.push(
        `![License](https://img.shields.io/badge/license-${encodeURIComponent(analysis.license.replace(/ License/i, ""))}-green)`,
      )
    }

    if (analysis.hasTests) {
      badges.push("![Tests](https://img.shields.io/badge/tests-yes-brightgreen)")
    }

    if (analysis.hasCI) {
      badges.push("![CI](https://img.shields.io/badge/CI-yes-brightgreen)")
    }

    const badgesSection = badges.join(" ")
    readme = readme.replace("{{badges}}", badgesSection)

    return readme
  } catch (error) {
    console.error("Error generating README from template:", error)
    return generateFallbackReadme(analysis)
  }
}

// Fallback README generator in case the template approach fails
function generateFallbackReadme(analysis: RepositoryAnalysis): string {
  return `# ${analysis.name}

${analysis.description}

## About

This is a ${analysis.language} project${analysis.topics.length > 0 ? ` with focus on ${analysis.topics.join(", ")}` : ""}.

## Installation

\`\`\`
${analysis.installCommand}
\`\`\`

## Usage

\`\`\`
${analysis.runCommand}
\`\`\`

## License

${analysis.license || "No license specified"}
`
}

// Template getter function
function getReadmeTemplate(language: string): string {
  // Default template
  const defaultTemplate = `# {{name}}

{{badges}}

{{description}}

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [Features](#features)
- [Contributing](#contributing)
- [License](#license)

{{topics}}

{{structure}}

{{dependencies}}

## Installation

\`\`\`bash
{{installCommand}}
\`\`\`

## Usage

\`\`\`bash
{{runCommand}}
\`\`\`

## Features

- Feature 1
- Feature 2
- Feature 3

## Contributing

1. Fork the repository
2. Create your feature branch (\`git checkout -b feature/amazing-feature\`)
3. Commit your changes (\`git commit -m 'Add some amazing feature'\`)
4. Push to the branch (\`git push origin feature/amazing-feature\`)
5. Open a Pull Request

## License

This project is licensed under the {{license}}.
`

  // Language-specific templates
  switch (language.toLowerCase()) {
    case "javascript":
    case "typescript":
      return `# {{name}}

{{badges}}

{{description}}

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [Features](#features)
- [Dependencies](#dependencies)
- [Scripts](#scripts)
- [Contributing](#contributing)
- [License](#license)

{{topics}}

{{structure}}

{{dependencies}}

## Installation

\`\`\`bash
{{installCommand}}
\`\`\`

## Usage

\`\`\`bash
{{runCommand}}
\`\`\`

## Features

- Modern JavaScript/TypeScript syntax
- Modular architecture
- Easy to extend

## Scripts

- \`npm start\` - Start the application
- \`npm test\` - Run tests
- \`npm run build\` - Build for production

## Contributing

1. Fork the repository
2. Create your feature branch (\`git checkout -b feature/amazing-feature\`)
3. Commit your changes (\`git commit -m 'Add some amazing feature'\`)
4. Push to the branch (\`git push origin feature/amazing-feature\`)
5. Open a Pull Request

## License

This project is licensed under the {{license}}.
`

    case "php":
      return `# {{name}}

{{badges}}

{{description}}

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [Features](#features)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)

{{topics}}

{{structure}}

{{dependencies}}

## Installation

\`\`\`bash
{{installCommand}}
\`\`\`

## Usage

\`\`\`bash
{{runCommand}}
\`\`\`

## Features

- Simple PHP application
- Browser-based interface
- Easy to deploy on any PHP server

## Requirements

- PHP 7.0 or higher
- Web server (Apache, Nginx, or built-in PHP server)

## Contributing

1. Fork the repository
2. Create your feature branch (\`git checkout -b feature/amazing-feature\`)
3. Commit your changes (\`git commit -m 'Add some amazing feature'\`)
4. Push to the branch (\`git push origin feature/amazing-feature\`)
5. Open a Pull Request

## License

This project is licensed under the {{license}}.
`

    case "python":
      return `# {{name}}

{{badges}}

{{description}}

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [Features](#features)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)

{{topics}}

{{structure}}

{{dependencies}}

## Installation

\`\`\`bash
{{installCommand}}
\`\`\`

## Usage

\`\`\`bash
{{runCommand}}
\`\`\`

## Features

- Easy to use Python API
- Comprehensive documentation
- Extensive test coverage

## Contributing

1. Fork the repository
2. Create your feature branch (\`git checkout -b feature/amazing-feature\`)
3. Commit your changes (\`git commit -m 'Add some amazing feature'\`)
4. Push to the branch (\`git push origin feature/amazing-feature\`)
5. Open a Pull Request

## License

This project is licensed under the {{license}}.
`

    case "java":
      return `# {{name}}

{{badges}}

{{description}}

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [Features](#features)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)

{{topics}}

{{structure}}

{{dependencies}}

## Installation

\`\`\`bash
{{installCommand}}
\`\`\`

## Usage

\`\`\`bash
{{runCommand}}
\`\`\`

## Features

- Object-oriented design
- Robust error handling
- Comprehensive documentation

## Contributing

1. Fork the repository
2. Create your feature branch (\`git checkout -b feature/amazing-feature\`)
3. Commit your changes (\`git commit -m 'Add some amazing feature'\`)
4. Push to the branch (\`git push origin feature/amazing-feature\`)
5. Open a Pull Request

## License

This project is licensed under the {{license}}.
`

    case "go":
      return `# {{name}}

{{badges}}

{{description}}

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [Features](#features)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)

{{topics}}

{{structure}}

{{dependencies}}

## Installation

\`\`\`bash
{{installCommand}}
\`\`\`

## Usage

\`\`\`bash
{{runCommand}}
\`\`\`

## Features

- Concurrent processing
- Strong typing
- Efficient memory usage

## Contributing

1. Fork the repository
2. Create your feature branch (\`git checkout -b feature/amazing-feature\`)
3. Commit your changes (\`git commit -m 'Add some amazing feature'\`)
4. Push to the branch (\`git push origin feature/amazing-feature\`)
5. Open a Pull Request

## License

This project is licensed under the {{license}}.
`

    case "rust":
      return `# {{name}}

{{badges}}

{{description}}

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [Features](#features)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)

{{topics}}

{{structure}}

{{dependencies}}

## Installation

\`\`\`bash
{{installCommand}}
\`\`\`

## Usage

\`\`\`bash
{{runCommand}}
\`\`\`

## Features

- Memory safety without garbage collection
- Zero-cost abstractions
- Guaranteed thread safety

## Contributing

1. Fork the repository
2. Create your feature branch (\`git checkout -b feature/amazing-feature\`)
3. Commit your changes (\`git commit -m 'Add some amazing feature'\`)
4. Push to the branch (\`git push origin feature/amazing-feature\`)
5. Open a Pull Request

## License

This project is licensed under the {{license}}.
`

    case "c#":
      return `# {{name}}

{{badges}}

{{description}}

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [Features](#features)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)

{{topics}}

{{structure}}

{{dependencies}}

## Installation

\`\`\`bash
{{installCommand}}
\`\`\`

## Usage

\`\`\`bash
{{runCommand}}
\`\`\`

## Features

- .NET Core compatibility
- Cross-platform support
- Strong typing and performance

## Contributing

1. Fork the repository
2. Create your feature branch (\`git checkout -b feature/amazing-feature\`)
3. Commit your changes (\`git commit -m 'Add some amazing feature'\`)
4. Push to the branch (\`git push origin feature/amazing-feature\`)
5. Open a Pull Request

## License

This project is licensed under the {{license}}.
`

    case "c":
    case "c++":
      return `# {{name}}

{{badges}}

{{description}}

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [Features](#features)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)

{{topics}}

{{structure}}

{{dependencies}}

## Installation

\`\`\`bash
{{installCommand}}
\`\`\`

## Usage

\`\`\`bash
{{runCommand}}
\`\`\`

## Features

- High performance
- Low-level memory management
- Efficient algorithms

## Contributing

1. Fork the repository
2. Create your feature branch (\`git checkout -b feature/amazing-feature\`)
3. Commit your changes (\`git commit -m 'Add some amazing feature'\`)
4. Push to the branch (\`git push origin feature/amazing-feature\`)
5. Open a Pull Request

## License

This project is licensed under the {{license}}.
`

    default:
      return defaultTemplate
  }
}

