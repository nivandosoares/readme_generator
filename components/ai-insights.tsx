"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Sparkles, RefreshCw } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import type { Repository } from "@/lib/types"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Info } from "lucide-react"
import { marked } from "marked"
import DOMPurify from "dompurify"

interface AIInsightsProps {
  repo: Repository | null
}

export function AIInsights({ repo }: AIInsightsProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [insights, setInsights] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [usedFallback, setUsedFallback] = useState(false)

  // Generate insights when repo changes
  useEffect(() => {
    if (repo) {
      generateInsights()
    }
  }, [repo])

  const generateInsights = async () => {
    if (!repo) return

    setLoading(true)
    setError(null)
    setUsedFallback(false)

    try {
      // Try to use the OpenAI API
      const { text } = await generateText({
        model: openai("gpt-4o"),
        system: `You are GitInsight, an AI assistant specialized in analyzing GitHub repositories and providing valuable insights.

Your task is to analyze the repository metadata and generate a comprehensive markdown report with insights about:
1. The project's purpose and main features
2. Technical stack and architecture
3. Potential use cases
4. Development activity and community engagement
5. Recommendations for users or contributors

Format your response as a well-structured markdown document with:
- Clear headings and subheadings
- Bullet points for key insights
- Code examples where relevant
- Proper markdown formatting throughout`,
        prompt: `Repository Information:
Name: ${repo.name}
Owner: ${repo.owner.login}
Description: ${repo.description || "No description provided"}
Primary Language: ${repo.language || "Not specified"}
Stars: ${repo.stargazers_count}
Forks: ${repo.forks_count}
Topics/Tags: ${repo.topics.join(", ") || "None"}
Created: ${new Date(repo.created_at).toLocaleDateString()}
Last Updated: ${new Date(repo.updated_at).toLocaleDateString()}
Open Issues: ${repo.open_issues_count}
License: ${repo.license?.name || "Not specified"}
Repository URL: ${repo.html_url}

Generate a comprehensive markdown report with insights about this repository. Focus on providing valuable information that would help someone understand the project, its purpose, technical aspects, and potential uses.`,
      })

      setInsights(text)
    } catch (error) {
      console.error("AI generation error:", error)

      // Fall back to template-based insights
      generateFallbackInsights()

      // Show error message
      const errorMessage = error instanceof Error ? error.message : "Failed to generate AI insights"
      setError(errorMessage)

      toast({
        variant: "destructive",
        title: "Error Generating AI Insights",
        description: "Falling back to template-based insights due to API limitations.",
      })
    } finally {
      setLoading(false)
    }
  }

  // Generate template-based insights without using the API
  const generateFallbackInsights = () => {
    if (!repo) return

    setUsedFallback(true)

    try {
      // Create a simple template-based insight
      const createdDate = new Date(repo.created_at).toLocaleDateString()
      const updatedDate = new Date(repo.updated_at).toLocaleDateString()

      const fallbackInsights = `# Repository Insights: ${repo.name}

## Overview

**${repo.name}** is a ${repo.language || "multi-language"} repository created by [${repo.owner.login}](${repo.owner.html_url}) on ${createdDate}. ${repo.description || "No description provided."}

## Key Statistics

- **Stars**: ${repo.stargazers_count}
- **Forks**: ${repo.forks_count}
- **Open Issues**: ${repo.open_issues_count}
- **License**: ${repo.license?.name || "Not specified"}
- **Last Updated**: ${updatedDate}

${
  repo.topics.length > 0
    ? `
## Topics/Tags

${repo.topics.map((topic) => `- ${topic}`).join("\n")}
`
    : ""
}

## Technical Analysis

${
  repo.language
    ? `
The primary language used in this repository is **${repo.language}**.
`
    : "No primary language has been identified for this repository."
}

## Community Engagement

This repository has attracted **${repo.stargazers_count}** stars and has been forked **${repo.forks_count}** times.

${repo.open_issues_count > 0 ? `There are currently **${repo.open_issues_count}** open issues.` : "There are currently no open issues."}

## Additional Resources

- [Repository Homepage](${repo.html_url})
${repo.homepage ? `- [Project Website](${repo.homepage})` : ""}

---

*This analysis was generated based on repository metadata. For a more comprehensive understanding, consider exploring the repository directly.*
`
      setInsights(fallbackInsights)
    } catch (error) {
      console.error("Error generating fallback insights:", error)
      setError("Failed to generate insights. Please try again.")
    }
  }

  // Convert Markdown to HTML using `marked` and sanitize it
  const htmlContent = insights ? DOMPurify.sanitize(marked.parse(insights)) : ""

  if (!repo) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            AI Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">Select a repository to get AI-powered insights</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          AI Insights for {repo.name}
        </CardTitle>
        {!loading && (
          <Button variant="outline" size="sm" onClick={generateInsights} disabled={loading}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh Insights
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {usedFallback && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Template-Based Insights</AlertTitle>
            <AlertDescription>
              These insights were generated using a template rather than AI due to API limitations.
            </AlertDescription>
          </Alert>
        )}

        {error && !usedFallback && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Analyzing repository and generating insights...</p>
          </div>
        )}

        {insights && !loading && (
          <div className="border rounded-md p-4 bg-card">
            <div
              className="markdown-body prose dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}

