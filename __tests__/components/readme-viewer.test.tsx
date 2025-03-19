import { render, screen, fireEvent } from "@testing-library/react"
import { ReadmeViewer } from "@/components/readme-viewer"
import { useToast } from "@/components/ui/use-toast"
import { expect, describe, beforeEach, it, jest } from "@jest/globals"

// Mock the useToast hook
jest.mock("@/components/ui/use-toast", () => ({
  useToast: jest.fn(),
}))

// Mock marked and DOMPurify
jest.mock("marked", () => ({
  parse: jest.fn().mockImplementation((text) => `<h1>Parsed ${text}</h1>`),
  setOptions: jest.fn(),
}))

jest.mock("dompurify", () => ({
  sanitize: jest.fn().mockImplementation((html) => html),
}))

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn(),
  },
})

// Mock URL.createObjectURL and URL.revokeObjectURL
URL.createObjectURL = jest.fn(() => "mock-url")
URL.revokeObjectURL = jest.fn()

describe("ReadmeViewer", () => {
  const mockToast = { toast: jest.fn() }

  beforeEach(() => {
    ;(useToast as jest.Mock).mockReturnValue(mockToast)
    jest.clearAllMocks()
  })

  it("renders the README content", () => {
    const readme = "# Test Repo\n\nThis is a test repository."

    render(<ReadmeViewer readme={readme} repoName="test-repo" repoOwner="testuser" repoBranch="main" />)

    expect(screen.getByText("Generated README")).toBeInTheDocument()

    // Switch to raw tab to see the markdown
    fireEvent.click(screen.getByRole("tab", { name: /raw/i }))
    expect(screen.getByText(/# Test Repo/)).toBeInTheDocument()
  })

  it("copies README to clipboard when copy button is clicked", () => {
    const readme = "# Test Repo\n\nThis is a test repository."

    render(<ReadmeViewer readme={readme} repoName="test-repo" repoOwner="testuser" repoBranch="main" />)

    fireEvent.click(screen.getByRole("button", { name: /copy/i }))

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(readme)
    expect(mockToast.toast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Copied to clipboard",
      }),
    )
  })

  it("downloads README when download button is clicked", () => {
    const readme = "# Test Repo\n\nThis is a test repository."

    // Mock document.createElement and appendChild
    const mockAnchor = {
      href: "",
      download: "",
      click: jest.fn(),
    }

    jest.spyOn(document, "createElement").mockImplementation(() => mockAnchor as any)
    jest.spyOn(document.body, "appendChild").mockImplementation(() => {})
    jest.spyOn(document.body, "removeChild").mockImplementation(() => {})

    render(<ReadmeViewer readme={readme} repoName="test-repo" repoOwner="testuser" repoBranch="main" />)

    fireEvent.click(screen.getByRole("button", { name: /download/i }))

    expect(URL.createObjectURL).toHaveBeenCalled()
    expect(mockAnchor.download).toBe("README-test-repo.md")
    expect(mockAnchor.click).toHaveBeenCalled()
    expect(URL.revokeObjectURL).toHaveBeenCalled()
    expect(mockToast.toast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Downloaded",
      }),
    )
  })
})

