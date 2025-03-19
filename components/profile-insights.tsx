"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, RefreshCw, LineChart } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import type { UserProfile, Repository } from "@/lib/types"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { marked } from "marked"
import DOMPurify from "dompurify"
import { generateProfileInsights } from "@/lib/repo-analysis"

interface ProfileInsightsProps {
  profile: UserProfile | null
  repos: Repository[]
}

export function ProfileInsights({ profile, repos }: ProfileInsightsProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [insights, setInsights] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Generate insights when profile changes
  useEffect(() => {
    if (profile && repos.length > 0) {
      generateInsights()
    }
  }, [profile, repos])

  const generateInsights = async () => {
    if (!profile || repos.length === 0) return

    setLoading(true)
    setError(null)

    try {
      // Short timeout to simulate processing
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Generate enhanced profile insights using the dedicated function
      const result = generateProfileInsights(profile, repos)
      setInsights(result)

      toast({
        title: "Insights Generated",
        description: "Profile insights have been generated successfully.",
      })
    } catch (error) {
      console.error("Error generating insights:", error)

      // Show error message
      const errorMessage = error instanceof Error ? error.message : "Failed to generate insights"
      setError(errorMessage)

      toast({
        variant: "destructive",
        title: "Error Generating Insights",
        description: "There was a problem analyzing this profile.",
      })
    } finally {
      setLoading(false)
    }
  }

  // Convert Markdown to HTML using `marked` and sanitize it
  const htmlContent = insights ? DOMPurify.sanitize(marked.parse(insights)) : ""

  if (!profile) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LineChart className="h-5 w-5" />
            Profile Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">Enter a GitHub username to get insights</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <LineChart className="h-5 w-5" />
          Professional Profile Analysis: {profile.login}
        </CardTitle>
        {!loading && (
          <Button variant="outline" size="sm" onClick={generateInsights} disabled={loading}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh Analysis
          </Button>
        )}
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
            <p className="text-muted-foreground">Analyzing profile...</p>
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

