import { analyzeRepository, generateReadmeFromAnalysis } from "@/lib/llm"
import type { Repository } from "@/lib/types"
import { describe, it, expect, jest } from "@jest/globals"

describe("LLM Functions", () => {
  describe("analyzeRepository", () => {
    it("should analyze a JavaScript repository", async () => {
      const repo = {
        name: "test-repo",
        description: "A test repository",
        language: "JavaScript",
        topics: ["javascript", "testing"],
        license: { name: "MIT License" },
      } as Repository

      const contents = ["package.json", "src/index.js", "README.md", "tests/test.js"]

      const packageJson = {
        dependencies: {
          react: "^18.0.0",
          next: "^13.0.0",
        },
        devDependencies: {
          jest: "^29.0.0",
        },
      }

      const analysis = await analyzeRepository(repo, contents, packageJson)

      expect(analysis).toMatchObject({
        name: "test-repo",
        description: "A test repository",
        language: "JavaScript",
        topics: ["javascript", "testing"],
        license: "MIT License",
        hasTests: true,
        hasDocs: true,
        dependencies: ["react", "next"],
        devDependencies: ["jest"],
      })

      // Check that install and run commands are set correctly
      expect(analysis.installCommand).toContain("npm install")
    })

    it("should analyze a Python repository", async () => {
      const repo = {
        name: "python-repo",
        description: "A Python repository",
        language: "Python",
        topics: ["python", "machine-learning"],
        license: null,
      } as Repository

      const contents = ["requirements.txt", "src/main.py", "tests/test_main.py"]

      const analysis = await analyzeRepository(repo, contents, null)

      expect(analysis).toMatchObject({
        name: "python-repo",
        description: "A Python repository",
        language: "Python",
        topics: ["python", "machine-learning"],
        license: null,
        hasTests: true,
        dependencies: [],
        devDependencies: [],
      })

      // Check that install and run commands are set correctly
      expect(analysis.installCommand).toContain("pip install")
    })
  })

  describe("generateReadmeFromAnalysis", () => {
    it("should generate a README for a JavaScript project", async () => {
      const analysis = {
        name: "test-repo",
        description: "A test repository",
        language: "JavaScript",
        topics: ["javascript", "testing"],
        structure: ["package.json", "src/index.js"],
        license: "MIT License",
        hasTests: true,
        hasDocs: true,
        hasCI: false,
        installCommand: "npm install",
        runCommand: "npm start",
        dependencies: ["react", "next"],
        devDependencies: ["jest"],
        packageJson: null,
      }

      const readme = await generateReadmeFromAnalysis(analysis)

      expect(readme).toContain("# test-repo")
      expect(readme).toContain("A test repository")
      expect(readme).toContain("npm install")
      expect(readme).toContain("npm start")
      expect(readme).toContain("MIT License")
      expect(readme).toContain("javascript")
      expect(readme).toContain("testing")
    })

    it("should generate a README for a Python project", async () => {
      const analysis = {
        name: "python-repo",
        description: "A Python repository",
        language: "Python",
        topics: ["python", "machine-learning"],
        structure: ["requirements.txt", "src/main.py"],
        license: null,
        hasTests: true,
        hasDocs: false,
        hasCI: false,
        installCommand: "pip install -r requirements.txt",
        runCommand: "python main.py",
        dependencies: [],
        devDependencies: [],
        packageJson: null,
      }

      const readme = await generateReadmeFromAnalysis(analysis)

      expect(readme).toContain("# python-repo")
      expect(readme).toContain("A Python repository")
      expect(readme).toContain("pip install -r requirements.txt")
      expect(readme).toContain("python main.py")
      expect(readme).toContain("python")
      expect(readme).toContain("machine-learning")
    })

    it("should handle errors and generate a fallback README", async () => {
      // Mock implementation to force an error
      jest.spyOn(console, "error").mockImplementation(() => {})

      const mockAnalysis = {
        name: "error-repo",
        description: "Repository that causes an error",
        language: "Unknown",
        topics: [],
        structure: [],
        license: null,
        hasTests: false,
        hasDocs: false,
        hasCI: false,
        installCommand: "",
        runCommand: "",
        dependencies: [],
        devDependencies: [],
        packageJson: null,
      }

      // Force an error by passing an invalid template
      const originalGetReadmeTemplate = (global as any).getReadmeTemplate
      ;(global as any).getReadmeTemplate = () => {
        throw new Error("Template error")
      }

      const readme = await generateReadmeFromAnalysis(mockAnalysis)

      // Restore original function
      ;(global as any).getReadmeTemplate = originalGetReadmeTemplate

      // Should still generate a basic README
      expect(readme).toContain("# error-repo")
      expect(readme).toContain("Repository that causes an error")
    })
  })
})

