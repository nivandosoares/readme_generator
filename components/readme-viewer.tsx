"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Copy, Check } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { marked } from "marked"; // Markdown-to-HTML library
import DOMPurify from "dompurify"; // HTML sanitizer
import "github-markdown-css"; // GitHub Markdown CSS

// Enable GitHub-flavored Markdown
marked.setOptions({
  gfm: true, // GitHub Flavored Markdown
  breaks: true, // Convert line breaks to <br>
});

interface ReadmeViewerProps {
  readme: string;
  repoName: string;
  repoOwner: string;
  repoBranch: string;
}

export function ReadmeViewer({ readme, repoName, repoOwner, repoBranch }: ReadmeViewerProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(readme);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);

    toast({
      title: "Copied to clipboard",
      description: "README content has been copied to your clipboard",
    });
  };

  const handleDownload = () => {
    const blob = new Blob([readme], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `README-${repoName}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Downloaded",
      description: `README-${repoName}.md has been downloaded`,
    });
  };

  // Process GitHub relative links
  const processedReadme = processGitHubLinks(readme, repoOwner, repoName, repoBranch);

  // Convert Markdown to HTML using `marked` and sanitize it
  const htmlContent = DOMPurify.sanitize(marked.parse(processedReadme));

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
            <div
              className="markdown-body prose dark:prose-invert max-w-none border rounded-md p-4 bg-card"
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            />
          </TabsContent>
          <TabsContent value="raw">
            <pre className="border rounded-md p-4 overflow-auto bg-muted text-sm">{processedReadme}</pre>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

// Helper to process GitHub-style relative links
function processGitHubLinks(markdown: string, owner: string, repo: string, branch: string): string {
  return markdown
    // Handle image links that start with ./
    .replace(/!\[([^\]]+)\]\(\.\/(.*?)\)/g, `![$1](https://github.com/${owner}/${repo}/raw/${branch}/$2)`)
    // Handle relative links to files that start with ./
    .replace(/\[([^\]]+)\]\(\.\/(.*?)\)/g, `[$1](https://github.com/${owner}/${repo}/blob/${branch}/$2)`)
    // Handle anchor links (keep them as-is)
    .replace(/\[([^\]]+)\]\(#(.*?)\)/g, `[$1](#$2)`)
    // Handle absolute links (leave them unchanged)
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, `[$1]($2)`);
}