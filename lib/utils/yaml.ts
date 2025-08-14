/**
 * YAML utility functions for AgentForce ADK
 * Provides parsing, stringifying, and validation capabilities for YAML data
 */

import * as YAML from "yaml";

/**
 * Parse YAML string to JavaScript object
 * @param yamlString - The YAML string to parse
 * @returns Parsed JavaScript object
 * @throws Error if YAML is invalid
 */
export function parseYaml(yamlString: string): any {
    try {
        return YAML.parse(yamlString);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to parse YAML: ${errorMessage}`);
    }
}

/**
 * Convert JavaScript object to YAML string
 * @param data - The data to convert to YAML
 * @param options - Optional YAML dump options
 * @returns YAML string representation
 * @throws Error if data cannot be converted to YAML
 */
export function stringifyYaml(data: any, options?: YAML.ToStringOptions): string {
    try {
        return YAML.stringify(data, {
            indent: 2,
            lineWidth: 0,
            ...options,
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to stringify to YAML: ${errorMessage}`);
    }
}

/**
 * Validate if a string is valid YAML
 * @param yamlString - The YAML string to validate
 * @returns True if valid YAML, false otherwise
 */
export function isValidYaml(yamlString: string): boolean {
    try {
        YAML.parse(yamlString);
        return true;
    } catch {
        return false;
    }
}

/**
 * Parse YAML string safely, returning null if invalid
 * @param yamlString - The YAML string to parse
 * @returns Parsed object or null if invalid
 */
export function safeParseYaml(yamlString: string): any | null {
    try {
        return YAML.parse(yamlString);
    } catch {
        return null;
    }
}

/**
 * Convert agent response to valid YAML format
 * @param response - Agent response string
 * @param enableCodeBlockParsing - Whether to extract YAML from code blocks (default: true). Set to false to return whole response.
 * @returns YAML formatted string
 */
export function formatResponseAsYaml(response: string, enableCodeBlockParsing: boolean = true): string {
    // If code block parsing is enabled, try to extract YAML from code blocks first
    if (enableCodeBlockParsing) {
        const yamlBlock = extractYamlCodeBlock(response);
        if (yamlBlock) {
            // Return the extracted YAML block as-is
            return yamlBlock;
        }
    }

    // If code block parsing is disabled, return the whole response as-is
    if (!enableCodeBlockParsing) {
        return response.trim();
    }

    try {
        // Try to parse as JSON first
        const jsonData = JSON.parse(response);
        return stringifyYaml(jsonData);
    } catch {
        // If not JSON, try to parse as existing YAML
        try {
            const yamlData = parseYaml(response);
            return stringifyYaml(yamlData);
        } catch {
            // If neither JSON nor YAML, return the response as-is
            return response.trim();
        }
    }
}


/**
 * Extract YAML content from code blocks in the response
 * Looks for ```yaml ... ``` patterns (case-insensitive) and returns the content
 * Handles nested code blocks and merges multiple blocks into array format
 * @param response - The response text to search
 * @returns Extracted YAML content or null if not found
 */
function extractYamlCodeBlock(response: string): string | null {
    const yamlBlocks: string[] = [];
    
    // Extract all YAML blocks using proper nested parsing
    yamlBlocks.push(...extractNestedCodeBlocks(response, /```yaml\s*\n?/gi));
    
    // If no specific YAML blocks found, try generic blocks that look like YAML
    if (yamlBlocks.length === 0) {
        const genericBlocks = extractNestedCodeBlocks(response, /```\s*\n?/g);
        for (const block of genericBlocks) {
            if (isLikelyYaml(block)) {
                yamlBlocks.push(block);
            }
        }
    }
    
    if (yamlBlocks.length === 0) {
        return null;
    }
    
    // If multiple blocks, merge into array format with - prefix
    if (yamlBlocks.length > 1) {
        const mergedBlocks = yamlBlocks.map((block, _index) => {
            // Add array item prefix for each block
            const lines = block.split("\n");
            const prefixedLines = lines.map((line, lineIndex) => {
                if (lineIndex === 0) {
                    return `- ${line}`; // First line gets the array prefix
                } else {
                    return `  ${line}`; // Subsequent lines get indentation
                }
            });
            return prefixedLines.join("\n");
        });
        return mergedBlocks.join("\n");
    }
    
    return yamlBlocks[0] || null;
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
 * Check if content looks like YAML format
 * Simple heuristic to detect YAML-like structure
 * @param content - Content to check
 * @returns True if content appears to be YAML
 */
function isLikelyYaml(content: string): boolean {
    // Look for YAML patterns: key: value, arrays with -, etc.
    const yamlPatterns = [
        /^\s*[\w\-]+\s*:\s*.+$/m,  // key: value
        /^\s*-\s+.+$/m,            // - item (array)
        /^\s*[\w\-]+\s*:\s*$/m,    // key: (with nested content)
    ];
    
    return yamlPatterns.some(pattern => pattern.test(content));
}


/**
 * Validate agent response and convert to YAML if possible
 * @param response - Agent response string
 * @returns Object with validation result and converted YAML
 */
export function validateAndFormatYaml(response: string): {
    isValid: boolean;
    yaml: string;
    error?: string;
} {
    try {
        const formattedYaml = formatResponseAsYaml(response);
        return {
            isValid: true,
            yaml: formattedYaml,
        };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
            isValid: false,
            yaml: stringifyYaml({ response: response.trim() }),
            error: errorMessage,
        };
    }
}