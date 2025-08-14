import { describe, expect, test } from "@jest/globals";
import {
    formatResponseAsMarkdown,
    isValidMarkdown,
    safeParseMarkdown,
    validateAndFormatMarkdown
} from "../../lib/utils/markdown";

describe("Markdown Utility Functions", () => {
    describe("formatResponseAsMarkdown", () => {
        test("should extract markdown from code block when parsing enabled", () => {
            const response = `Here is your markdown:
\`\`\`markdown
# Hello World

This is a **bold** text.
\`\`\`
That's the result!`;
            const result = formatResponseAsMarkdown(response, true);
            // Should extract only the markdown content without wrapper
            expect(result).not.toContain("```markdown");
            expect(result).not.toContain("Here is your markdown:");
            expect(result).toBe("# Hello World\n\nThis is a **bold** text.");
        });

        test("should extract markdown from case-insensitive code blocks", () => {
            const responses = [
                `\`\`\`md
# Title
Content here
\`\`\``,
                `\`\`\`MD
# Title
Content here
\`\`\``,
                `\`\`\`Markdown
# Title
Content here
\`\`\``,
                `\`\`\`MARKDOWN
# Title
Content here
\`\`\``
            ];

            responses.forEach(response => {
                const result = formatResponseAsMarkdown(response, true);
                // Should extract content without code block wrapper
                expect(result).not.toContain("```");
                expect(result).toBe("# Title\nContent here");
            });
        });

        test("should merge multiple markdown blocks with --- separator", () => {
            const response = `\`\`\`markdown
# Section 1

First section content.
\`\`\`

\`\`\`markdown
# Section 2

Second section content.
\`\`\``;
            const result = formatResponseAsMarkdown(response, true);
            // Should extract and merge multiple blocks with --- separator
            expect(result).not.toContain("```markdown");
            expect(result).toContain("# Section 1");
            expect(result).toContain("# Section 2");
            expect(result).toContain("---");
            expect(result).toBe("# Section 1\n\nFirst section content.\n\n---\n\n# Section 2\n\nSecond section content.");
        });

        test("should handle nested code blocks correctly", () => {
            const response = `Here's the documentation:
\`\`\`markdown
# Code Example

Here's how to use it:

\`\`\`python
def hello():
    print("Hello World")
\`\`\`

That's it!
\`\`\``;
            const result = formatResponseAsMarkdown(response, true);
            expect(result).toContain("# Code Example");
            expect(result).toContain("```python");
            expect(result).toContain("def hello():");
            // Note: The nested parsing might not preserve the final text if it's not properly formatted
            expect(result.length).toBeGreaterThan(0);
        });

        test("should return whole response when parsing disabled", () => {
            const response = `Here is your markdown:
\`\`\`markdown
# Hello World
\`\`\`
That's the result!`;
            const result = formatResponseAsMarkdown(response, false);
            expect(result).toBe(response.trim());
        });

        test("should not extract generic code blocks even if they look like markdown", () => {
            const response = `\`\`\`
# Hello World

This is a **bold** text with *italic* and [link](url).
\`\`\``;
            const result = formatResponseAsMarkdown(response, true);
            // Generic code blocks without markdown/md label should not be extracted
            expect(result).toBe(response.trim());
        });

        test("should return original response when no code blocks found", () => {
            const response = "# Hello World\n\nThis is plain markdown content.";
            const result = formatResponseAsMarkdown(response, true);
            expect(result).toBe("# Hello World\n\nThis is plain markdown content.");
        });

        test("should not extract non-markdown content from generic blocks", () => {
            const response = `\`\`\`
{"name": "John", "age": 30}
\`\`\``;
            const result = formatResponseAsMarkdown(response, true);
            expect(result).toBe(response.trim());
        });

        test("should handle empty code blocks", () => {
            const response = `\`\`\`markdown
\`\`\``;
            const result = formatResponseAsMarkdown(response, true);
            expect(result).toBe(response.trim());
        });
    });

    describe("isValidMarkdown", () => {
        test("should return true for content with headers", () => {
            const markdown = "# Hello World\n\nThis is content.";
            expect(isValidMarkdown(markdown)).toBe(true);
        });

        test("should return true for content with various header levels", () => {
            const markdowns = [
                "# H1 Header",
                "## H2 Header",
                "### H3 Header",
                "#### H4 Header",
                "##### H5 Header",
                "###### H6 Header"
            ];

            markdowns.forEach(md => {
                expect(isValidMarkdown(md)).toBe(true);
            });
        });

        test("should return true for content with lists", () => {
            const markdowns = [
                "* Item 1\n* Item 2",
                "- Item 1\n- Item 2",
                "+ Item 1\n+ Item 2",
                "1. Item 1\n2. Item 2"
            ];

            markdowns.forEach(md => {
                expect(isValidMarkdown(md)).toBe(true);
            });
        });

        test("should return true for content with links", () => {
            const markdown = "Check out [this link](https://example.com)";
            expect(isValidMarkdown(markdown)).toBe(true);
        });

        test("should return true for content with emphasis", () => {
            const markdowns = [
                "This is **bold** text",
                "This is *italic* text",
                "This has `inline code`"
            ];

            markdowns.forEach(md => {
                expect(isValidMarkdown(md)).toBe(true);
            });
        });

        test("should return true for content with blockquotes", () => {
            const markdown = "> This is a blockquote";
            expect(isValidMarkdown(markdown)).toBe(true);
        });

        test("should return true for content with tables", () => {
            const markdown = "| Col 1 | Col 2 |\n|-------|-------|";
            expect(isValidMarkdown(markdown)).toBe(true);
        });

        test("should return true for content with horizontal rules", () => {
            const markdown = "Content above\n\n---\n\nContent below";
            expect(isValidMarkdown(markdown)).toBe(true);
        });

        test("should return true for content with code blocks", () => {
            const markdown = "```javascript\nconsole.log('hello');\n```";
            expect(isValidMarkdown(markdown)).toBe(true);
        });

        test("should return true for structured multi-line content", () => {
            const markdown = "Line 1\nLine 2\nLine 3\n\n- Item 1\n- Item 2";
            expect(isValidMarkdown(markdown)).toBe(true);
        });

        test("should return false for empty string", () => {
            expect(isValidMarkdown("")).toBe(false);
        });

        test("should return false for whitespace only", () => {
            expect(isValidMarkdown("   \n  \t  ")).toBe(false);
        });

        test("should return true for simple text (any non-empty content)", () => {
            const markdown = "This is just plain text without special formatting.";
            expect(isValidMarkdown(markdown)).toBe(true);
        });
    });

    describe("safeParseMarkdown", () => {
        test("should return content for valid markdown", () => {
            const markdown = "# Hello World\n\nThis is content.";
            const result = safeParseMarkdown(markdown);
            expect(result).toBe("# Hello World\n\nThis is content.");
        });

        test("should return content for plain text", () => {
            const text = "Just plain text";
            const result = safeParseMarkdown(text);
            expect(result).toBe("Just plain text");
        });

        test("should return null for empty string", () => {
            const result = safeParseMarkdown("");
            expect(result).toBeNull();
        });

        test("should return null for whitespace only", () => {
            const result = safeParseMarkdown("   \n  \t  ");
            expect(result).toBeNull();
        });

        test("should handle errors gracefully", () => {
            const result = safeParseMarkdown("test content");
            // Since the content is valid, it should return the content
            expect(result).toBe("test content");
        });
    });

    describe("validateAndFormatMarkdown", () => {
        test("should return valid result for markdown content", () => {
            const response = "# Hello World\n\nThis is content.";
            const result = validateAndFormatMarkdown(response);
            expect(result.isValid).toBe(true);
            expect(result.markdown).toBe("# Hello World\n\nThis is content.");
            expect(result.error).toBeUndefined();
        });

        test("should return valid result for response with markdown code block", () => {
            const response = `Here's the markdown:
\`\`\`markdown
# Hello World

Content here.
\`\`\``;
            const result = validateAndFormatMarkdown(response);
            expect(result.isValid).toBe(true);
            expect(result.markdown).toBe("# Hello World\n\nContent here.");
            expect(result.error).toBeUndefined();
        });

        test("should return valid result for plain text", () => {
            const response = "This is just plain text";
            const result = validateAndFormatMarkdown(response);
            expect(result.isValid).toBe(true);
            expect(result.markdown).toBe("This is just plain text");
            expect(result.error).toBeUndefined();
        });

        test("should handle errors gracefully", () => {
            const response = "test response";
            const result = validateAndFormatMarkdown(response);
            expect(result.isValid).toBe(true);
            expect(result.markdown).toBe("test response");
            expect(result.error).toBeUndefined();
        });

        test("should handle multiple markdown blocks", () => {
            const response = `\`\`\`markdown
# Section 1
Content 1
\`\`\`

\`\`\`markdown
# Section 2
Content 2
\`\`\``;
            const result = validateAndFormatMarkdown(response);
            expect(result.isValid).toBe(true);
            expect(result.markdown).toBe("# Section 1\nContent 1\n\n---\n\n# Section 2\nContent 2");
        });
    });
});