"use client"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Check, FileText, GitFork, Loader2, Lock, Star } from "lucide-react"
import { generateRepoReadme } from "@/lib/actions"
import type { Repository } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { useState } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

interface RepoListProps {
  repos: Repository[]
  loading: boolean
  selectedRepo: Repository | null
  setSelectedRepo: (repo: Repository | null) => void
  setReadme: (readme: string | null) => void
  generatingReadme: boolean
  setGeneratingReadme: (generating: boolean) => void
  setActiveTab: (tab: string) => void
}

export function RepoList({
  repos,
  loading,
  selectedRepo,
  setSelectedRepo,
  setReadme,
  generatingReadme,
  setGeneratingReadme,
  setActiveTab,
}: RepoListProps) {
  const { toast } = useToast()
  const [error, setError] = useState<string | null>(null)

  const handleGenerateReadme = async (repo: Repository) => {
    setSelectedRepo(repo)
    setGeneratingReadme(true)
    setError(null)

    try {
      const { readme } = await generateRepoReadme(repo)

      setReadme(readme)
      setActiveTab("readme")

      toast({
        title: "README Generated",
        description: `Successfully generated README for ${repo.name}`,
      })
    } catch (error) {
      console.error("Failed to generate README:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to generate README. Please try again."

      setError(errorMessage)

      toast({
        variant: "destructive",
        title: "Generation Failed",
        description: errorMessage,
      })
    } finally {
      setGeneratingReadme(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-72" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full" />
            </CardContent>
            <CardFooter>
              <Skeleton className="h-10 w-32" />
            </CardFooter>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {repos.length > 0 ? (
        repos.map((repo) => (
          <Card key={repo.id} className={selectedRepo?.id === repo.id ? "border-primary" : ""}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {repo.private && <Lock className="h-4 w-4 text-amber-500" />}
                <a href={repo.html_url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                  {repo.name}
                </a>
              </CardTitle>
              <CardDescription className="flex flex-wrap gap-2 items-center">
                {repo.language && <Badge variant="outline">{repo.language}</Badge>}
                <div className="flex items-center gap-1">
                  <Star className="h-3.5 w-3.5" />
                  <span>{repo.stargazers_count}</span>
                </div>
                <div className="flex items-center gap-1">
                  <GitFork className="h-3.5 w-3.5" />
                  <span>{repo.forks_count}</span>
                </div>
                <span className="text-xs">Updated: {new Date(repo.updated_at).toLocaleDateString()}</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{repo.description || "No description available"}</p>
              {repo.topics && repo.topics.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {repo.topics.map((topic) => (
                    <Badge key={topic} variant="secondary" className="text-xs">
                      {topic}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button variant="outline" onClick={() => handleGenerateReadme(repo)} disabled={generatingReadme}>
                {generatingReadme && selectedRepo?.id === repo.id ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : selectedRepo?.id === repo.id ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    README Generated
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Generate README
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        ))
      ) : (
        <div className="text-center py-10">
          <p className="text-muted-foreground">No repositories found</p>
        </div>
      )}
    </div>
  )
}

