function markdownToHtml(markdown: string): string {
  // Store code blocks and inline code to prevent processing their contents
  const codeBlocks: string[] = [];
  const inlineCodes: string[] = [];
  
  // Step 1: Extract code blocks with language specification
  markdown = markdown.replace(/```([a-z]*)\n([\s\S]*?)```/g, (match, language, code) => {
    const index = codeBlocks.length;
    const langClass = language ? ` class="language-${language}"` : '';
    codeBlocks.push(`<pre><code${langClass}>${escapeHtml(code.trim())}</code></pre>`);
    return `{{CODE_BLOCK_${index}}}`;  // Use a different placeholder format
  });

  // Step 2: Extract inline code
  markdown = markdown.replace(/`([^`]+)`/g, (match, code) => {
    const index = inlineCodes.length;
    inlineCodes.push(`<code>${escapeHtml(code)}</code>`);
    return `{{INLINE_CODE_${index}}}`;  // Use a different placeholder format
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

  // Step 5: Handle badges with special styling
  markdown = markdown.replace(
    /!\[([^\]]*)\]\((https:\/\/img\.shields\.io\/[^)]+)\)/g,
    '<img src="$2" alt="$1" class="inline-badge" style="display:inline-block;vertical-align:middle;margin:0 4px 0 0;" />'
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

  // Step 9: Handle lists
  // Convert list items first
  markdown = markdown.replace(/^\s*[-*+]\s+(.*$)/gm, "<li>$1</li>");
  markdown = markdown.replace(/^\s*\d+\.\s+(.*$)/gm, "<li>$1</li>");
  
  // Process lists by identifying consecutive list items
  let lines = markdown.split("\n");
  let result = [];
  let inList = false;
  let listItems = [];
  let isOrdered = false;
  
  lines.forEach((line, i) => {
    if (line.startsWith("<li>")) {
      if (!inList) {
        inList = true;
        isOrdered = i > 0 && /^\s*\d+\./.test(lines[i-1]);
        listItems = [];
      }
      listItems.push(line);
    } else {
      if (inList) {
        const listType = isOrdered ? "ol" : "ul";
        result.push(`<${listType}>${listItems.join("")}</${listType}>`);
        inList = false;
      }
      result.push(line);
    }
  });
  
  // Handle trailing list
  if (inList) {
    const listType = isOrdered ? "ol" : "ul";
    result.push(`<${listType}>${listItems.join("")}</${listType}>`);
  }
  
  markdown = result.join("\n");

  // Step 10: Handle blockquotes
  markdown = markdown.replace(/^>\s(.*)$/gm, "<blockquote>$1</blockquote>");
  markdown = markdown.replace(/<\/blockquote>\n<blockquote>/g, "<br>");

  // Step 11: Process tables (simplified)
  // This regex identifies table rows
  let tableRows = markdown.match(/^\|(.+)\|$/gm);
  if (tableRows) {
    let tableHtml = "<table>";
    let isHeader = true;
    let headerProcessed = false;
    
    for (let i = 0; i < tableRows.length; i++) {
      const row = tableRows[i];
      
      // Skip separator row
      if (row.match(/^\|\s*[-:]+\s*\|/)) {
        headerProcessed = true;
        continue;
      }
      
      // Process cells
      const cells = row.split("|").filter(cell => cell !== "").map(cell => cell.trim());
      
      if (isHeader && !headerProcessed) {
        tableHtml += "<thead><tr>";
        cells.forEach(cell => {
          tableHtml += `<th>${cell}</th>`;
        });
        tableHtml += "</tr></thead><tbody>";
        isHeader = false;
      } else {
        tableHtml += "<tr>";
        cells.forEach(cell => {
          tableHtml += `<td>${cell}</td>`;
        });
        tableHtml += "</tr>";
      }
    }
    
    tableHtml += "</tbody></table>";
    
    // Replace table in markdown
    markdown = markdown.replace(/(\|.+\|\n)+/g, tableHtml);
  }

  // Step 12: Handle paragraphs (text not already in HTML)
  const paragraphs = markdown.split(/\n\n+/);
  markdown = paragraphs.map(p => {
    p = p.trim();
    if (p && !p.startsWith("<")) {
      return `<p>${p}</p>`;
    }
    return p;
  }).join("\n\n");

  // Step 13: Restore code blocks and inline code with the correct placeholders
  for (let i = 0; i < codeBlocks.length; i++) {
    markdown = markdown.replace(`{{CODE_BLOCK_${i}}}`, codeBlocks[i]);
  }
  
  for (let i = 0; i < inlineCodes.length; i++) {
    markdown = markdown.replace(`{{INLINE_CODE_${i}}}`, inlineCodes[i]);
  }

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