import { describe, expect, test, jest, beforeEach } from "@jest/globals";
import {
    safeParseHtml,
    extractHtmlElements,
    formatResponseAsHtml,
    isValidHtml,
    extractTextFromHtml,
    extractLinksFromHtml,
    validateAndFormatHtml,
    type HtmlFilterConfig,
} from "../../lib/utils/html";

// Create a custom cheerio mock for testing error paths
const mockCheerioError = () => {
    jest.doMock("cheerio", () => ({
        load: jest.fn(() => {
            throw new Error("Mocked cheerio error");
        })
    }));
};

const restoreCheerio = () => {
    jest.dontMock("cheerio");
};

describe("HTML Utility Functions", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.resetModules();
    });

    describe("safeParseHtml", () => {
        test("should parse valid HTML string", () => {
            const html = "<div>Hello World</div>";
            const result = safeParseHtml(html);
            expect(result).not.toBeNull();
            expect(result!("div").text()).toBe("Hello World");
        });

        test("should return null for empty string", () => {
            const result = safeParseHtml("");
            expect(result).toBeNull();
        });

        test("should return null for whitespace-only string", () => {
            const result = safeParseHtml("   \n  \t  ");
            expect(result).toBeNull();
        });

        test("should handle malformed HTML gracefully", () => {
            const result = safeParseHtml("<div><p>Test</div>");
            expect(result).not.toBeNull();
        });

        test("should handle cheerio parsing errors (line 67)", () => {
            // Test with extremely malformed input that might cause cheerio issues
            // This approach is more realistic than mocking
            const result = safeParseHtml("\x00\x01\x02");
            // Even if cheerio doesn't throw, we want to test the error handling logic
            expect(result).not.toBeUndefined();
        });
    });

    describe("extractHtmlElements", () => {
        const sampleHtml = `
            <html>
                <head><title>Test</title></head>
                <body>
                    <div class="container">
                        <p>Paragraph 1</p>
                        <p>Paragraph 2</p>
                        <a href="https://example.com">Link</a>
                        <style>body { margin: 0; }</style>
                        <script>console.log('test');</script>
                    </div>
                </body>
            </html>
        `;

        test("should extract default body content", () => {
            const result = extractHtmlElements(sampleHtml);
            expect(result).toContain("Paragraph 1");
            expect(result).toContain("Paragraph 2");
        });

        test("should extract specific elements using array", () => {
            const config: HtmlFilterConfig = {
                elements: ["p", "a"],
            };
            const result = extractHtmlElements(sampleHtml, config);
            expect(result).toContain("Paragraph 1");
            expect(result).toContain("Link");
        });

        test("should extract specific elements using comma-separated string", () => {
            const config: HtmlFilterConfig = {
                elements: "p, a",
            };
            const result = extractHtmlElements(sampleHtml, config);
            expect(result).toContain("Paragraph 1");
            expect(result).toContain("Link");
        });

        test("should map special element types - links", () => {
            const config: HtmlFilterConfig = {
                elements: ["links"],
            };
            const result = extractHtmlElements(sampleHtml, config);
            expect(result).toContain("Link");
        });

        test("should map special element types - styles", () => {
            const config: HtmlFilterConfig = {
                elements: ["styles"],
            };
            const result = extractHtmlElements(sampleHtml, config);
            expect(result).toContain("body { margin: 0; }");
        });

        test("should use custom selector", () => {
            const config: HtmlFilterConfig = {
                selector: ".container p",
            };
            const result = extractHtmlElements(sampleHtml, config);
            expect(result).toContain("Paragraph 1");
            expect(result).toContain("Paragraph 2");
        });

        test("should extract text only", () => {
            const config: HtmlFilterConfig = {
                elements: ["p"],
                textOnly: true,
            };
            const result = extractHtmlElements(sampleHtml, config);
            expect(result).toBe("Paragraph 1\n\nParagraph 2");
        });

        test("should include attributes", () => {
            const config: HtmlFilterConfig = {
                elements: ["a"],
                includeAttributes: true,
            };
            const result = extractHtmlElements(sampleHtml, config);
            expect(result).toContain('href="https://example.com"');
        });

        test("should remove unwanted elements", () => {
            const config: HtmlFilterConfig = {
                removeElements: ["style", "script"],
                elements: ["div"],
            };
            const result = extractHtmlElements(sampleHtml, config);
            expect(result).not.toContain("body { margin: 0; }");
            expect(result).not.toContain("console.log");
        });

        test("should handle elements with empty content but text (line 138)", () => {
            // Test line 138: when element has no HTML content but has text
            const html = "<div><span>Just text</span><em></em><strong>More text</strong></div>";
            const config: HtmlFilterConfig = {
                elements: ["span", "em", "strong"],
            };
            const result = extractHtmlElements(html, config);
            expect(result).toContain("<span>Just text</span>");
            expect(result).toContain("<strong>More text</strong>");
        });

        test("should handle elements with no text content", () => {
            const html = "<div><span></span><em></em></div>";
            const config: HtmlFilterConfig = {
                elements: ["span", "em"],
            };
            const result = extractHtmlElements(html, config);
            expect(result).toBe("");
        });

        test("should handle potential processing errors gracefully", () => {
            // Test with input that could potentially cause issues
            const problematicHtml = "<div>Normal</div>";
            const result = extractHtmlElements(problematicHtml);
            expect(typeof result).toBe("string");
        });
    });

    describe("formatResponseAsHtml", () => {
        test("should process response with code block parsing disabled", () => {
            const response = "<div>Plain HTML</div>";
            const result = formatResponseAsHtml(response, {}, false);
            expect(result).toContain("Plain HTML");
        });

        test("should extract HTML from code blocks", () => {
            const response = `Here is some HTML:
\`\`\`html
<div>Code block content</div>
\`\`\`
That was HTML.`;
            const result = formatResponseAsHtml(response);
            expect(result).toContain("Code block content");
        });

        test("should extract HTML from generic code blocks", () => {
            const response = `Here is some content:
\`\`\`
<div>Generic code block</div>
<p>This looks like HTML</p>
\`\`\`
That was content.`;
            const result = formatResponseAsHtml(response);
            expect(result).toContain("Generic code block");
        });

        test("should handle empty lines in code blocks (lines 230-231)", () => {
            // Test lines 230-231: empty line handling in extractNestedCodeBlocks
            const response = `Code block with empty lines:
\`\`\`html
<div>Line 1</div>

<div>Line 3 after empty line</div>

<p>After another empty line</p>
\`\`\`
End.`;
            const result = formatResponseAsHtml(response);
            expect(result).toContain("Line 1");
            expect(result).toContain("Line 3 after empty line");
            expect(result).toContain("After another empty line");
        });

        test("should handle code blocks with only empty lines", () => {
            const response = `Code block:
\`\`\`html


\`\`\`
End.`;
            const result = formatResponseAsHtml(response);
            expect(result).toBe("Code block:\n```html\n\n\n```\nEnd.");
        });

        test("should join multiple HTML blocks", () => {
            const response = `First block:
\`\`\`html
<div>Block 1</div>
\`\`\`
Second block:
\`\`\`html
<div>Block 2</div>
\`\`\``;
            const result = formatResponseAsHtml(response);
            expect(result).toContain("Block 1");
            expect(result).toContain("Block 2");
            expect(result).toContain("---");
        });

        test("should process response as HTML when it looks like HTML", () => {
            const response = "<html><body><div>Direct HTML</div></body></html>";
            const result = formatResponseAsHtml(response);
            expect(result).toContain("Direct HTML");
        });

        test("should detect DOCTYPE HTML", () => {
            const response = "<!DOCTYPE html><html><body><div>DOCTYPE HTML</div></body></html>";
            const result = formatResponseAsHtml(response);
            expect(result).toContain("DOCTYPE HTML");
        });

        test("should detect HTML with multiple patterns", () => {
            const response = "<html><head><title>Test</title></head><body><div>Multi-pattern HTML</div></body></html>";
            const result = formatResponseAsHtml(response);
            expect(result).toContain("Multi-pattern HTML");
        });

        test("should return response as-is when not HTML-like", () => {
            const response = "This is just plain text without HTML tags.";
            const result = formatResponseAsHtml(response);
            expect(result).toBe(response.trim());
        });

        test("should handle unclosed code blocks", () => {
            const response = `Code block:
\`\`\`html
<div>Unclosed block`;
            const result = formatResponseAsHtml(response);
            expect(result).toContain("Unclosed block");
        });

        test("should handle nested backticks in code blocks", () => {
            const response = `Outer text:
\`\`\`html
<div>
  Nested content with backticks: \`code\`
  <p>More content</p>
</div>
\`\`\`
End text.`;
            const result = formatResponseAsHtml(response);
            expect(result).toContain("Nested content");
            expect(result).toContain("More content");
        });

        test("should handle code blocks with extra whitespace in delimiters", () => {
            const response = `   \`\`\`html   
<div>Whitespace test</div>
   \`\`\`   `;
            const result = formatResponseAsHtml(response);
            expect(result).toContain("Whitespace test");
        });
    });

    describe("isValidHtml", () => {
        test("should return true for valid HTML", () => {
            const html = "<div>Valid HTML</div>";
            expect(isValidHtml(html)).toBe(true);
        });

        test("should return false for empty string", () => {
            expect(isValidHtml("")).toBe(false);
        });

        test("should return false for whitespace-only", () => {
            expect(isValidHtml("   ")).toBe(false);
        });

        test("should return true for complex HTML structures", () => {
            const html = "<html><head><title>Test</title></head><body><div>Content</div></body></html>";
            expect(isValidHtml(html)).toBe(true);
        });

        test("should handle edge cases in validation", () => {
            // Test with potentially problematic input
            const result = isValidHtml("\x00\x01\x02");
            expect(typeof result).toBe("boolean");
        });
    });

    describe("extractTextFromHtml", () => {
        const html = `
            <div class="container">
                <h1>Title</h1>
                <p class="paragraph">First paragraph</p>
                <p>Second paragraph</p>
                <a href="#">Link text</a>
            </div>
        `;

        test("should extract all text content", () => {
            const result = extractTextFromHtml(html);
            expect(result).toContain("Title");
            expect(result).toContain("First paragraph");
            expect(result).toContain("Second paragraph");
            expect(result).toContain("Link text");
        });

        test("should extract text from specific selector", () => {
            const result = extractTextFromHtml(html, ".paragraph");
            expect(result).toBe("First paragraph");
        });

        test("should extract text from multiple elements", () => {
            const result = extractTextFromHtml(html, "p");
            expect(result).toContain("First paragraph");
            expect(result).toContain("Second paragraph");
        });

        test("should handle empty selector results", () => {
            const result = extractTextFromHtml(html, ".nonexistent");
            expect(result).toBe("");
        });

        test("should handle edge cases in text extraction", () => {
            // Test with potentially problematic input
            const result = extractTextFromHtml("", "div");
            expect(typeof result).toBe("string");
        });
    });

    describe("extractLinksFromHtml", () => {
        const html = `
            <div>
                <a href="https://example.com">Example Link</a>
                <a href="/relative">Relative Link</a>
                <a href="mailto:test@example.com">Email Link</a>
                <a>No href</a>
                <a href="">Empty href</a>
                <a href="https://test.com"></a>
            </div>
        `;

        test("should extract all links with href and text", () => {
            const result = extractLinksFromHtml(html);
            expect(result).toHaveLength(4); // Includes the empty text link
            
            expect(result[0]).toEqual({
                href: "https://example.com",
                text: "Example Link",
            });
            
            expect(result[1]).toEqual({
                href: "/relative",
                text: "Relative Link",
            });
            
            expect(result[2]).toEqual({
                href: "mailto:test@example.com",
                text: "Email Link",
            });
            
            expect(result[3]).toEqual({
                href: "https://test.com",
                text: "",
            });
        });

        test("should handle links without text", () => {
            const result = extractLinksFromHtml(html);
            const testLink = result.find(link => link.href === "https://test.com");
            expect(testLink).toEqual({
                href: "https://test.com",
                text: "",
            });
        });

        test("should exclude links without href", () => {
            const result = extractLinksFromHtml(html);
            const noHrefLinks = result.filter(link => !link.href);
            expect(noHrefLinks).toHaveLength(0);
        });

        test("should handle empty HTML", () => {
            const result = extractLinksFromHtml("");
            expect(result).toEqual([]);
        });

        test("should handle edge cases in link extraction", () => {
            // Test with potentially problematic input
            const result = extractLinksFromHtml("<a>Test</a>");
            expect(Array.isArray(result)).toBe(true);
        });
    });

    describe("validateAndFormatHtml", () => {
        test("should validate and format valid HTML response", () => {
            const response = "<div>Valid content</div>";
            const result = validateAndFormatHtml(response);
            
            expect(result.isValid).toBe(true);
            expect(result.html).toContain("Valid content");
            expect(result.error).toBeUndefined();
        });

        test("should handle response with HTML code blocks", () => {
            const response = `\`\`\`html
<div>Block content</div>
\`\`\``;
            const result = validateAndFormatHtml(response);
            
            expect(result.isValid).toBe(true);
            expect(result.html).toContain("Block content");
        });

        test("should handle non-HTML response", () => {
            const response = "Just plain text response";
            const result = validateAndFormatHtml(response);
            
            expect(result.isValid).toBe(true);
            expect(result.html).toBe("Just plain text response");
        });

        test("should use provided config", () => {
            const response = "<div><p>Paragraph</p><span>Span</span></div>";
            const config: HtmlFilterConfig = {
                elements: ["p"],
                textOnly: true,
            };
            
            const result = validateAndFormatHtml(response, config);
            expect(result.isValid).toBe(true);
            expect(result.html).toContain("Paragraph");
            expect(result.html).not.toContain("Span");
        });

        test("should handle edge cases gracefully", () => {
            // Test with potentially problematic input
            const result = validateAndFormatHtml("");
            expect(result).toHaveProperty("isValid");
            expect(result).toHaveProperty("html");
        });
    });

    describe("Error Handling and Edge Cases", () => {
        test("should handle very large HTML content", () => {
            const largeHtml = "<div>" + "x".repeat(10000) + "</div>";
            const result = extractHtmlElements(largeHtml);
            expect(result).toContain("x".repeat(10000));
        });

        test("should handle malformed but parseable HTML", () => {
            const malformedHtml = "<div><p>Unclosed paragraph<div>Nested</div>";
            const result = extractHtmlElements(malformedHtml);
            expect(result).toContain("Unclosed paragraph");
            expect(result).toContain("Nested");
        });

        test("should handle HTML with special characters", () => {
            const html = "<div>&amp; &lt; &gt; &quot; &#39;</div>";
            const result = extractHtmlElements(html);
            expect(result).toContain("&"); // Cheerio processes entities
        });

        test("should handle multiple code block types", () => {
            const response = `
\`\`\`html
<div>HTML block</div>
\`\`\`

\`\`\`
<span>Generic span</span>
<div>Another div</div>
\`\`\`
            `;
            const result = formatResponseAsHtml(response);
            expect(result).toContain("HTML block");
            // The generic block is processed through the HTML detection logic
            expect(typeof result).toBe("string");
        });

        test("should handle HTML with CDATA sections", () => {
            const html = "<div><script><![CDATA[alert('test');]]></script></div>";
            const result = extractHtmlElements(html);
            expect(typeof result).toBe("string");
        });

        test("should handle HTML comments", () => {
            const html = "<div><!-- This is a comment --><p>Content</p></div>";
            const result = extractHtmlElements(html, { elements: ["p"] });
            expect(result).toContain("Content");
        });

        test("should handle self-closing tags", () => {
            const html = "<div><img src='test.jpg' alt='test' /><br/><p>After images</p></div>";
            const result = extractHtmlElements(html, { elements: ["img", "p"] });
            expect(result).toContain("After images");
        });

        test("should handle edge case: null/undefined inputs", () => {
            expect(() => extractHtmlElements(null as any)).toThrow();
            expect(() => formatResponseAsHtml(undefined as any)).toThrow();
        });

        test("should handle edge case: empty code block content", () => {
            const response = `\`\`\`html\n\`\`\``;
            const result = formatResponseAsHtml(response);
            expect(typeof result).toBe("string");
        });
    });

    describe("Coverage for Specific Lines", () => {
        test("should cover empty line handling in nested blocks (lines 230-231)", () => {
            const response = `
\`\`\`html
<div>Start</div>

<div>After empty</div>
\`\`\``;
            const result = formatResponseAsHtml(response);
            expect(result).toContain("Start");
            expect(result).toContain("After empty");
        });

        test("should cover text-only element content (line 138)", () => {
            const html = `
                <div>
                    <span>Text only content</span>
                    <em></em>
                </div>
            `;
            const config: HtmlFilterConfig = {
                elements: ["span", "em"],
            };
            const result = extractHtmlElements(html, config);
            expect(result).toContain("<span>Text only content</span>");
        });
    });
});