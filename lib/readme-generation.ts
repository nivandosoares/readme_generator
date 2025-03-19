/**
 * Generates a comprehensive README content from the repository analysis
 */
export async function generateReadmeFromAnalysis(analysis: any): Promise<string> {
  try {
    if (!analysis) {
      throw new Error("Analysis object is undefined or null")
    }

    const sections: string[] = []

    // Title and Description
    sections.push(`# ${analysis.name}`)
    sections.push(`${analysis.description || "A software project"}`)

    // Badges
    const badges: string[] = []
    if (analysis.license) {
      badges.push(`![License](https://img.shields.io/badge/license-${encodeURIComponent(analysis.license)}-blue.svg)`)
    }
    if (analysis.language) {
      badges.push(
        `![Language](https://img.shields.io/badge/language-${encodeURIComponent(analysis.language)}-orange.svg)`,
      )
    }
    if (analysis.stars) {
      badges.push(`![Stars](https://img.shields.io/github/stars/${analysis.fullName || "user/repo"}?style=social)`)
    }
    sections.push(badges.join(" "))

    // Project Overview
    sections.push(`## Project Overview`)
    sections.push(generateProjectOverview(analysis))

    // Table of Contents
    sections.push(`## Table of Contents`)
    const tocItems = [`- [Project Overview](#project-overview)`, `- [Installation](#installation)`]

    if (analysis.repoType === "linux-kernel" || analysis.repoType === "kernel" || analysis.repoType === "c-system") {
      tocItems.push(`- [Building](#building)`)
    }

    tocItems.push(`- [Usage](#usage)`)

    if (analysis.apiEndpoints && analysis.apiEndpoints.length > 0) {
      tocItems.push(`- [API Reference](#api-reference)`)
    }

    if (analysis.configFiles && analysis.configFiles.length > 0) {
      tocItems.push(`- [Configuration](#configuration)`)
    }

    if (analysis.hasTests) {
      tocItems.push(`- [Testing](#testing)`)
    }

    tocItems.push(`- [Contributing](#contributing)`)

    if (analysis.dependencies && analysis.dependencies.length > 0) {
      tocItems.push(`- [Dependencies](#dependencies)`)
    }

    tocItems.push(`- [License](#license)`)

    sections.push(tocItems.join("\n"))

    // Installation
    sections.push(`## Installation`)
    sections.push(generateInstallationInstructions(analysis))

    // Building (for kernel and system repositories)
    if (analysis.repoType === "linux-kernel" || analysis.repoType === "kernel" || analysis.repoType === "c-system") {
      sections.push(`## Building`)
      sections.push(generateBuildInstructions(analysis))
    }

    // Usage
    sections.push(`## Usage`)
    sections.push(generateUsageInstructions(analysis))

    // API Reference (if applicable)
    if (analysis.apiEndpoints && analysis.apiEndpoints.length > 0) {
      sections.push(`## API Reference`)
      sections.push(generateApiReference(analysis))
    }

    // Configuration
    if (analysis.configFiles && analysis.configFiles.length > 0) {
      sections.push(`## Configuration`)
      sections.push(generateConfigurationDocs(analysis))
    }

    // Testing
    if (analysis.hasTests) {
      sections.push(`## Testing`)
      sections.push(generateTestingInstructions(analysis))
    }

    // Contributing
    sections.push(`## Contributing`)
    sections.push(generateContributingGuidelines(analysis))

    // Dependencies
    if (analysis.dependencies && analysis.dependencies.length > 0) {
      sections.push(`## Dependencies`)
      sections.push(generateDependenciesList(analysis))
    }

    // License
    sections.push(`## License`)
    sections.push(generateLicenseInfo(analysis))

    // Project Structure (optional)
    if (analysis.codeStructure) {
      sections.push(`## Project Structure`)
      sections.push(generateProjectStructure(analysis))
    }

    return sections.join("\n\n")
  } catch (error) {
    console.error("Error generating README content:", error)
    return `# ${analysis?.name || "Project"}

${analysis?.description || "No description available."}

## Error

There was an error generating the complete README. Please check the repository details and try again.
`
  }
}

/**
 * Generates a project overview section
 */
function generateProjectOverview(analysis: any): string {
  let overview = ""

  // Start with a general description based on repository type
  switch (analysis.repoType) {
    case "linux-kernel":
      overview += `This repository contains a Linux kernel source tree. The Linux kernel is the core component of Linux operating systems, responsible for managing system resources, hardware interactions, and providing essential services to user-space applications.\n\n`
      break
    case "node":
      overview += `This is a Node.js project ${analysis.hasTypeScript ? "written in TypeScript" : "written in JavaScript"}. `
      if (analysis.hasReact) overview += `It uses React for building user interfaces. `
      if (analysis.hasNextJs) overview += `It is built with the Next.js framework. `
      overview += `\n\n`
      break
    case "python":
      overview += `This is a Python project. `
      if (analysis.hasDjango) overview += `It uses the Django web framework. `
      if (analysis.hasFlask) overview += `It uses the Flask web framework. `
      overview += `\n\n`
      break
    case "web":
      overview += `This is a web project. `
      if (analysis.frameworks && analysis.frameworks.length > 0) {
        overview += `It uses the following frameworks/libraries: ${analysis.frameworks.join(", ")}. `
      }
      overview += `\n\n`
      break
    case "data-science":
      overview += `This is a data science project. It includes tools and scripts for data analysis, visualization, and modeling.\n\n`
      break
    case "mobile":
      overview += `This is a mobile application project. `
      if (analysis.language === "Swift") overview += `It is an iOS application written in Swift. `
      if (analysis.language === "Kotlin") overview += `It is an Android application written in Kotlin. `
      overview += `\n\n`
      break
    default:
      overview += `This project is primarily written in ${analysis.language || "multiple languages"}.\n\n`
  }

  // Add repository statistics
  overview += `### Repository Statistics\n\n`
  overview += `- **Stars**: ${analysis.stars || 0}\n`
  overview += `- **Forks**: ${analysis.forks || 0}\n`
  overview += `- **Open Issues**: ${analysis.openIssues || 0}\n`
  overview += `- **Created**: ${new Date(analysis.createdAt).toLocaleDateString()}\n`
  overview += `- **Last Updated**: ${new Date(analysis.updatedAt).toLocaleDateString()}\n`

  // Add key features or components
  overview += `\n### Key Features\n\n`

  switch (analysis.repoType) {
    case "linux-kernel":
      overview += `- Core kernel functionality\n`
      if (analysis.hasDrivers) overview += `- Device drivers\n`
      if (analysis.hasFilesystems) overview += `- Filesystem implementations\n`
      if (analysis.hasNetworking) overview += `- Network protocol implementations\n`
      if (analysis.architectures && analysis.architectures.length > 0) {
        overview += `- Support for architectures: ${analysis.architectures.join(", ")}\n`
      }
      break
    case "node":
      if (analysis.hasReact) overview += `- React components\n`
      if (analysis.hasNextJs) overview += `- Server-side rendering\n`
      if (analysis.apiEndpoints && analysis.apiEndpoints.length > 0) overview += `- API endpoints\n`
      break
    case "python":
      if (analysis.hasDjango) overview += `- Django web application\n`
      if (analysis.hasFlask) overview += `- Flask web application\n`
      if (analysis.apiEndpoints && analysis.apiEndpoints.length > 0) overview += `- API endpoints\n`
      break
    default:
      overview += `- Feature 1\n`
      overview += `- Feature 2\n`
      overview += `- Feature 3\n`
  }

  return overview
}

/**
 * Generates installation instructions
 */
function generateInstallationInstructions(analysis: any): string {
  let instructions = ""

  // Prerequisites
  instructions += `### Prerequisites\n\n`

  switch (analysis.repoType) {
    case "linux-kernel":
      instructions += `- Linux development environment\n`
      instructions += `- Build tools (gcc, make, etc.)\n`
      instructions += `- At least 5GB of free disk space\n`
      instructions += `- At least 2GB of RAM (4GB+ recommended)\n`
      break
    case "node":
      instructions += `- Node.js ${analysis.nodeVersion || "(latest LTS version recommended)"}\n`
      instructions += `- npm ${analysis.npmVersion || "(comes with Node.js)"} or yarn\n`
      break
    case "python":
      instructions += `- Python ${analysis.pythonVersion || "3.x"}\n`
      if (analysis.hasPipenv) instructions += `- pipenv\n`
      if (analysis.hasPoetry) instructions += `- poetry\n`
      break
    case "web":
      instructions += `- Web browser\n`
      if (analysis.hasJavaScript) instructions += `- Node.js (for development)\n`
      break
    case "data-science":
      instructions += `- Python 3.x\n`
      instructions += `- Jupyter Notebook/Lab (for notebooks)\n`
      break
    case "mobile":
      if (analysis.language === "Swift") {
        instructions += `- macOS\n`
        instructions += `- Xcode\n`
        instructions += `- CocoaPods (if used in the project)\n`
      } else if (analysis.language === "Kotlin" || analysis.language === "Java") {
        instructions += `- Android Studio\n`
        instructions += `- JDK 8 or newer\n`
      }
      break
    default:
      instructions += `- Appropriate development environment for ${analysis.language || "the project"}\n`
  }

  // Installation steps
  instructions += `\n### Installation Steps\n\n`
  instructions += `\`\`\`bash\n${analysis.installCommand || "# Installation steps not available"}\n\`\`\`\n\n`

  // Additional setup
  if (analysis.environmentVariables && analysis.environmentVariables.length > 0) {
    instructions += `### Environment Variables\n\n`
    instructions += `Create a \`.env\` file in the root directory and add the following variables:\n\n`
    instructions += `\`\`\`\n`
    analysis.environmentVariables.forEach((env: string) => {
      instructions += `${env}=your_value\n`
    })
    instructions += `\`\`\`\n\n`
  }

  return instructions
}

/**
 * Generates build instructions
 */
function generateBuildInstructions(analysis: any): string {
  let instructions = ""

  instructions += `To build the project, follow these steps:\n\n`
  instructions += `\`\`\`bash\n${analysis.buildCommand || "make"}\n\`\`\`\n\n`

  if (analysis.repoType === "linux-kernel") {
    instructions += `### Kernel Configuration\n\n`
    instructions += `Before building, you may want to configure the kernel:\n\n`
    instructions += `\`\`\`bash\n`
    instructions += `# Generate a default configuration\n`
    instructions += `make defconfig\n\n`
    instructions += `# OR for a more interactive configuration\n`
    instructions += `make menuconfig\n`
    instructions += `\`\`\`\n\n`
    instructions += `This allows you to enable/disable specific kernel features and drivers.\n\n`

    instructions += `### Common Build Targets\n\n`
    instructions += `- \`make\` - Build the kernel\n`
    instructions += `- \`make modules\` - Build only the kernel modules\n`
    instructions += `- \`make bzImage\` - Build the compressed kernel image\n`
    instructions += `- \`make clean\` - Remove most generated files\n`
    instructions += `- \`make mrproper\` - Remove all generated files + config + various backup files\n`
  }

  return instructions
}

/**
 * Generates usage instructions
 */
function generateUsageInstructions(analysis: any): string {
  let instructions = ""

  switch (analysis.repoType) {
    case "linux-kernel":
      instructions += `The Linux kernel is not an application that you "run" directly. After building, you need to install it on your system:\n\n`
      instructions += `\`\`\`bash\n`
      instructions += `# Install the kernel modules and the kernel itself\n`
      instructions += `sudo make modules_install install\n\n`
      instructions += `# Update your bootloader\n`
      instructions += `sudo update-grub\n\n`
      instructions += `# Reboot to use the new kernel\n`
      instructions += `sudo reboot\n`
      instructions += `\`\`\`\n\n`
      instructions += `After rebooting, you can verify the kernel version with:\n\n`
      instructions += `\`\`\`bash\n`
      instructions += `uname -r\n`
      instructions += `\`\`\`\n\n`
      break

    case "node":
      instructions += `To run the project:\n\n`
      instructions += `\`\`\`bash\n${analysis.runCommand || "npm start"}\n\`\`\`\n\n`

      if (analysis.scripts && Object.keys(analysis.scripts).length > 0) {
        instructions += `### Available Scripts\n\n`
        Object.entries(analysis.scripts).forEach(([name, script]) => {
          instructions += `- \`npm run ${name}\`: ${script}\n`
        })
        instructions += `\n`
      }

      // Add example usage if it's a library
      if (analysis.mainEntryPoint && analysis.mainEntryPoint !== "Not detected") {
        instructions += `### Example Usage\n\n`
        instructions += `\`\`\`javascript\n`
        instructions += `// Import the library\n`
        instructions += `const { someFunction } = require('${analysis.name}');\n\n`
        instructions += `// Use the library\n`
        instructions += `const result = someFunction();\n`
        instructions += `console.log(result);\n`
        instructions += `\`\`\`\n\n`
      }
      break

    case "python":
      instructions += `To run the project:\n\n`
      instructions += `\`\`\`bash\n${analysis.runCommand || "python main.py"}\n\`\`\`\n\n`

      // Add example usage if it's a library
      if (analysis.mainEntryPoint && analysis.mainEntryPoint !== "Not detected") {
        instructions += `### Example Usage\n\n`
        instructions += `\`\`\`python\n`
        instructions += `# Import the library\n`
        instructions += `from ${analysis.name} import some_function\n\n`
        instructions += `# Use the library\n`
        instructions += `result = some_function()\n`
        instructions += `print(result)\n`
        instructions += `\`\`\`\n\n`
      }

      // Add Django-specific instructions
      if (analysis.hasDjango) {
        instructions += `### Django-specific Commands\n\n`
        instructions += `\`\`\`bash\n`
        instructions += `# Run migrations\n`
        instructions += `python manage.py migrate\n\n`
        instructions += `# Create a superuser\n`
        instructions += `python manage.py createsuperuser\n\n`
        instructions += `# Run the development server\n`
        instructions += `python manage.py runserver\n`
        instructions += `\`\`\`\n\n`
      }
      break

    case "web":
      if (analysis.hasJavaScript) {
        instructions += `To run the project with a development server:\n\n`
        instructions += `\`\`\`bash\n`
        instructions += `# If using npm\n`
        instructions += `npm start\n\n`
        instructions += `# If using yarn\n`
        instructions += `yarn start\n`
        instructions += `\`\`\`\n\n`
      } else {
        instructions += `Open the \`index.html\` file in your web browser to view the project.\n\n`
      }
      break

    case "data-science":
      instructions += `To run Jupyter notebooks:\n\n`
      instructions += `\`\`\`bash\n`
      instructions += `jupyter notebook\n`
      instructions += `# or\n`
      instructions += `jupyter lab\n`
      instructions += `\`\`\`\n\n`

      instructions += `To run Python scripts:\n\n`
      instructions += `\`\`\`bash\n`
      instructions += `python script_name.py\n`
      instructions += `\`\`\`\n\n`
      break

    case "mobile":
      if (analysis.language === "Swift") {
        instructions += `Open the \`.xcodeproj\` or \`.xcworkspace\` file in Xcode, then build and run the project on your desired simulator or device.\n\n`
      } else if (analysis.language === "Kotlin" || analysis.language === "Java") {
        instructions += `Open the project in Android Studio, then build and run the project on your desired emulator or device.\n\n`
      }
      break

    default:
      instructions += `\`\`\`bash\n${analysis.runCommand || "# See project documentation for usage instructions"}\n\`\`\`\n\n`
  }

  return instructions
}

/**
 * Generates API reference documentation
 */
function generateApiReference(analysis: any): string {
  let apiDocs = ""

  apiDocs += `This section documents the API endpoints provided by this project.\n\n`

  if (analysis.apiEndpoints && analysis.apiEndpoints.length > 0) {
    apiDocs += `${analysis.apiEndpoints.join("\n\n")}\n\n`
  } else {
    apiDocs += `### Endpoint: /api/example\n\n`
    apiDocs += `- **Method**: GET\n`
    apiDocs += `- **Description**: Example endpoint\n`
    apiDocs += `- **Parameters**: None\n`
    apiDocs += `- **Response**: JSON\n\n`
    apiDocs += `Example request:\n\n`
    apiDocs += `\`\`\`bash\ncurl -X GET https://example.com/api/example\n\`\`\`\n\n`
    apiDocs += `Example response:\n\n`
    apiDocs += `\`\`\`json\n{\n  "status": "success",\n  "data": {}\n}\n\`\`\`\n\n`
  }

  return apiDocs
}

/**
 * Generates configuration documentation
 */
function generateConfigurationDocs(analysis: any): string {
  let configDocs = ""

  configDocs += `This project can be configured using the following files:\n\n`

  if (analysis.configFiles && analysis.configFiles.length > 0) {
    analysis.configFiles.forEach((file: string) => {
      configDocs += `- \`${file}\`: Configuration file\n`
    })
    configDocs += `\n`
  }

  // Add environment variables documentation
  if (analysis.environmentVariables && analysis.environmentVariables.length > 0) {
    configDocs += `### Environment Variables\n\n`
    configDocs += `The following environment variables can be used to configure the project:\n\n`
    analysis.environmentVariables.forEach((env: string) => {
      configDocs += `- \`${env}\`: Description of the variable\n`
    })
    configDocs += `\n`
  }

  return configDocs
}

/**
 * Generates testing instructions
 */
function generateTestingInstructions(analysis: any): string {
  let instructions = ""

  instructions += `To run tests:\n\n`
  instructions += `\`\`\`bash\n${analysis.testCommand || "# See project documentation for testing instructions"}\n\`\`\`\n\n`

  switch (analysis.repoType) {
    case "linux-kernel":
      instructions += `The kernel includes various tests that can be run to verify functionality:\n\n`
      instructions += `\`\`\`bash\n`
      instructions += `# Run kernel self-tests\n`
      instructions += `make test\n\n`
      instructions += `# For more comprehensive testing, see the documentation in the 'tools/testing' directory\n`
      instructions += `\`\`\`\n\n`
      break

    case "node":
      instructions += `This project uses ${
        analysis.devDependencies.includes("jest")
          ? "Jest"
          : analysis.devDependencies.includes("mocha")
            ? "Mocha"
            : "a testing framework"
      } for testing.\n\n`
      break

    case "python":
      const contents = analysis.codeStructure?.mainFiles || []
      instructions += `This project uses ${
        analysis.hasTests && contents.some((path) => path.includes("pytest"))
          ? "pytest"
          : analysis.hasTests && contents.some((path) => path.includes("unittest"))
            ? "unittest"
            : "a testing framework"
      } for testing.\n\n`
      break
  }

  return instructions
}

/**
 * Generates contributing guidelines
 */
function generateContributingGuidelines(analysis: any): string {
  let guidelines = ""

  if (analysis.hasContributing) {
    guidelines += `Please see the [CONTRIBUTING.md](CONTRIBUTING.md) file for detailed contribution guidelines.\n\n`
  } else {
    guidelines += `Contributions are welcome! Here's how you can contribute to this project:\n\n`
    guidelines += `1. Fork the repository\n`
    guidelines += `2. Create a new branch (\`git checkout -b feature/your-feature\`)\n`
    guidelines += `3. Make your changes\n`
    guidelines += `4. Run tests to ensure your changes don't break existing functionality\n`
    guidelines += `5. Commit your changes (\`git commit -m 'Add some feature'\`)\n`
    guidelines += `6. Push to the branch (\`git push origin feature/your-feature\`)\n`
    guidelines += `7. Open a Pull Request\n\n`

    guidelines += `### Code Style\n\n`

    switch (analysis.repoType) {
      case "linux-kernel":
        guidelines += `Please follow the [Linux kernel coding style](https://www.kernel.org/doc/html/latest/process/coding-style.html).\n\n`
        break
      case "node":
        if (analysis.configFiles.includes("ESLint config")) {
          guidelines += `This project uses ESLint for code linting. Please ensure your code follows the project's ESLint configuration.\n\n`
        } else {
          guidelines += `Please follow the standard JavaScript/TypeScript coding conventions.\n\n`
        }
        break
      case "python":
        if (analysis.configFiles.includes("Flake8 config")) {
          guidelines += `This project uses Flake8 for code linting. Please ensure your code follows the project's Flake8 configuration.\n\n`
        } else {
          guidelines += `Please follow the [PEP 8](https://www.python.org/dev/peps/pep-0008/) style guide for Python code.\n\n`
        }
        break
      default:
        guidelines += `Please follow the existing code style in the project.\n\n`
    }
  }

  return guidelines
}

/**
 * Generates dependencies list
 */
function generateDependenciesList(analysis: any): string {
  let dependencies = ""

  if (analysis.dependencies && analysis.dependencies.length > 0) {
    dependencies += `### Main Dependencies\n\n`
    analysis.dependencies.forEach((dep: string) => {
      dependencies += `- ${dep}\n`
    })
    dependencies += `\n`
  }

  if (analysis.devDependencies && analysis.devDependencies.length > 0) {
    dependencies += `### Development Dependencies\n\n`
    analysis.devDependencies.forEach((dep: string) => {
      dependencies += `- ${dep}\n`
    })
    dependencies += `\n`
  }

  if (analysis.peerDependencies && analysis.peerDependencies.length > 0) {
    dependencies += `### Peer Dependencies\n\n`
    analysis.peerDependencies.forEach((dep: string) => {
      dependencies += `- ${dep}\n`
    })
    dependencies += `\n`
  }

  return dependencies
}

/**
 * Generates license information
 */
function generateLicenseInfo(analysis: any): string {
  let licenseInfo = ""

  if (analysis.license) {
    licenseInfo += `This project is licensed under the ${analysis.license}`
    if (analysis.licenseUrl) {
      licenseInfo += ` - see the [LICENSE](${analysis.licenseUrl}) file for details`
    }
    licenseInfo += `.\n\n`
  } else {
    licenseInfo += `This project's license is not specified. Please contact the repository owner for licensing information.\n\n`
  }

  return licenseInfo
}

/**
 * Generates project structure documentation
 */
function generateProjectStructure(analysis: any): string {
  let structure = ""

  structure += `Here's an overview of the project structure:\n\n`
  structure += `\`\`\`\n`

  // Add main directories
  if (analysis.codeStructure && analysis.codeStructure.directories) {
    analysis.codeStructure.directories.slice(0, 10).forEach((dir: string) => {
      structure += `${dir}\n`
    })
  }

  // Add main files
  if (analysis.codeStructure && analysis.codeStructure.mainFiles) {
    analysis.codeStructure.mainFiles.slice(0, 10).forEach((file: string) => {
      structure += `${file}\n`
    })
  }

  structure += `\`\`\`\n\n`

  return structure
}

