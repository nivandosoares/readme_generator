"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Key, Info, Check } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { githubApi } from "@/lib/github-api"

export function GitHubTokenInput() {
  const [token, setToken] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const [hasToken, setHasToken] = useState(false)
  const { toast } = useToast()

  // Check if token exists in localStorage on component mount
  useEffect(() => {
    const storedToken = localStorage.getItem("github_token")
    if (storedToken) {
      setHasToken(true)
      githubApi.setToken(storedToken)
    }
  }, [])

  const handleSaveToken = () => {
    if (token.trim()) {
      try {
        localStorage.setItem("github_token", token)
        githubApi.setToken(token)
        setHasToken(true)
        setIsOpen(false)

        toast({
          title: "GitHub token saved",
          description: "Your token has been saved and will be used for API requests",
        })
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error saving token",
          description: "Could not save your GitHub token",
        })
      }
    }
  }

  const handleRemoveToken = () => {
    try {
      localStorage.removeItem("github_token")
      githubApi.setToken("")
      setHasToken(false)
      setToken("")

      toast({
        title: "GitHub token removed",
        description: "Your token has been removed",
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error removing token",
        description: "Could not remove your GitHub token",
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          {hasToken ? <Check className="h-4 w-4" /> : <Key className="h-4 w-4" />}
          {hasToken ? "GitHub Token Set" : "Add GitHub Token"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>GitHub Personal Access Token</DialogTitle>
          <DialogDescription>
            Add a GitHub token to increase API rate limits from 60 to 5,000 requests per hour.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex items-start space-x-2 rounded-md border p-4">
            <Info className="h-5 w-5 text-blue-500 mt-0.5" />
            <div className="text-sm">
              <p>
                Create a token with <strong>public_repo</strong> scope at:
              </p>
              <a
                href="https://github.com/settings/tokens/new"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                github.com/settings/tokens/new
              </a>
              <p className="mt-2">Your token is stored locally and never sent to our servers.</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="github-token">Personal Access Token</Label>
            <Input
              id="github-token"
              type="password"
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              value={token}
              onChange={(e) => setToken(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter className="flex flex-col sm:flex-row sm:justify-between sm:space-x-2">
          {hasToken && (
            <Button variant="outline" type="button" onClick={handleRemoveToken} className="mb-2 sm:mb-0">
              Remove Token
            </Button>
          )}
          <div className="flex flex-col sm:flex-row sm:space-x-2 space-y-2 sm:space-y-0">
            <Button type="button" onClick={() => setIsOpen(false)} variant="outline">
              Cancel
            </Button>
            <Button type="button" onClick={handleSaveToken} disabled={!token.trim()}>
              Save Token
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

