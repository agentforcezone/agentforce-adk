import type { ToolImplementation } from "../../types";
import { formatResponseAsJson } from "../../utils/json";
import { formatResponseAsMarkdown } from "../../utils/markdown";
import { formatResponseAsYaml } from "../../utils/yaml";
import { formatResponseAsHtml, type HtmlFilterConfig } from "../../utils/html";

/**
 * Content filter tool
 * Extracts JSON, Markdown, YAML, or HTML content from agent responses using code block parsing
 */
export const filter_content: ToolImplementation = {
    definition: {
        type: "function",
        function: {
            name: "filter_content",
            description: "Extract JSON, Markdown, YAML, or HTML content from text using code block parsing. Filters code blocks like ```json, ```yaml, ```markdown, ```html and returns only the extracted content. For HTML, can also filter specific elements like body, div, links, etc.",
            parameters: {
                type: "object",
                properties: {
                    content: {
                        type: "string",
                        description: "The text content to filter and extract from",
                    },
                    format: {
                        type: "string",
                        description: "The format to extract (json, yaml, markdown, md, html)",
                        enum: ["json", "yaml", "markdown", "md", "html"],
                    },
                    enable_code_block_parsing: {
                        type: "boolean",
                        description: "Whether to extract content from code blocks (default: true). Set to false to return whole content.",
                        default: true,
                    },
                    html_elements: {
                        type: "string",
                        description: "For HTML format: Comma-separated list of HTML elements to extract (e.g., 'body,div,links'). Special elements: 'links' for <a> tags, 'styles' for <style> tags.",
                    },
                    html_text_only: {
                        type: "boolean",
                        description: "For HTML format: Extract only text content without HTML tags.",
                        default: false,
                    },
                    html_include_attributes: {
                        type: "boolean",
                        description: "For HTML format: Include HTML attributes in the extracted content.",
                        default: false,
                    },
                    html_selector: {
                        type: "string",
                        description: "For HTML format: Custom CSS selector for more precise element selection.",
                    },
                    html_remove_elements: {
                        type: "string",
                        description: "For HTML format: Comma-separated list of elements to remove before processing (e.g., 'script,style').",
                    },
                },
                required: ["content", "format"],
            },
        },
    },
    execute: async (args: Record<string, any>) => {
        const content = args.content;
        const format = args.format;
        const enableCodeBlockParsing = args.enable_code_block_parsing !== false; // Default to true

        try {
            // Validate input
            if (!content || typeof content !== "string") {
                return {
                    success: false,
                    error: "Content must be a non-empty string",
                    format: format,
                };
            }

            if (!format || typeof format !== "string") {
                return {
                    success: false,
                    error: "Format must be specified (json, yaml, markdown, md, html)",
                    format: format,
                };
            }

            let extractedContent: string | object;
            let actualFormat = format.toLowerCase();

            // Normalize markdown format
            if (actualFormat === "md") {
                actualFormat = "markdown";
            }

            // Extract content based on format
            switch (actualFormat) {
                case "json":
                    extractedContent = formatResponseAsJson(content, enableCodeBlockParsing);
                    break;
                    
                case "yaml":
                    extractedContent = formatResponseAsYaml(content, enableCodeBlockParsing);
                    break;
                    
                case "markdown":
                    extractedContent = formatResponseAsMarkdown(content, enableCodeBlockParsing);
                    break;
                    
                case "html":
                    // Build HTML filter configuration from parameters
                    const htmlConfig: HtmlFilterConfig = {
                        elements: args.html_elements,
                        textOnly: args.html_text_only || false,
                        includeAttributes: args.html_include_attributes || false,
                        selector: args.html_selector,
                        removeElements: args.html_remove_elements ? args.html_remove_elements.split(",").map((s: string) => s.trim()) : undefined,
                    };
                    extractedContent = formatResponseAsHtml(content, htmlConfig, enableCodeBlockParsing);
                    break;
                    
                default:
                    return {
                        success: false,
                        error: `Unsupported format: ${format}. Supported formats: json, yaml, markdown, md, html`,
                        format: format,
                    };
            }

            // Determine if content was extracted from code blocks
            const wasExtracted = enableCodeBlockParsing && extractedContent !== content.trim();

            return {
                success: true,
                format: actualFormat,
                original_length: content.length,
                extracted_length: typeof extractedContent === "string" ? extractedContent.length : JSON.stringify(extractedContent).length,
                was_extracted: wasExtracted,
                code_block_parsing_enabled: enableCodeBlockParsing,
                content: extractedContent,
            };

        } catch (error: any) {
            return {
                success: false,
                error: `Failed to filter content: ${error.message}`,
                format: format,
                content: content,
            };
        }
    },
};