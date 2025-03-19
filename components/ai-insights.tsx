"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, RefreshCw, LineChart, BookOpen } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import type { Repository } from "@/lib/types"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { marked } from "marked"
import DOMPurify from "dompurify"
import { generateRepositoryInsights } from "@/lib/repo-analysis"
import { learnFromRepository } from "@/lib/readme-learning"

interface AIInsightsProps {
  repo: Repository | null
}

export function AIInsights({ repo }: AIInsightsProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [insights, setInsights] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [contents, setContents] = useState<string[]>([])
  const [isLearning, setIsLearning] = useState(false)

  // Fetch repository contents when repo changes
  useEffect(() => {
    if (repo) {
      fetchContents()
    }
  }, [repo])

  const fetchContents = async () => {
    if (!repo) return

    setLoading(true)

    try {
      // Simulate fetching contents
      // In a real implementation, you would call an API to get the contents
      const mockContents = [
        "Makefile",
        "Kconfig",
        "README",
        "COPYING",
        "Documentation/",
        "arch/",
        "drivers/",
        "fs/",
        "include/",
        "init/",
        "kernel/",
        "lib/",
        "mm/",
        "net/",
      ]

      setContents(mockContents)
      // Make sure we're not passing undefined to generateInsights
      generateInsights(mockContents)
    } catch (error) {
      console.error("Error fetching contents:", error)
      setError("Failed to fetch repository contents")
    }
  }

  // Update the generateInsights function to use our learning-based approach
  const generateInsights = async (repoContents: string[] = []) => {
    if (!repo) return

    setLoading(true)
    setError(null)

    try {
      // Make sure repoContents is defined before using it
      const contentsToUse = repoContents || []

      // Generate insights using our repository-specific approach
      const result = generateRepositoryInsights(repo, contentsToUse)
      setInsights(result)

      toast({
        title: "Insights Generated",
        description: "Repository insights have been generated successfully.",
      })
    } catch (error) {
      console.error("Error generating insights:", error)

      // Show error message
      const errorMessage = error instanceof Error ? error.message : "Failed to generate insights"
      setError(errorMessage)

      toast({
        variant: "destructive",
        title: "Error Generating Insights",
        description: "There was a problem analyzing this repository.",
      })
    } finally {
      setLoading(false)
    }
  }

  // Add a function to learn from similar repositories
  const learnFromSimilarRepos = async () => {
    if (!repo) return

    setIsLearning(true)

    try {
      // Learn from this repository
      await learnFromRepository(repo)

      toast({
        title: "Learning Complete",
        description: "Successfully learned from this repository's structure.",
      })

      // Regenerate insights with the new knowledge
      generateInsights(contents)
    } catch (error) {
      console.error("Error learning from repository:", error)

      toast({
        variant: "destructive",
        title: "Learning Failed",
        description: "There was a problem learning from this repository.",
      })
    } finally {
      setIsLearning(false)
    }
  }

  // Convert Markdown to HTML using `marked` and sanitize it
  const htmlContent = insights ? DOMPurify.sanitize(marked.parse(insights)) : ""

  if (!repo) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LineChart className="h-5 w-5" />
            Repository Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">Select a repository to get insights</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <LineChart className="h-5 w-5" />
          Repository Insights: {repo.name}
        </CardTitle>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={learnFromSimilarRepos} disabled={isLearning || loading}>
            {isLearning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Learning...
              </>
            ) : (
              <>
                <BookOpen className="mr-2 h-4 w-4" />
                Learn Structure
              </>
            )}
          </Button>
          {!loading && (
            <Button variant="outline" size="sm" onClick={() => generateInsights(contents)} disabled={loading}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh Insights
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Analyzing repository...</p>
          </div>
        )}

        {insights && !loading && (
          <div className="markdown-body prose dark:prose-invert max-w-none border rounded-md p-4 bg-card">
            <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
          </div>
        )}
      </CardContent>
    </Card>
  )
}

