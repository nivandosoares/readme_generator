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
  repoOwner?: string
  repoBranch?: string
}

export function ReadmeViewer({ readme, repoName, repoOwner = "", repoBranch = "main" }: ReadmeViewerProps) {
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

  // Process GitHub-style links if repo info is provided
  const processedReadme = repoOwner 
    ? processGitHubLinks(readme, repoOwner, repoName, repoBranch) 
    : readme

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
  return markdown
    // Handle image links that start with ./
    .replace(/!\[([^\]]+)\]\(\.\/(.*?)\)/g, 
      `![$1](https://github.com/${owner}/${repo}/raw/${branch}/$2)`)
    // Handle relative links to files
    .replace(/\[([^\]]+)\]\(\.\/(.*?)\)/g, 
      `[$1](https://github.com/${owner}/${repo}/blob/${branch}/$2)`)
    // Keep anchor links as-is
    .replace(/\[([^\]]+)\]\(#(.*?)\)/g, `[$1](#$2)`);
}

// Simplified and more robust markdown to HTML converter
function markdownToHtml(markdown: string): string {
  // Step 1: Extract and store code blocks to protect them from processing
  const codeBlocks: string[] = [];
  markdown = markdown.replace(/```([a-z]*)\n([\s\S]*?)```/g, (match, language, code) => {
    const index = codeBlocks.length;
    const langClass = language ? ` class="language-${language}"` : '';
    codeBlocks.push(`<pre><code${langClass}>${escapeHtml(code.trim())}</code></pre>`);
    return `__CODE_BLOCK_${index}__`;
  });

  // Step 2: Extract and store inline code
  const inlineCodes: string[] = [];
  markdown = markdown.replace(/`([^`]+)`/g, (match, code) => {
    const index = inlineCodes.length;
    inlineCodes.push(`<code>${escapeHtml(code)}</code>`);
    return `__INLINE_CODE_${index}__`;
  });

  // Step 3: Process headers
  markdown = markdown
    .replace(/^# (.*$)/gm, "<h1>$1</h1>")
    .replace(/^## (.*$)/gm, "<h2>$1</h2>")
    .replace(/^### (.*$)/gm, "<h3>$1</h3>")
    .replace(/^#### (.*$)/gm, "<h4>$1</h4>")
    .replace(/^##### (.*$)/gm, "<h5>$1</h5>")
    .replace(/^###### (.*$)/gm, "<h6>$1</h6>");

  // Step 4: Process text formatting
  markdown = markdown
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/__(.*?)__/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/_(.*?)_/g, "<em>$1</em>");

  // Step 5: Handle badges (shields.io images) with special class
  markdown = markdown.replace(
    /!\[([^\]]*)\]\((https:\/\/img\.shields\.io\/[^)]+)\)/g,
    '<img src="$2" alt="$1" class="inline-badge" />'
  );

  // Step 6: Handle other images
  markdown = markdown.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />');

  // Step 7: Handle links
  markdown = markdown.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
  );

  // Step 8: Handle horizontal rules
  markdown = markdown.replace(/^(-{3,}|_{3,}|\*{3,})$/gm, "<hr>");

  // Step 9: Handle lists in a safer way
  // First, identify list blocks
  const listBlocks: string[] = [];
  markdown = markdown.replace(
    /(?:^|\n)((?:[ \t]*(?:[-*+]|\d+\.)[ \t]+.+\n)+)/g,
    (match, listContent) => {
      const index = listBlocks.length;
      listBlocks.push(listContent);
      return `\n__LIST_BLOCK_${index}__\n`;
    }
  );

  // Process each list block
  listBlocks.forEach((block, index) => {
    const lines = block.split("\n").filter(line => line.trim());
    const isOrdered = /^\s*\d+\./.test(lines[0]);
    
    const listItems = lines.map(line => {
      // Extract the content after list marker
      const content = line.replace(/^\s*(?:[-*+]|\d+\.)[ \t]+/, "");
      return `<li>${content}</li>`;
    }).join("");
    
    const listType = isOrdered ? "ol" : "ul";
    listBlocks[index] = `<${listType}>${listItems}</${listType}>`;
  });

  // Replace list blocks back
  listBlocks.forEach((html, index) => {
    markdown = markdown.replace(`__LIST_BLOCK_${index}__`, html);
  });

  // Step 10: Handle blockquotes
  markdown = markdown.replace(/^>[ \t]?(.*$)/gm, "<blockquote>$1</blockquote>");
  markdown = markdown.replace(/<\/blockquote>\s*<blockquote>/g, "<br>");

  // Step 11: Process tables in a safer way
  // Identify table blocks
  const tableBlocks: string[] = [];
  markdown = markdown.replace(
    /(?:^\|.+\|\n)+(?:\|[ :-]+\|\n)(?:\|.+\|\n)+/gm,
    (tableContent) => {
      const index = tableBlocks.length;
      tableBlocks.push(tableContent);
      return `__TABLE_BLOCK_${index}__`;
    }
  );

  // Process each table block
  tableBlocks.forEach((block, index) => {
    const rows = block.trim().split("\n");
    let tableHTML = "<table>";
    
    // Check if there's a header row
    if (rows.length >= 2 && rows[1].includes("|-")) {
      // Add header row
      tableHTML += "<thead><tr>";
      rows[0].split("|").filter(cell => cell.trim() !== "").forEach(cell => {
        tableHTML += `<th>${cell.trim()}</th>`;
      });
      tableHTML += "</tr></thead>";
      
      // Add body rows (skip header and separator rows)
      tableHTML += "<tbody>";
      for (let i = 2; i < rows.length; i++) {
        tableHTML += "<tr>";
        rows[i].split("|").filter(cell => cell.trim() !== "").forEach(cell => {
          tableHTML += `<td>${cell.trim()}</td>`;
        });
        tableHTML += "</tr>";
      }
      tableHTML += "</tbody>";
    } else {
      // No header row, treat all rows as body
      tableHTML += "<tbody>";
      rows.forEach(row => {
        tableHTML += "<tr>";
        row.split("|").filter(cell => cell.trim() !== "").forEach(cell => {
          tableHTML += `<td>${cell.trim()}</td>`;
        });
        tableHTML += "</tr>";
      });
      tableHTML += "</tbody>";
    }
    
    tableHTML += "</table>";
    tableBlocks[index] = tableHTML;
  });

  // Replace table blocks back
  tableBlocks.forEach((html, index) => {
    markdown = markdown.replace(`__TABLE_BLOCK_${index}__`, html);
  });

  // Step 12: Handle paragraphs
  // Split by double newlines and process each chunk
  const chunks = markdown.split(/\n\n+/);
  markdown = chunks.map(chunk => {
    chunk = chunk.trim();
    if (chunk && !chunk.startsWith("<")) {
      return `<p>${chunk}</p>`;
    }
    return chunk;
  }).join("\n\n");

  // Step 13: Restore code blocks and inline code
  codeBlocks.forEach((html, index) => {
    markdown = markdown.replace(`__CODE_BLOCK_${index}__`, html);
  });
  
  inlineCodes.forEach((html, index) => {
    markdown = markdown.replace(`__INLINE_CODE_${index}__`, html);
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