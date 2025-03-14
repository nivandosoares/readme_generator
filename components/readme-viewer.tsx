"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, Copy, Check } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"

interface ReadmeViewerProps {
  readme: string
  repoName: string
  repoOwner: string
  repoBranch: string
}

export function ReadmeViewer({ readme, repoName }: ReadmeViewerProps) {
  const { toast } = useToast()
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(readme)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)

    toast({
      title: "Copied to clipboard",
      description: "README content has been copied to your clipboard",
    })
  }

  const handleDownload = () => {
    const blob = new Blob([readme], { type: "text/markdown" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `README-${repoName}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: "Downloaded",
      description: `README-${repoName}.md has been downloaded`,
    })
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Generated README</CardTitle>
        <div className="flex gap-2">
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
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="preview">
          <TabsList className="mb-4">
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="raw">Raw Markdown</TabsTrigger>
          </TabsList>
          <TabsContent value="preview">
            <div className="prose dark:prose-invert max-w-none border rounded-md p-4 bg-card">
              <div dangerouslySetInnerHTML={{ __html: markdownToHtml(readme) }} />
            </div>
          </TabsContent>
          <TabsContent value="raw">
            <pre className="border rounded-md p-4 overflow-auto bg-muted text-sm">{readme}</pre>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

// Using a more comprehensive markdown to HTML converter
function markdownToHtml(markdown: string): string {
  return (
    markdown
      // Headers
      .replace(/^# (.*$)/gm, "<h1>$1</h1>")
      .replace(/^## (.*$)/gm, "<h2>$1</h2>")
      .replace(/^### (.*$)/gm, "<h3>$1</h3>")
      .replace(/^#### (.*$)/gm, "<h4>$1</h4>")
      .replace(/^##### (.*$)/gm, "<h5>$1</h5>")
      .replace(/^###### (.*$)/gm, "<h6>$1</h6>")
      // Bold
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      // Italic
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      // Code blocks
      .replace(/```([\s\S]*?)```/g, "<pre><code>$1</code></pre>")
      // Inline code
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      // Links
      .replace(/\[(.*?)\]$$(.*?)$$/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
      // Images
      .replace(/!\[(.*?)\]$$(.*?)$$/g, '<img src="$2" alt="$1" />')
      // Unordered lists
      .replace(/^\s*[*-]\s(.*$)/gm, "<li>$1</li>")
      // Ordered lists
      .replace(/^\s*\d+\.\s(.*$)/gm, "<li>$1</li>")
      // Wrap lists
      .replace(/(<li>.*<\/li>)\s*(<li>)/g, "$1$2")
      .replace(/(<li>.*<\/li>)(?!\s*<li>)/g, "<ul>$1</ul>")
      // Horizontal rule
      .replace(/^---$/gm, "<hr>")
      // Blockquotes
      .replace(/^>\s(.*$)/gm, "<blockquote>$1</blockquote>")
      // Tables (basic support)
      .replace(/\|(.+)\|/g, "<tr><td>$1</td></tr>")
      .replace(/<tr>(.+)<\/tr>/g, "<table>$1</table>")
      // Paragraphs (must be last)
      .replace(/^(?!<[a-z])(.*$)/gm, (match) => (match.trim() ? "<p>" + match + "</p>" : ""))
  )
}

