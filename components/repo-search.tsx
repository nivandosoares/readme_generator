"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Loader2, Search } from "lucide-react"
import { fetchUserRepos } from "@/lib/actions"
import type { Repository } from "@/lib/types"

interface RepoSearchProps {
  setRepos: (repos: Repository[]) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setSelectedRepo: (repo: Repository | null) => void
  setReadme: (readme: string | null) => void
}

export function RepoSearch({ setRepos, setLoading, setError, setSelectedRepo, setReadme }: RepoSearchProps) {
  const [username, setUsername] = useState("")
  const [localLoading, setLocalLoading] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  const handleSearch = async (e: React.FormEvent) => {
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

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearch} className="flex gap-2">
        <Input
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
      </form>

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

