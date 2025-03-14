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
  // Convert headers
  markdown = markdown
    .replace(/^# (.*$)/gm, "<h1>$1</h1>")
    .replace(/^## (.*$)/gm, "<h2>$1</h2>")
    .replace(/^### (.*$)/gm, "<h3>$1</h3>")
    .replace(/^#### (.*$)/gm, "<h4>$1</h4>")
    .replace(/^##### (.*$)/gm, "<h5>$1</h5>")
    .replace(/^###### (.*$)/gm, "<h6>$1</h6>");

  // Convert bold and italic
  markdown = markdown
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>");

  // Convert code blocks
  markdown = markdown.replace(/```([\s\S]*?)```/g, "<pre><code>$1</code></pre>");

  // Convert inline code
  markdown = markdown.replace(/`([^`]+)`/g, "<code>$1</code>");

  // Convert links
  markdown = markdown.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

  // Convert images
  markdown = markdown.replace(/!\[([^\]]+)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />');

  // Convert unordered lists
  markdown = markdown.replace(/^\s*[-*+]\s(.*$)/gm, "<li>$1</li>");

  // Convert ordered lists
  markdown = markdown.replace(/^\s*\d+\.\s(.*$)/gm, "<li>$1</li>");

  // Wrap lists in <ul> or <ol>
  markdown = markdown.replace(/(<li>.*<\/li>)\s*(<li>)/g, "$1$2");
  markdown = markdown.replace(/(<li>.*<\/li>)(?!\s*<li>)/g, "<ul>$1</ul>");

  // Convert horizontal rules
  markdown = markdown.replace(/^---$/gm, "<hr>");

  // Convert blockquotes
  markdown = markdown.replace(/^>\s(.*$)/gm, "<blockquote>$1</blockquote>");

  // Convert tables (basic support)
  markdown = markdown.replace(/\|(.+)\|/g, (match) => {
    const cells = match.split("|").map((cell) => cell.trim());
    return `<tr>${cells.map((cell) => `<td>${cell}</td>`).join("")}</tr>`;
  });
  markdown = markdown.replace(/<tr>(.+)<\/tr>/g, "<table>$1</table>");

  // Convert paragraphs (must be last)
  markdown = markdown.replace(/^(?!<[a-z])(.*$)/gm, (match) => (match.trim() ? "<p>" + match + "</p>" : ""));

  return markdown;
}

