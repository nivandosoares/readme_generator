import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { RepoSearch } from "@/components/repo-search"
import { fetchUserRepos } from "@/lib/actions"

// Mock the actions
jest.mock("@/lib/actions", () => ({
  fetchUserRepos: jest.fn(),
}))

describe("RepoSearch", () => {
  const mockSetRepos = jest.fn()
  const mockSetLoading = jest.fn()
  const mockSetError = jest.fn()
  const mockSetSelectedRepo = jest.fn()
  const mockSetReadme = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("renders the search input and button", () => {
    render(
      <RepoSearch
        setRepos={mockSetRepos}
        setLoading={mockSetLoading}
        setError={mockSetError}
        setSelectedRepo={mockSetSelectedRepo}
        setReadme={mockSetReadme}
      />,
    )

    expect(screen.getByPlaceholderText("Enter GitHub username")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /search/i })).toBeInTheDocument()
  })

  it("shows an error when submitting an empty username", () => {
    render(
      <RepoSearch
        setRepos={mockSetRepos}
        setLoading={mockSetLoading}
        setError={mockSetError}
        setSelectedRepo={mockSetSelectedRepo}
        setReadme={mockSetReadme}
      />,
    )

    fireEvent.click(screen.getByRole("button", { name: /search/i }))

    expect(screen.getByText("Please enter a GitHub username")).toBeInTheDocument()
    expect(mockSetRepos).not.toHaveBeenCalled()
  })

  it("fetches repositories when a username is submitted", async () => {
    const mockRepos = [{ id: 1, name: "repo1" }]
    ;(fetchUserRepos as jest.Mock).mockResolvedValue(mockRepos)

    render(
      <RepoSearch
        setRepos={mockSetRepos}
        setLoading={mockSetLoading}
        setError={mockSetError}
        setSelectedRepo={mockSetSelectedRepo}
        setReadme={mockSetReadme}
      />,
    )

    const input = screen.getByPlaceholderText("Enter GitHub username")
    fireEvent.change(input, { target: { value: "testuser" } })
    fireEvent.click(screen.getByRole("button", { name: /search/i }))

    expect(mockSetLoading).toHaveBeenCalledWith(true)
    expect(mockSetError).toHaveBeenCalledWith(null)
    expect(mockSetRepos).toHaveBeenCalledWith([])
    expect(mockSetSelectedRepo).toHaveBeenCalledWith(null)
    expect(mockSetReadme).toHaveBeenCalledWith(null)

    await waitFor(() => {
      expect(fetchUserRepos).toHaveBeenCalledWith("testuser")
      expect(mockSetRepos).toHaveBeenCalledWith(mockRepos)
      expect(mockSetLoading).toHaveBeenCalledWith(false)
    })
  })

  it("handles errors when fetching repositories", async () => {
    const error = new Error("API error")
    ;(fetchUserRepos as jest.Mock).mockRejectedValue(error)

    render(
      <RepoSearch
        setRepos={mockSetRepos}
        setLoading={mockSetLoading}
        setError={mockSetError}
        setSelectedRepo={mockSetSelectedRepo}
        setReadme={mockSetReadme}
      />,
    )

    const input = screen.getByPlaceholderText("Enter GitHub username")
    fireEvent.change(input, { target: { value: "testuser" } })
    fireEvent.click(screen.getByRole("button", { name: /search/i }))

    await waitFor(() => {
      expect(mockSetError).toHaveBeenCalledWith("API error")
      expect(mockSetLoading).toHaveBeenCalledWith(false)
    })
  })
})

