import { Github } from "lucide-react"
import { ModeToggle } from "./mode-toggle"
import { GitHubTokenInput } from "./github-token-input"

export function Header() {
  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Github className="h-6 w-6" />
          <h1 className="text-xl font-bold">README Generator</h1>
        </div>
        <div className="flex items-center gap-2">
          <GitHubTokenInput />
          <ModeToggle />
        </div>
      </div>
    </header>
  )
}

