import { describe, expect, test } from "@jest/globals";
import { formatResponseAsMarkdown } from "../../lib/utils/markdown";

describe("Markdown Comprehensive Tests", () => {
    describe("Nested Code Block Extraction", () => {
        test("should extract markdown content and preserve nested JavaScript blocks", () => {
            const response = `Here's the documentation:
\`\`\`markdown
# API Documentation

Here's how to use our API:

\`\`\`javascript
const api = require('our-api');
api.connect();
\`\`\`

And here's another example:

\`\`\`js
console.log('Hello World');
\`\`\`

That's it!
\`\`\``;
            
            const result = formatResponseAsMarkdown(response, true);
            
            // Should extract the markdown content without the ```markdown wrapper
            expect(result).not.toContain("```markdown");
            expect(result).toContain("# API Documentation");
            expect(result).toContain("```javascript");
            expect(result).toContain("const api = require('our-api');");
            expect(result).toContain("```js");
            expect(result).toContain("console.log('Hello World');");
            expect(result).toContain("That's it!");
        });

        test("should handle multiple markdown blocks and merge with separator", () => {
            const response = `\`\`\`markdown
# Section 1

This is the first section.

\`\`\`python
def hello():
    print("Hello")
\`\`\`
\`\`\`

Some text in between.

\`\`\`markdown
# Section 2

This is the second section.

\`\`\`bash
echo "Hello World"
\`\`\`
\`\`\``;
            
            const result = formatResponseAsMarkdown(response, true);
            
            // Should merge multiple markdown blocks with ---
            expect(result).not.toContain("```markdown");
            expect(result).toContain("# Section 1");
            expect(result).toContain("# Section 2");
            expect(result).toContain("---"); // Separator between blocks
            expect(result).toContain("```python");
            expect(result).toContain("def hello():");
            expect(result).toContain("```bash");
            expect(result).toContain("echo \"Hello World\"");
        });

        test("should handle deeply nested code blocks", () => {
            const response = `\`\`\`markdown
# Code Examples

Here's a markdown example within markdown:

\`\`\`md
## Nested Header

Some nested content with code:

\`\`\`python
print("Nested Python")
\`\`\`
\`\`\`

And regular code:

\`\`\`javascript
function test() {
    return "test";
}
\`\`\`
\`\`\``;
            
            const result = formatResponseAsMarkdown(response, true);
            
            expect(result).not.toContain("```markdown");
            expect(result).toContain("# Code Examples");
            expect(result).toContain("```md");
            expect(result).toContain("## Nested Header");
            expect(result).toContain("```python");
            expect(result).toContain("print(\"Nested Python\")");
            expect(result).toContain("```javascript");
            expect(result).toContain("function test()");
        });

        test("should extract only markdown when response is wrapped in markdown block", () => {
            const response = `\`\`\`markdown
# User Profile - JSON Format

This document defines a user profile in JSON format.

## JSON Data

\`\`\`json
{
  "name": "Alice Smith",
  "email": "alice.smith@example.com",
  "age": 30
}
\`\`\`

## How to Use

Use the JSON.parse() method:

\`\`\`javascript
const user = JSON.parse(jsonString);
console.log(user.name);
\`\`\`

That's all!
\`\`\``;
            
            const result = formatResponseAsMarkdown(response, true);
            
            // Should extract content without markdown wrapper
            expect(result).not.toContain("```markdown");
            expect(result).toContain("# User Profile - JSON Format");
            expect(result).toContain("```json");
            expect(result).toContain('"name": "Alice Smith"');
            expect(result).toContain("```javascript");
            expect(result).toContain("const user = JSON.parse(jsonString);");
            expect(result).toContain("That's all!");
        });

        test("should preserve non-markdown code blocks in plain response", () => {
            const response = `Here's some code:

\`\`\`python
def main():
    print("Hello")
\`\`\`

And more:

\`\`\`bash
ls -la
\`\`\`

No markdown blocks here.`;
            
            const result = formatResponseAsMarkdown(response, true);
            
            // Should keep the entire response as-is since no markdown blocks
            expect(result).toBe(response.trim());
        });

        test("should handle mixed content with markdown at different positions", () => {
            const response = `Introduction text.

\`\`\`javascript
// Some JS code
const x = 1;
\`\`\`

\`\`\`markdown
# Main Content

This is the main markdown content.

\`\`\`python
# Python example
for i in range(10):
    print(i)
\`\`\`
\`\`\`

\`\`\`bash
# Shell script
#!/bin/bash
echo "Done"
\`\`\`

Conclusion.`;
            
            const result = formatResponseAsMarkdown(response, true);
            
            // Should intelligently handle mixed content
            expect(result).toContain("# Main Content");
            expect(result).toContain("```python");
            expect(result).toContain("for i in range(10):");
        });

        test("should handle empty markdown blocks gracefully", () => {
            const response = `\`\`\`markdown
\`\`\`

Some content

\`\`\`markdown
# Real Content
\`\`\``;
            
            const result = formatResponseAsMarkdown(response, true);
            
            expect(result).toContain("# Real Content");
        });

        test("should handle markdown blocks with language variants", () => {
            const response = `\`\`\`markdown
# Test
\`\`\`

\`\`\`md
## Another Test
\`\`\`

\`\`\`Markdown
### Yet Another
\`\`\`

\`\`\`MARKDOWN
#### Final Test
\`\`\``;
            
            const result = formatResponseAsMarkdown(response, true);
            
            expect(result).toContain("# Test");
            expect(result).toContain("## Another Test");
            expect(result).toContain("### Yet Another");
            expect(result).toContain("#### Final Test");
            expect(result).toContain("---"); // Should have separators
        });

        test("should correctly match opening and closing backticks", () => {
            const response = `\`\`\`markdown
# Header

Some content with inline \`code\` and more text.

\`\`\`python
# This has backticks in comments \`\`\`
print("test")
\`\`\`

End of markdown
\`\`\``;
            
            const result = formatResponseAsMarkdown(response, true);
            
            expect(result).not.toContain("```markdown");
            expect(result).toContain("# Header");
            expect(result).toContain("Some content with inline `code`");
            expect(result).toContain("```python");
            expect(result).toContain('# This has backticks in comments ```');
            expect(result).toContain("End of markdown");
        });

        test("should handle real-world agent response format", () => {
            const response = `Okay, here's a Markdown file containing a JSON user profile, followed by instructions on how to use it.

\`\`\`markdown
# User Profile - JSON Format

This document defines a user profile in JSON format.  It's a common way to store and exchange user data.

## JSON Data

\`\`\`json
{
  "name": "Alice Smith",
  "email": "alice.smith@example.com",
  "age": 30
}
\`\`\`

## Explanation

*   **\`{}\`**:  Curly braces denote a JSON object.
*   **\`"key": "value"\`**:  Each piece of data is stored as a key-value pair.

## How to Use This JSON Data

This JSON data can be used in various scenarios:

**Example (JavaScript):**

\`\`\`javascript
const jsonString = \`{ "name": "Alice Smith", "email": "alice.smith@example.com", "age": 30 }\`;
const userProfile = JSON.parse(jsonString);

console.log(userProfile.name); // Output: Alice Smith
\`\`\`

**Key Considerations:**

*   **Data Types:** JSON supports various data types.
*   **Validation:**  Always validate your JSON data.
\`\`\`

Do you want me to provide more examples?`;
            
            const result = formatResponseAsMarkdown(response, true);
            
            // Should extract the markdown content cleanly
            expect(result).not.toContain("```markdown");
            expect(result).not.toContain("Okay, here's a Markdown file");
            expect(result).not.toContain("Do you want me to provide more examples?");
            
            expect(result).toContain("# User Profile - JSON Format");
            expect(result).toContain("```json");
            expect(result).toContain('"name": "Alice Smith"');
            expect(result).toContain("```javascript");
            expect(result).toContain("const userProfile = JSON.parse(jsonString);");
            expect(result).toContain("**Data Types:**");
            expect(result).toContain("**Validation:**");
        });
    });

    describe("Edge Cases", () => {
        test("should handle responses with only opening backticks", () => {
            const response = `\`\`\`markdown
# Incomplete`;
            
            const result = formatResponseAsMarkdown(response, true);
            
            // Should handle gracefully
            expect(result).toBe(response.trim());
        });

        test("should handle responses with mismatched backticks", () => {
            const response = `\`\`\`markdown
# Content
\`\`

More content`;
            
            const result = formatResponseAsMarkdown(response, true);
            
            // Should handle gracefully
            expect(result).toBe(response.trim());
        });

        test("should handle code blocks with extra backticks", () => {
            const response = `\`\`\`\`markdown
# Content
\`\`\`\``;
            
            const result = formatResponseAsMarkdown(response, true);
            
            // Should handle variations in backtick count
            expect(result).toContain("# Content");
        });
    });

    describe("Parsing Control", () => {
        test("should return full response when parsing disabled", () => {
            const response = `\`\`\`markdown
# Header
\`\`\``;
            
            const result = formatResponseAsMarkdown(response, false);
            
            expect(result).toBe(response.trim());
            expect(result).toContain("```markdown");
        });

        test("should extract when parsing enabled", () => {
            const response = `\`\`\`markdown
# Header
\`\`\``;
            
            const result = formatResponseAsMarkdown(response, true);
            
            expect(result).not.toContain("```markdown");
            expect(result).toContain("# Header");
        });
    });
});