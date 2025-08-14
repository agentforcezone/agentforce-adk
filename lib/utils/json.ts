/**
 * JSON utility functions for AgentForce ADK
 * Provides parsing, formatting, and code block extraction for JSON data
 */

/**
 * Parse JSON string to JavaScript object
 * @param jsonString - The JSON string to parse
 * @returns Parsed JavaScript object
 * @throws Error if JSON is invalid
 */
export function parseJson(jsonString: string): any {
    try {
        return JSON.parse(jsonString);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to parse JSON: ${errorMessage}`);
    }
}

/**
 * Convert JavaScript object to JSON string
 * @param data - The data to convert to JSON
 * @param pretty - Whether to format with indentation
 * @returns JSON string representation
 * @throws Error if data cannot be converted to JSON
 */
export function stringifyJson(data: any, pretty: boolean = false): string {
    try {
        return JSON.stringify(data, null, pretty ? 2 : 0);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to stringify to JSON: ${errorMessage}`);
    }
}

/**
 * Validate if a string is valid JSON
 * @param jsonString - The JSON string to validate
 * @returns True if valid JSON, false otherwise
 */
export function isValidJson(jsonString: string): boolean {
    try {
        JSON.parse(jsonString);
        return true;
    } catch {
        return false;
    }
}

/**
 * Parse JSON string safely, returning null if invalid
 * @param jsonString - The JSON string to parse
 * @returns Parsed object or null if invalid
 */
export function safeParseJson(jsonString: string): any | null {
    try {
        return JSON.parse(jsonString);
    } catch {
        return null;
    }
}

/**
 * Convert agent response to JSON format with code block extraction
 * @param response - Agent response string
 * @param enableCodeBlockParsing - Whether to extract JSON from code blocks (default: true). Set to false to return whole response.
 * @returns JSON formatted string or original response
 */
export function formatResponseAsJson(response: string, enableCodeBlockParsing: boolean = true): string | object {
    // If code block parsing is enabled, try to extract JSON from code blocks first
    if (enableCodeBlockParsing) {
        const jsonBlock = extractJsonCodeBlock(response);
        if (jsonBlock) {
            // Return the extracted JSON block as-is
            return jsonBlock;
        }
    }

    // If code block parsing is disabled, return the whole response as-is
    if (!enableCodeBlockParsing) {
        return response.trim();
    }

    // If no JSON code block found, try to parse the entire response
    try {
        const parsedJson = parseJson(response);
        return stringifyJson(parsedJson, false);
    } catch {
        // If the response is not valid JSON, return it as-is
        return response.trim();
    }
}

/**
 * Extract JSON content from code blocks in the response
 * Looks for ```json ... ``` patterns (case-insensitive) and returns the content
 * Handles nested code blocks and merges multiple blocks into array format
 * @param response - The response text to search
 * @returns Extracted JSON content or null if not found
 */
function extractJsonCodeBlock(response: string): string | null {
    const jsonBlocks: string[] = [];
    
    // Extract all JSON blocks using proper nested parsing
    jsonBlocks.push(...extractNestedCodeBlocks(response, /```json\s*\n?/gi));
    
    // If no specific JSON blocks found, try generic blocks that look like JSON
    if (jsonBlocks.length === 0) {
        const genericBlocks = extractNestedCodeBlocks(response, /```\s*\n?/g);
        for (const block of genericBlocks) {
            if (isLikelyJson(block)) {
                jsonBlocks.push(block);
            }
        }
    }
    
    if (jsonBlocks.length === 0) {
        return null;
    }
    
    // If multiple blocks, merge into array format
    if (jsonBlocks.length > 1) {
        try {
            const parsedObjects = jsonBlocks.map(block => {
                try {
                    return JSON.parse(block);
                } catch {
                    return { "content": block }; // Wrap invalid JSON as content
                }
            });
            // Format with indentation for better readability
            return JSON.stringify(parsedObjects, null, 2);
        } catch {
            // If merging fails, try to format individual blocks
            try {
                const formattedBlocks = jsonBlocks.map(block => {
                    try {
                        const parsed = JSON.parse(block);
                        return JSON.stringify(parsed, null, 2);
                    } catch {
                        return block;
                    }
                });
                return "[\n" + formattedBlocks.map(b => "  " + b.split("\n").join("\n  ")).join(",\n") + "\n]";
            } catch {
                // Last resort: just join with commas
                return "[" + jsonBlocks.join(",") + "]";
            }
        }
    }
    
    // Single block - format it compactly
    if (jsonBlocks[0]) {
        try {
            const parsed = JSON.parse(jsonBlocks[0]);
            return JSON.stringify(parsed, null, 0);
        } catch {
            // If parsing fails, return as-is
            return jsonBlocks[0];
        }
    }
    
    return null;
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
 * Check if content looks like JSON format
 * Simple heuristic to detect JSON-like structure
 * @param content - Content to check
 * @returns True if content appears to be JSON
 */
function isLikelyJson(content: string): boolean {
    const trimmed = content.trim();
    // JSON objects start with { and end with }
    // JSON arrays start with [ and end with ]
    return (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
           (trimmed.startsWith("[") && trimmed.endsWith("]"));
}

/**
 * Validate agent response and convert to JSON if possible
 * @param response - Agent response string
 * @returns Object with validation result and converted JSON
 */
export function validateAndFormatJson(response: string): {
    isValid: boolean;
    json: string | object;
    error?: string;
} {
    try {
        const formattedJson = formatResponseAsJson(response, false);
        return {
            isValid: true,
            json: formattedJson,
        };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
            isValid: false,
            json: response.trim(),
            error: errorMessage,
        };
    }
}