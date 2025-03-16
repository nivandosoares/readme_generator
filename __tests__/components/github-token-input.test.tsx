import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { GitHubTokenInput } from "@/components/github-token-input"
import { useToast } from "@/components/ui/use-toast"
import { githubApi } from "@/lib/github-api"

// Mock the useToast hook
jest.mock("@/components/ui/use-toast", () => ({
  useToast: jest.fn(),
}))

// Mock the githubApi
jest.mock("@/lib/github-api", () => ({
  githubApi: {
    setToken: jest.fn(),
  },
}))

describe("GitHubTokenInput", () => {
  const mockToast = { toast: jest.fn() }

  beforeEach(() => {
    ;(useToast as jest.Mock).mockReturnValue(mockToast)
    jest.clearAllMocks()
    localStorage.clear()
  })

  it("renders the button to add a GitHub token", () => {
    render(<GitHubTokenInput />)

    expect(screen.getByRole("button", { name: /add github token/i })).toBeInTheDocument()
  })

  it("opens a dialog when the button is clicked", () => {
    render(<GitHubTokenInput />)

    fireEvent.click(screen.getByRole("button", { name: /add github token/i }))

    expect(screen.getByRole("dialog")).toBeInTheDocument()
    expect(screen.getByText(/github personal access token/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/personal access token/i)).toBeInTheDocument()
  })

  it("saves the token when the save button is clicked", async () => {
    render(<GitHubTokenInput />)

    // Open the dialog
    fireEvent.click(screen.getByRole("button", { name: /add github token/i }))

    // Enter a token
    const input = screen.getByLabelText(/personal access token/i)
    fireEvent.change(input, { target: { value: "test-token" } })

    // Click save
    fireEvent.click(screen.getByRole("button", { name: /save token/i }))

    // Check that the token was saved
    expect(localStorage.getItem("github_token")).toBe("test-token")
    expect(githubApi.setToken).toHaveBeenCalledWith("test-token")
    expect(mockToast.toast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "GitHub token saved",
      }),
    )

    // Dialog should be closed
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    })

    // Button text should change
    expect(screen.getByRole("button", { name: /github token set/i })).toBeInTheDocument()
  })

  it("removes the token when the remove button is clicked", async () => {
    // Set a token in localStorage
    localStorage.setItem("github_token", "test-token")

    render(<GitHubTokenInput />)

    // Initially, the button should show that a token is set
    expect(screen.getByRole("button", { name: /github token set/i })).toBeInTheDocument()

    // Open the dialog
    fireEvent.click(screen.getByRole("button", { name: /github token set/i }))

    // Click remove
    fireEvent.click(screen.getByRole("button", { name: /remove token/i }))

    // Check that the token was removed
    expect(localStorage.getItem("github_token")).toBeNull()
    expect(githubApi.setToken).toHaveBeenCalledWith("")
    expect(mockToast.toast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "GitHub token removed",
      }),
    )

    // Button text should change back
    expect(screen.getByRole("button", { name: /add github token/i })).toBeInTheDocument()
  })

  it("loads the token from localStorage on mount", () => {
    // Set a token in localStorage
    localStorage.setItem("github_token", "test-token")

    render(<GitHubTokenInput />)

    // Button should show that a token is set
    expect(screen.getByRole("button", { name: /github token set/i })).toBeInTheDocument()
    expect(githubApi.setToken).toHaveBeenCalledWith("test-token")
  })
})

