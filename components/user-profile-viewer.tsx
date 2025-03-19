"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, Copy, Check, Loader2, User, LineChart } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { marked } from "marked" // Markdown-to-HTML library
import DOMPurify from "dompurify" // HTML sanitizer
import "github-markdown-css" // GitHub Markdown CSS
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { generateUserProfileReadme } from "@/lib/actions"
import { ProfileInsights } from "./profile-insights"
import type { UserProfile, Repository } from "@/lib/types"

// Enable GitHub-flavored Markdown
marked.setOptions({
  gfm: true, // GitHub Flavored Markdown
  breaks: true, // Convert line breaks to <br>
})

export function UserProfileViewer() {
  const { toast } = useToast()
  const [username, setUsername] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [readme, setReadme] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState("readme")
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [userRepos, setUserRepos] = useState<Repository[]>([])

  const handleGenerateReadme = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!username.trim()) {
      setError("Please enter a GitHub username")
      return
    }

    setLoading(true)
    setError(null)
    setReadme(null)
    setUserProfile(null)
    setUserRepos([])

    try {
      const result = await generateUserProfileReadme(username, true) // Set to always include insights

      if (!result || !result.readme) {
        throw new Error("Failed to generate README")
      }

      setReadme(result.readme)
      setUserProfile(result.profile)
      setUserRepos(result.repos || [])

      toast({
        title: "README Generated",
        description: `Successfully generated profile README for ${username}`,
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred"

      // Format the error message to be more user-friendly
      let formattedError = errorMessage
      if (errorMessage.includes("not found")) {
        formattedError = `GitHub user "${username}" not found. Please check the username and try again.`
      } else if (errorMessage.includes("API error")) {
        formattedError = "GitHub API error. Please try again later."
      }

      setError(formattedError)

      toast({
        variant: "destructive",
        title: "Generation Failed",
        description: formattedError,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    if (!readme) return

    navigator.clipboard.writeText(readme)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)

    toast({
      title: "Copied to clipboard",
      description: "README content has been copied to your clipboard",
    })
  }

  const handleDownload = () => {
    if (!readme) return

    const blob = new Blob([readme], { type: "text/markdown" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${username}-profile-README.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: "Downloaded",
      description: `${username}-profile-README.md has been downloaded`,
    })
  }

  // Create HTML content from readme
  const htmlContent = readme ? DOMPurify.sanitize(marked.parse(readme || "")) : ""

  return (
    <div className="space-y-6">
      <div className="max-w-3xl mx-auto space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">Generate GitHub Profile README</h2>
        <p className="text-muted-foreground">
          Create a comprehensive, professional README for your GitHub profile page with AI-powered insights.
        </p>
      </div>

      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Professional Profile README Generator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleGenerateReadme} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="profile-username">GitHub Username</Label>
              <div className="flex gap-2">
                <Input
                  id="profile-username"
                  placeholder="Enter GitHub username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>Generate Professional README</>
                  )}
                </Button>
              </div>
            </div>
          </form>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {readme && (
            <>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                  <TabsTrigger value="readme">Generated README</TabsTrigger>
                  <TabsTrigger value="insights">
                    <LineChart className="mr-2 h-4 w-4" />
                    Professional Profile Analysis
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="readme" className="mt-4 space-y-4">
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={handleCopy}>
                      {copied ? (
                        <>
                          <Check className="mr-2 h-4 w-4" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="mr-2 h-4 w-4" />
                          Copy
                        </>
                      )}
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleDownload}>
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                  </div>

                  <Tabs defaultValue="preview">
                    <TabsList className="mb-4">
                      <TabsTrigger value="preview">Preview</TabsTrigger>
                      <TabsTrigger value="raw">Raw Markdown</TabsTrigger>
                    </TabsList>
                    <TabsContent value="preview">
                      <div
                        className="markdown-body prose dark:prose-invert max-w-none border rounded-md p-4 bg-card"
                        dangerouslySetInnerHTML={{ __html: htmlContent }}
                      />
                    </TabsContent>
                    <TabsContent value="raw">
                      <pre className="border rounded-md p-4 overflow-auto bg-muted text-sm">{readme}</pre>
                    </TabsContent>
                  </Tabs>
                </TabsContent>

                <TabsContent value="insights" className="mt-4">
                  <div className="space-y-4">
                    <ProfileInsights profile={userProfile} repos={userRepos} />
                  </div>
                </TabsContent>
              </Tabs>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

