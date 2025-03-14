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

export function ReadmeViewer({ readme, repoName, repoOwner, repoBranch }: ReadmeViewerProps) {
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

  // Process readme content to handle GitHub relative links
  const processedReadme = processGitHubLinks(readme, repoOwner, repoName, repoBranch)

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
            <div className="prose dark:prose-invert max-w-none border rounded-md p-4 bg-card markdown-body">
              <div dangerouslySetInnerHTML={{ __html: markdownToHtml(processedReadme) }} />
            </div>
          </TabsContent>
          <TabsContent value="raw">
            <pre className="border rounded-md p-4 overflow-auto bg-muted text-sm">{processedReadme}</pre>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

// Helper to process GitHub-style relative links
function processGitHubLinks(markdown: string, owner: string, repo: string, branch: string): string {
  // Convert relative image links to absolute GitHub links
  return markdown
    // Handle image links that start with ./
    .replace(/!\[([^\]]+)\]\(\.\/(.*?)\)/g, 
      `![$1](https://github.com/${owner}/${repo}/raw/${branch}/$2)`)
    // Handle relative links to files
    .replace(/\[([^\]]+)\]\(\.\/(.*?)\)/g, 
      `[$1](https://github.com/${owner}/${repo}/blob/${branch}/$2)`)
    // Handle anchor links (keep them as-is but improve later if needed)
    .replace(/\[([^\]]+)\]\(#(.*?)\)/g, `[$1](#$2)`);
}

// Comprehensive markdown to HTML converter
function markdownToHtml(markdown: string): string {
  // Arrays to store extracted code blocks and inline code snippets
  const codeBlocks: string[] = [];
  const inlineCodes: string[] = [];

  // Step 1: Extract code blocks with language specification
  markdown = markdown.replace(/```([a-z]*)\n([\s\S]*?)```/g, (match, language, code) => {
    const index = codeBlocks.length;
    const languageClass = language ? ` class="language-${language}"` : '';
    codeBlocks.push(`<pre><code${languageClass}>${escapeHtml(code)}</code></pre>`);
    return `__CODE_BLOCK_${index}__`;
  });

  // Step 2: Extract inline code snippets
  markdown = markdown.replace(/`([^`]+)`/g, (match, code) => {
    const index = inlineCodes.length;
    inlineCodes.push(`<code>${escapeHtml(code)}</code>`);
    return `__INLINE_CODE_${index}__`;
  });


  // Step 4: Restore code blocks
  codeBlocks.forEach((block, index) => {
    markdown = markdown.replace(`__CODE_BLOCK_${index}__`, block);
  });


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
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/__(.*?)__/g, "<strong>$1</strong>")
    .replace(/_(.*?)_/g, "<em>$1</em>");

  // Handle badges/shields (like shield.io badges)
  markdown = markdown.replace(/!\[([^\]]*)\]\((https:\/\/img\.shields\.io\/[^)]+)\)/g, 
    '<img src="$2" alt="$1" class="inline-badge" style="display:inline-block;vertical-align:middle;margin:0 4px 0 0;" />');
  
  // Convert other images
  markdown = markdown.replace(/!\[([^\]]+)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />');

  // Convert links
  markdown = markdown.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

  // Process lists
  // Unordered lists
  markdown = markdown.replace(/^\s*[-*+]\s+(.*)$/gm, "<li>$1</li>");
  
  // Ordered lists
  markdown = markdown.replace(/^\s*\d+\.\s+(.*)$/gm, "<li>$1</li>");
  
  // Group consecutive list items
  let parsedContent = "";
  let listBuffer = "";
  let inList = false;
  
  markdown.split("\n").forEach((line) => {
    if (line.startsWith("<li>")) {
      if (!inList) {
        inList = true;
        // Check if this is the start of an ordered list
        const isOrdered = line.match(/^\d+\./);
        listBuffer = isOrdered ? "<ol>" : "<ul>";
      }
      listBuffer += line;
    } else {
      if (inList) {
        // End of list
        listBuffer += listBuffer.includes("<ol>") ? "</ol>" : "</ul>";
        parsedContent += listBuffer;
        listBuffer = "";
        inList = false;
      }
      parsedContent += line + "\n";
    }
  });
  
  // Handle any unclosed list
  if (inList) {
    listBuffer += listBuffer.includes("<ol>") ? "</ol>" : "</ul>";
    parsedContent += listBuffer;
  }
  
  markdown = parsedContent;

  // Convert blockquotes
  markdown = markdown.replace(/^>\s(.*)$/gm, "<blockquote>$1</blockquote>");
  
  // Group consecutive blockquotes
  markdown = markdown.replace(/<\/blockquote>\s*<blockquote>/g, "<br>");

  // Convert horizontal rules
  markdown = markdown.replace(/^---$/gm, "<hr>");
  markdown = markdown.replace(/^\*\*\*$/gm, "<hr>");
  markdown = markdown.replace(/^___$/gm, "<hr>");

  // Process tables
  markdown = markdown.replace(/^\|(.+)\|$/gm, (match) => {
    if (match.match(/^\|\s*[-:]+\s*\|$/)) {
      // This is a separator row, skip it
      return "";
    }
    
    const cells = match.split("|")
      .filter(cell => cell.trim() !== "")
      .map(cell => cell.trim());
    
    const isHeader = match.split("\n")[0] && match.split("\n")[1]?.match(/^\|\s*[-:]+\s*\|$/);
    
    if (isHeader) {
      return `<tr>${cells.map(cell => `<th>${cell}</th>`).join("")}</tr>`;
    } else {
      return `<tr>${cells.map(cell => `<td>${cell}</td>`).join("")}</tr>`;
    }
  });
  
  // Wrap tables properly
  markdown = markdown.replace(/(<tr>.*<\/tr>)+/g, "<table>$&</table>");

  // Handle paragraphs (text not already in HTML tags)
  // This is for text that's not already wrapped in tags
  const paragraphs = markdown.split("\n\n");
  markdown = paragraphs.map(p => {
    p = p.trim();
    if (p && !p.startsWith("<")) {
      return `<p>${p}</p>`;
    }
    return p;
  }).join("\n\n");

  // Restore code blocks
  codeBlocks.forEach((block, index) => {
    markdown = markdown.replace(`__CODE_BLOCK_${index}__`, block);
  });

  // Restore inline code
  inlineCode.forEach((code, index) => {
    markdown = markdown.replace(`__INLINE_CODE_${index}__`, code);
  });

  return markdown;
}

// Helper function to escape HTML in code blocks
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}