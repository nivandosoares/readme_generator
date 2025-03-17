"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Loader2, Search, User, Link } from "lucide-react"
import { fetchUserRepos, fetchRepoByUrl, parseGitHubUrl } from "@/lib/actions"
import type { Repository } from "@/lib/types"
import { Tabs, TabsList, TabsContent, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"

interface RepoSearchProps {
  setRepos: (repos: Repository[]) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setSelectedRepo: (repo: Repository | null) => void
  setReadme: (readme: string | null) => void
}

export function RepoSearch({ setRepos, setLoading, setError, setSelectedRepo, setReadme }: RepoSearchProps) {
  const [username, setUsername] = useState("")
  const [repoUrl, setRepoUrl] = useState("")
  const [localLoading, setLocalLoading] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const [searchType, setSearchType] = useState<"user" | "repo">("user")

  const handleUserSearch = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!username.trim()) {
      setLocalError("Please enter a GitHub username")
      return
    }

    setLocalLoading(true)
    setLocalError(null)
    setLoading(true)
    setError(null)
    setRepos([])
    setSelectedRepo(null)
    setReadme(null)

    try {
      const data = await fetchUserRepos(username)
      setRepos(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred"
      setLocalError(errorMessage)
      setError(errorMessage)
    } finally {
      setLocalLoading(false)
      setLoading(false)
    }
  }

  const handleRepoSearch = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!repoUrl.trim()) {
      setLocalError("Please enter a GitHub repository URL")
      return
    }

    // Validate URL format
    const { owner, repo } = parseGitHubUrl(repoUrl)
    if (!owner || !repo) {
      setLocalError("Invalid GitHub repository URL. Please use format: https://github.com/owner/repo")
      return
    }

    setLocalLoading(true)
    setLocalError(null)
    setLoading(true)
    setError(null)
    setRepos([])
    setSelectedRepo(null)
    setReadme(null)

    try {
      const repository = await fetchRepoByUrl(repoUrl)
      if (repository) {
        setRepos([repository])
      } else {
        throw new Error("Repository not found")
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred"
      setLocalError(errorMessage)
      setError(errorMessage)
    } finally {
      setLocalLoading(false)
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue="user" onValueChange={(value) => setSearchType(value as "user" | "repo")}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="user">
            <User className="mr-2 h-4 w-4" />
            Search by User
          </TabsTrigger>
          <TabsTrigger value="repo">
            <Link className="mr-2 h-4 w-4" />
            Search by Repository URL
          </TabsTrigger>
        </TabsList>

        <TabsContent value="user" className="mt-4">
          <form onSubmit={handleUserSearch} className="space-y-2">
            <div className="space-y-1">
              <Label htmlFor="username">GitHub Username</Label>
              <div className="flex gap-2">
                <Input
                  id="username"
                  placeholder="Enter GitHub username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit" disabled={localLoading}>
                  {localLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" />
                      Search
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </TabsContent>

        <TabsContent value="repo" className="mt-4">
          <form onSubmit={handleRepoSearch} className="space-y-2">
            <div className="space-y-1">
              <Label htmlFor="repoUrl">GitHub Repository URL</Label>
              <div className="flex gap-2">
                <Input
                  id="repoUrl"
                  placeholder="https://github.com/owner/repo"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit" disabled={localLoading}>
                  {localLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" />
                      Search
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </TabsContent>
      </Tabs>

      {localError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{localError}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}

