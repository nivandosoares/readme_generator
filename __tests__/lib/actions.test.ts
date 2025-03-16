import { fetchUserRepos, fetchRepoContents, generateRepoReadme } from "@/lib/actions"
import { githubApi } from "@/lib/github-api"
import { analyzeRepository, generateReadmeFromAnalysis } from "@/lib/llm"
import { describe, beforeEach, it, expect, jest } from "@jest/globals"

// Mock the GitHub API client
jest.mock("@/lib/github-api", () => ({
  githubApi: {
    fetchUserRepos: jest.fn(),
    fetchRepoContents: jest.fn(),
    fetchFileContent: jest.fn(),
  },
}))

// Mock the LLM functions
jest.mock("@/lib/llm", () => ({
  analyzeRepository: jest.fn(),
  generateReadmeFromAnalysis: jest.fn(),
}))

describe("GitHub Actions", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("fetchUserRepos", () => {
    it("should fetch repositories for a user", async () => {
      const mockRepos = [
        { id: 1, name: "repo1" },
        { id: 2, name: "repo2" },
      ]
      ;(githubApi.fetchUserRepos as jest.Mock).mockResolvedValue(mockRepos)

      const result = await fetchUserRepos("testuser")

      expect(result).toEqual(mockRepos)
      expect(githubApi.fetchUserRepos).toHaveBeenCalledWith("testuser")
    })

    it("should propagate errors", async () => {
      const error = new Error("API error")
      ;(githubApi.fetchUserRepos as jest.Mock).mockRejectedValue(error)

      await expect(fetchUserRepos("testuser")).rejects.toThrow("API error")
    })
  })

  describe("fetchRepoContents", () => {
    it("should fetch repository contents", async () => {
      const mockRepo = {
        id: 1,
        name: "repo1",
        owner: { login: "owner" },
        language: "JavaScript",
      } as any

      const mockContents = [{ path: "file1.js" }, { path: "file2.js" }]
      ;(githubApi.fetchRepoContents as jest.Mock).mockResolvedValue(mockContents)

      const result = await fetchRepoContents(mockRepo)

      expect(result).toEqual(["file1.js", "file2.js"])
      expect(githubApi.fetchRepoContents).toHaveBeenCalledWith("owner", "repo1")
    })

    it("should return default structure on error", async () => {
      const mockRepo = {
        id: 1,
        name: "repo1",
        owner: { login: "owner" },
        language: "JavaScript",
      } as any
      ;(githubApi.fetchRepoContents as jest.Mock).mockRejectedValue(new Error("API error"))

      const result = await fetchRepoContents(mockRepo)

      // Should return default JavaScript structure
      expect(result).toContain("package.json")
      expect(result).toContain("src/")
    })
  })

  describe("generateRepoReadme", () => {
    it("should generate a README for a repository", async () => {
      const mockRepo = {
        id: 1,
        name: "repo1",
        owner: { login: "owner" },
        language: "JavaScript",
        full_name: "owner/repo1",
      } as any

      const mockContents = ["package.json", "src/index.js"]
      const mockPackageJson = { dependencies: { react: "^18.0.0" } }
      const mockAnalysis = { name: "repo1", language: "JavaScript" }
      const mockReadme = "# repo1\n\nA JavaScript project"
      ;(githubApi.fetchRepoContents as jest.Mock).mockResolvedValue(mockContents.map((path) => ({ path })))
      ;(githubApi.fetchFileContent as jest.Mock).mockResolvedValue(JSON.stringify(mockPackageJson))
      ;(analyzeRepository as jest.Mock).mockResolvedValue(mockAnalysis)
      ;(generateReadmeFromAnalysis as jest.Mock).mockResolvedValue(mockReadme)

      const result = await generateRepoReadme(mockRepo)

      expect(result).toEqual({ success: true, readme: mockReadme })
      expect(analyzeRepository).toHaveBeenCalledWith(mockRepo, expect.any(Array), expect.any(Object))
      expect(generateReadmeFromAnalysis).toHaveBeenCalledWith(mockAnalysis)
    })

    it("should propagate errors", async () => {
      const mockRepo = {
        id: 1,
        name: "repo1",
        owner: { login: "owner" },
        language: "JavaScript",
        full_name: "owner/repo1",
      } as any
      ;(githubApi.fetchRepoContents as jest.Mock).mockRejectedValue(new Error("API error"))

      await expect(generateRepoReadme(mockRepo)).rejects.toThrow()
    })
  })
})

