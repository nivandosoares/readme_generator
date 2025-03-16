import { GitHubApiClient } from "@/lib/github-api"
import { cache } from "@/lib/cache"
import { beforeEach, describe, expect, it, jest } from "@jest/globals"

// Mock fetch
const mockFetch = jest.fn()
global.fetch = mockFetch

// Mock cache
jest.mock("@/lib/cache", () => ({
  cache: {
    get: jest.fn(),
    set: jest.fn(),
    clear: jest.fn(),
  },
}))

describe("GitHubApiClient", () => {
  let githubApi: GitHubApiClient

  beforeEach(() => {
    githubApi = new GitHubApiClient()
    jest.clearAllMocks()

    // Default mock implementation
    mockFetch.mockImplementation(async () => ({
      ok: true,
      status: 200,
      json: async () => ({}),
      headers: new Headers({
        "X-RateLimit-Remaining": "59",
        "X-RateLimit-Reset": "1600000000",
      }),
    }))
  })

  describe("fetchUserRepos", () => {
    it("should fetch user repositories", async () => {
      const mockRepos = [
        { id: 1, name: "repo1" },
        { id: 2, name: "repo2" },
      ]
      mockFetch.mockImplementationOnce(async () => ({
        ok: true,
        status: 200,
        json: async () => mockRepos,
        headers: new Headers(),
      }))

      const repos = await githubApi.fetchUserRepos("testuser")

      expect(repos).toEqual(mockRepos)
      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.github.com/users/testuser/repos?sort=updated&per_page=10",
        expect.objectContaining({
          headers: expect.objectContaining({
            Accept: "application/vnd.github.v3+json",
          }),
        }),
      )
    })

    it("should use cached data when available", async () => {
      const mockRepos = [{ id: 1, name: "repo1" }](cache.get as jest.Mock).mockReturnValueOnce(mockRepos)

      const repos = await githubApi.fetchUserRepos("testuser")

      expect(repos).toEqual(mockRepos)
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it("should handle user not found error", async () => {
      mockFetch.mockImplementationOnce(async () => ({
        ok: false,
        status: 404,
        headers: new Headers(),
      }))

      await expect(githubApi.fetchUserRepos("nonexistentuser")).rejects.toThrow("GitHub user not found")
    })

    it("should handle rate limit exceeded error", async () => {
      mockFetch.mockImplementationOnce(async () => ({
        ok: false,
        status: 403,
        headers: new Headers({
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": "1600000000",
        }),
      }))

      await expect(githubApi.fetchUserRepos("testuser")).rejects.toThrow(/GitHub API rate limit exceeded/)
    })
  })

  describe("fetchRepoContents", () => {
    it("should fetch repository contents", async () => {
      const mockContents = [{ path: "file1.js" }, { path: "file2.js" }]
      mockFetch.mockImplementationOnce(async () => ({
        ok: true,
        status: 200,
        json: async () => mockContents,
        headers: new Headers(),
      }))

      const contents = await githubApi.fetchRepoContents("owner", "repo")

      expect(contents).toEqual(mockContents)
      expect(mockFetch).toHaveBeenCalledWith("https://api.github.com/repos/owner/repo/contents", expect.anything())
    })

    it("should use cached data when available", async () => {
      const mockContents = [{ path: "file1.js" }](cache.get as jest.Mock).mockReturnValueOnce(mockContents)

      const contents = await githubApi.fetchRepoContents("owner", "repo")

      expect(contents).toEqual(mockContents)
      expect(mockFetch).not.toHaveBeenCalled()
    })
  })

  describe("fetchFileContent", () => {
    it("should fetch and decode file content", async () => {
      // Base64 encoded "test content"
      const encodedContent = "dGVzdCBjb250ZW50"
      mockFetch.mockImplementationOnce(async () => ({
        ok: true,
        status: 200,
        json: async () => ({ content: encodedContent }),
        headers: new Headers(),
      }))

      // Mock atob to avoid DOM dependency
      global.atob = jest.fn().mockImplementation(() => "test content")

      const content = await githubApi.fetchFileContent("owner", "repo", "file.txt")

      expect(content).toBe("test content")
    })
  })
})

