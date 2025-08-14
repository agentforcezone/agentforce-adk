/**
 * Markdown utility functions for AgentForce ADK
 * Provides parsing and code block extraction for Markdown data
 */

/**
 * Convert agent response to Markdown format with code block extraction
 * @param response - Agent response string
 * @param enableCodeBlockParsing - Whether to extract Markdown from code blocks (default: true). Set to false to return whole response.
 * @returns Markdown formatted string or original response
 */
export function formatResponseAsMarkdown(response: string, enableCodeBlockParsing: boolean = true): string {
    // If code block parsing is disabled, return the whole response as-is
    if (!enableCodeBlockParsing) {
        return response.trim();
    }

    // Try to extract markdown blocks first
    const markdownBlock = extractMarkdownCodeBlock(response);
    
    // If we found markdown blocks, return the extracted content
    if (markdownBlock) {
        return markdownBlock;
    }

    // If no markdown blocks found, return the response as-is (it might already be markdown)
    return response.trim();
}

/**
 * Extract Markdown content from code blocks in the response
 * Looks for ```markdown, ```md, ```MD, ```Markdown, ```MARKDOWN patterns (case-insensitive) and returns the content
 * Handles nested code blocks and merges multiple blocks with --- separator
 * @param response - The response text to search
 * @returns Extracted Markdown content or null if not found
 */
function extractMarkdownCodeBlock(response: string): string | null {
    const markdownBlocks: string[] = [];
    
    // Extract all markdown blocks using proper nested parsing that handles inner code blocks
    const blocks = extractMarkdownBlocksWithNesting(response);
    markdownBlocks.push(...blocks);
    
    if (markdownBlocks.length === 0) {
        return null;
    }
    
    // If multiple blocks, merge with --- separator
    if (markdownBlocks.length > 1) {
        return markdownBlocks.join("\n\n---\n\n");
    }
    
    return markdownBlocks[0] || null;
}

/**
 * Extract markdown blocks while properly handling nested code blocks
 * @param text - Text to extract from
 * @returns Array of extracted markdown block contents
 */
function extractMarkdownBlocksWithNesting(text: string): string[] {
    const blocks: string[] = [];
    const lines = text.split("\n");
    let i = 0;
    
    while (i < lines.length) {
        const line = lines[i] || "";
        
        // Check for markdown code block start (case-insensitive)
        if (/^```(?:markdown|md|Markdown|MARKDOWN)\s*$/i.test(line)) {
            // Found start of markdown block
            let blockContent: string[] = [];
            let nestedDepth = 0;
            i++; // Move past the opening ```markdown
            
            // Process lines until we find the matching closing ```
            while (i < lines.length) {
                const currentLine = lines[i] || "";
                
                // Check for nested code block start (any language)
                if (/^\s*```\w*/.test(currentLine) && !/^\s*```\s*$/.test(currentLine)) {
                    nestedDepth++;
                    blockContent.push(currentLine);
                } 
                // Check for code block end
                else if (/^\s*```\s*$/.test(currentLine)) {
                    if (nestedDepth > 0) {
                        // This closes a nested block
                        nestedDepth--;
                        blockContent.push(currentLine);
                    } else {
                        // This closes our markdown block
                        const content = blockContent.join("\n").trim();
                        if (content) {
                            blocks.push(content);
                        }
                        break;
                    }
                } else {
                    blockContent.push(currentLine);
                }
                
                i++;
            }
        }
        i++;
    }
    
    return blocks;
}

/**
 * Check if content looks like Markdown format
 * Simple heuristic to detect Markdown-like structure
 * @param content - Content to check
 * @returns True if content appears to be Markdown
 */
function isLikelyMarkdown(content: string): boolean {
    // Look for common Markdown patterns
    const markdownPatterns = [
        /^#{1,6}\s+.+$/m,        // Headers (# ## ### etc.)
        /^\*\s+.+$/m,            // Unordered list with *
        /^-\s+.+$/m,             // Unordered list with -
        /^\d+\.\s+.+$/m,         // Ordered list (1. 2. etc.)
        /\[.+\]\(.+\)/,          // Links [text](url)
        /\*\*.+\*\*/,            // Bold **text**
        /\*.+\*/,                // Italic *text*
        /`.+`/,                  // Inline code `code` (fixed pattern)
        /^>.+$/m,                // Blockquotes
        /^\|.+\|$/m,             // Tables
        /^---+$/m,               // Horizontal rules
        /```[\s\S]*?```/,        // Code blocks
    ];
    
    // If it contains at least 1 markdown pattern OR looks like structured text, it's likely markdown
    const matchCount = markdownPatterns.filter(pattern => pattern.test(content)).length;
    
    // More lenient detection - accept if:
    // 1. Has any markdown patterns, OR
    // 2. Has multiple lines with structured content, OR
    // 3. Contains headers (very strong indicator)
    const hasHeaders = /^#{1,6}\s+.+$/m.test(content);
    const hasMultipleLines = content.split("\n").length > 2;
    const hasStructuredContent = /^[\*\-\+]\s+.+$/m.test(content) || /^\d+\.\s+.+$/m.test(content);
    
    return matchCount >= 1 || hasHeaders || (hasMultipleLines && hasStructuredContent);
}

/**
 * Validate if a string contains valid Markdown
 * Simple check for basic Markdown syntax
 * @param markdownString - The Markdown string to validate
 * @returns True if appears to be valid Markdown
 */
export function isValidMarkdown(markdownString: string): boolean {
    // Markdown is more forgiving than JSON/YAML, so we'll do basic checks
    const trimmed = markdownString.trim();
    
    // Empty string is not valid
    if (!trimmed) {
        return false;
    }
    
    // Check for basic markdown patterns or treat as valid text
    return isLikelyMarkdown(trimmed) || trimmed.length > 0;
}

/**
 * Parse Markdown content safely, returning the content or null if invalid
 * @param markdownString - The Markdown string to parse
 * @returns Markdown content or null if invalid
 */
export function safeParseMarkdown(markdownString: string): string | null {
    try {
        const trimmed = markdownString.trim();
        return isValidMarkdown(trimmed) ? trimmed : null;
    } catch {
        return null;
    }
}

/**
 * Validate agent response and convert to Markdown if possible
 * @param response - Agent response string
 * @returns Object with validation result and Markdown content
 */
export function validateAndFormatMarkdown(response: string): {
    isValid: boolean;
    markdown: string;
    error?: string;
} {
    try {
        const formattedMarkdown = formatResponseAsMarkdown(response, true);
        return {
            isValid: true,
            markdown: formattedMarkdown,
        };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
            isValid: false,
            markdown: response.trim(),
            error: errorMessage,
        };
    }
}