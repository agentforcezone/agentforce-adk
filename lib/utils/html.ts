/**
 * HTML utility functions for AgentForce ADK
 * Provides parsing and element extraction for HTML content using Cheerio
 */

import * as cheerio from "cheerio";

/**
 * HTML element types that can be filtered
 */
export type HtmlElementType = 
    | "body" 
    | "section" 
    | "div" 
    | "links" 
    | "header" 
    | "styles" 
    | "p" 
    | "h1" 
    | "h2" 
    | "h3" 
    | "h4" 
    | "h5" 
    | "h6" 
    | "article" 
    | "nav" 
    | "footer" 
    | "main" 
    | "aside"
    | "span"
    | "img"
    | "ul"
    | "ol"
    | "li"
    | "table"
    | "tr"
    | "td"
    | "th";

/**
 * Configuration for HTML filtering
 */
export interface HtmlFilterConfig {
    /** HTML elements to extract (comma-separated string or array) */
    elements?: string | string[];
    /** Whether to include element attributes */
    includeAttributes?: boolean;
    /** Whether to extract only text content */
    textOnly?: boolean;
    /** Custom CSS selector */
    selector?: string;
    /** Remove specific elements before processing */
    removeElements?: string[];
}

/**
 * Parse HTML content safely, returning null if invalid
 * @param htmlString - The HTML string to parse
 * @returns Cheerio instance or null if invalid
 */
export function safeParseHtml(htmlString: string): cheerio.CheerioAPI | null {
    try {
        const trimmed = htmlString.trim();
        if (!trimmed) return null;
        return cheerio.load(trimmed);
    } catch {
        return null;
    }
}

/**
 * Extract specific HTML elements from content
 * @param htmlContent - HTML content to process
 * @param config - Filter configuration
 * @returns Extracted content
 */
export function extractHtmlElements(htmlContent: string, config: HtmlFilterConfig = {}): string {
    try {
        const $ = cheerio.load(htmlContent);
        
        // Remove unwanted elements first
        if (config.removeElements && config.removeElements.length > 0) {
            config.removeElements.forEach(element => {
                $(element).remove();
            });
        }

        let selector = config.selector;
        
        // Build selector from elements if not provided
        if (!selector && config.elements) {
            const elements = Array.isArray(config.elements) 
                ? config.elements 
                : config.elements.split(",").map(s => s.trim());
            
            // Map special element types to CSS selectors
            const mappedElements = elements.map(element => {
                switch (element.toLowerCase()) {
                    case "links":
                        return "a";
                    case "styles":
                        return "style";
                    default:
                        return element;
                }
            });
            
            selector = mappedElements.join(", ");
        }

        // Default to body if no selector specified
        if (!selector) {
            selector = "body";
        }

        const results: string[] = [];
        
        $(selector).each((_, element) => {
            const $element = $(element);
            
            if (config.textOnly) {
                const text = $element.text().trim();
                if (text) {
                    results.push(text);
                }
            } else if (config.includeAttributes) {
                // Include the full element with attributes
                results.push($.html($element) || "");
            } else {
                // Include element with content but minimal attributes
                const tagName = (element as any).tagName || (element as any).name;
                const content = $element.html() || "";
                if (content.trim()) {
                    results.push(`<${tagName}>${content}</${tagName}>`);
                } else {
                    const text = $element.text().trim();
                    if (text) {
                        results.push(`<${tagName}>${text}</${tagName}>`);
                    }
                }
            }
        });

        return results.join("\n\n");
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to extract HTML elements: ${errorMessage}`);
    }
}

/**
 * Convert agent response to HTML format with element extraction
 * @param response - Agent response string  
 * @param config - HTML filter configuration
 * @param enableCodeBlockParsing - Whether to extract HTML from code blocks (default: true)
 * @returns Extracted HTML content
 */
export function formatResponseAsHtml(
    response: string, 
    config: HtmlFilterConfig = {}, 
    enableCodeBlockParsing: boolean = true,
): string {
    // If code block parsing is disabled, process the whole response
    if (!enableCodeBlockParsing) {
        return extractHtmlElements(response, config);
    }

    // Try to extract HTML blocks first
    const htmlBlocks = extractHtmlCodeBlocks(response);
    
    if (htmlBlocks.length > 0) {
        // Process extracted HTML blocks
        const processedBlocks = htmlBlocks.map(block => 
            extractHtmlElements(block, config),
        ).filter(block => block.trim());
        
        if (processedBlocks.length > 0) {
            return processedBlocks.join("\n\n---\n\n");
        }
    }

    // If no HTML blocks found, try to process the entire response as HTML
    if (isLikelyHtml(response)) {
        return extractHtmlElements(response, config);
    }

    // If not HTML-like, return as-is
    return response.trim();
}

/**
 * Extract HTML content from code blocks in the response
 * Looks for ```html ... ``` patterns and returns the content
 * @param response - The response text to search
 * @returns Array of extracted HTML block contents
 */
function extractHtmlCodeBlocks(response: string): string[] {
    const htmlBlocks: string[] = [];
    
    // Extract all HTML blocks using proper nested parsing
    htmlBlocks.push(...extractNestedCodeBlocks(response, /```html\s*\n?/gi));
    
    // If no specific HTML blocks found, try generic blocks that look like HTML
    if (htmlBlocks.length === 0) {
        const genericBlocks = extractNestedCodeBlocks(response, /```\s*\n?/g);
        for (const block of genericBlocks) {
            if (isLikelyHtml(block)) {
                htmlBlocks.push(block);
            }
        }
    }
    
    return htmlBlocks;
}

/**
 * Extract code blocks handling nested backticks properly
 * @param text - Text to search in
 * @param startPattern - Regex pattern for the opening code block
 * @returns Array of extracted code block contents
 */
function extractNestedCodeBlocks(text: string, startPattern: RegExp): string[] {
    const blocks: string[] = [];
    const lines = text.split("\n");
    let i = 0;
    
    while (i < lines.length) {
        const line = lines[i];
        if (!line) {
            i++;
            continue;
        }
        const match = line.match(startPattern);
        
        if (match) {
            // Found start of code block, now find the end
            let blockContent: string[] = [];
            i++; // Move past the opening ```
            
            // Look for closing ``` that's not inside another code block
            while (i < lines.length) {
                const currentLine = lines[i] || "";
                
                // Check if this is a closing ``` (3 or more backticks with optional leading whitespace)
                if (/^\s*```\s*$/.test(currentLine)) {
                    // Found closing block
                    const content = blockContent.join("\n").trim();
                    if (content) {
                        blocks.push(content);
                    }
                    break;
                }
                
                blockContent.push(currentLine);
                i++;
            }
        }
        i++;
    }
    
    return blocks;
}

/**
 * Check if content looks like HTML format
 * Simple heuristic to detect HTML-like structure
 * @param content - Content to check
 * @returns True if content appears to be HTML
 */
function isLikelyHtml(content: string): boolean {
    const trimmed = content.trim();
    
    // HTML patterns to look for
    const htmlPatterns = [
        /<html[^>]*>/i,          // HTML tag
        /<head[^>]*>/i,          // Head tag
        /<body[^>]*>/i,          // Body tag
        /<div[^>]*>/i,           // Div tag
        /<p[^>]*>/i,             // Paragraph tag
        /<h[1-6][^>]*>/i,        // Header tags
        /<a[^>]*>/i,             // Link tag
        /<img[^>]*>/i,           // Image tag
        /<section[^>]*>/i,       // Section tag
        /<article[^>]*>/i,       // Article tag
        /<nav[^>]*>/i,           // Nav tag
        /<header[^>]*>/i,        // Header tag
        /<footer[^>]*>/i,        // Footer tag
        /<style[^>]*>/i,         // Style tag
        /<script[^>]*>/i,        // Script tag
    ];
    
    // Check for DOCTYPE
    if (/<!DOCTYPE\s+html/i.test(trimmed)) {
        return true;
    }
    
    // Check for HTML patterns
    const matchCount = htmlPatterns.filter(pattern => pattern.test(trimmed)).length;
    
    // If it has 2 or more HTML patterns, it's likely HTML
    return matchCount >= 2;
}

/**
 * Validate if a string contains valid HTML
 * @param htmlString - The HTML string to validate
 * @returns True if appears to be valid HTML
 */
export function isValidHtml(htmlString: string): boolean {
    try {
        const $ = safeParseHtml(htmlString);
        return $ !== null;
    } catch {
        return false;
    }
}

/**
 * Get text content from HTML elements
 * @param htmlString - HTML content
 * @param selector - CSS selector (optional)
 * @returns Extracted text content
 */
export function extractTextFromHtml(htmlString: string, selector?: string): string {
    try {
        const $ = cheerio.load(htmlString);
        const target = selector ? $(selector) : $.root();
        return target.text().trim();
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to extract text from HTML: ${errorMessage}`);
    }
}

/**
 * Get all links from HTML content
 * @param htmlString - HTML content
 * @returns Array of link objects with href and text
 */
export function extractLinksFromHtml(htmlString: string): Array<{href: string; text: string}> {
    try {
        const $ = cheerio.load(htmlString);
        const links: Array<{href: string; text: string}> = [];
        
        $("a[href]").each((_, element) => {
            const $link = $(element);
            const href = $link.attr("href") || "";
            const text = $link.text().trim();
            if (href) {
                links.push({ href, text });
            }
        });
        
        return links;
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to extract links from HTML: ${errorMessage}`);
    }
}

/**
 * Validate agent response and convert to HTML if possible
 * @param response - Agent response string
 * @param config - HTML filter configuration
 * @returns Object with validation result and HTML content
 */
export function validateAndFormatHtml(
    response: string, 
    config: HtmlFilterConfig = {},
): {
    isValid: boolean;
    html: string;
    error?: string;
} {
    try {
        const formattedHtml = formatResponseAsHtml(response, config, true);
        return {
            isValid: true,
            html: formattedHtml,
        };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
            isValid: false,
            html: response.trim(),
            error: errorMessage,
        };
    }
}