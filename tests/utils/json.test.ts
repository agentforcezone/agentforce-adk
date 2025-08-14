import { describe, expect, test } from "@jest/globals";
import {
    parseJson,
    stringifyJson,
    isValidJson,
    safeParseJson,
    formatResponseAsJson,
    validateAndFormatJson
} from "../../lib/utils/json";

describe("JSON Utility Functions", () => {
    describe("parseJson", () => {
        test("should parse valid JSON string", () => {
            const jsonString = '{"name": "John", "age": 30}';
            const result = parseJson(jsonString);
            expect(result).toEqual({ name: "John", age: 30 });
        });

        test("should parse JSON array", () => {
            const jsonString = '[1, 2, 3]';
            const result = parseJson(jsonString);
            expect(result).toEqual([1, 2, 3]);
        });

        test("should throw error for invalid JSON", () => {
            const invalidJson = '{"name": "John", age: 30}'; // Missing quotes around age
            expect(() => parseJson(invalidJson)).toThrow("Failed to parse JSON");
        });

        test("should throw error for empty string", () => {
            expect(() => parseJson("")).toThrow("Failed to parse JSON");
        });
    });

    describe("stringifyJson", () => {
        test("should stringify object without pretty formatting", () => {
            const data = { name: "John", age: 30 };
            const result = stringifyJson(data, false);
            expect(result).toBe('{"name":"John","age":30}');
        });

        test("should stringify object with pretty formatting", () => {
            const data = { name: "John", age: 30 };
            const result = stringifyJson(data, true);
            expect(result).toBe('{\n  "name": "John",\n  "age": 30\n}');
        });

        test("should stringify array", () => {
            const data = [1, 2, 3];
            const result = stringifyJson(data);
            expect(result).toBe('[1,2,3]');
        });

        test("should handle circular references with error", () => {
            const circular: any = { name: "John" };
            circular.self = circular;
            expect(() => stringifyJson(circular)).toThrow("Failed to stringify to JSON");
        });
    });

    describe("isValidJson", () => {
        test("should return true for valid JSON object", () => {
            const validJson = '{"name": "John", "age": 30}';
            expect(isValidJson(validJson)).toBe(true);
        });

        test("should return true for valid JSON array", () => {
            const validJson = '[1, 2, 3]';
            expect(isValidJson(validJson)).toBe(true);
        });

        test("should return true for valid JSON string", () => {
            const validJson = '"hello world"';
            expect(isValidJson(validJson)).toBe(true);
        });

        test("should return false for invalid JSON", () => {
            const invalidJson = '{"name": "John", age: 30}';
            expect(isValidJson(invalidJson)).toBe(false);
        });

        test("should return false for empty string", () => {
            expect(isValidJson("")).toBe(false);
        });
    });

    describe("safeParseJson", () => {
        test("should return parsed object for valid JSON", () => {
            const jsonString = '{"name": "John", "age": 30}';
            const result = safeParseJson(jsonString);
            expect(result).toEqual({ name: "John", age: 30 });
        });

        test("should return null for invalid JSON", () => {
            const invalidJson = '{"name": "John", age: 30}';
            const result = safeParseJson(invalidJson);
            expect(result).toBeNull();
        });

        test("should return null for empty string", () => {
            const result = safeParseJson("");
            expect(result).toBeNull();
        });
    });

    describe("formatResponseAsJson", () => {
        test("should extract JSON from code block when parsing enabled", () => {
            const response = `Here is your JSON:
\`\`\`json
{"name": "John", "age": 30}
\`\`\`
That's the result!`;
            const result = formatResponseAsJson(response, true);
            expect(result).toBe('{"name":"John","age":30}');
        });

        test("should extract JSON from case-insensitive code blocks", () => {
            const response = `\`\`\`JSON
{"name": "Alice", "age": 25}
\`\`\``;
            const result = formatResponseAsJson(response, true);
            expect(result).toBe('{"name":"Alice","age":25}');
        });

        test("should merge multiple JSON blocks into array", () => {
            const response = `\`\`\`json
{"name": "John", "age": 30}
\`\`\`

\`\`\`json
{"name": "Alice", "age": 25}
\`\`\``;
            const result = formatResponseAsJson(response, true);
            const parsed = JSON.parse(result as string);
            expect(Array.isArray(parsed)).toBe(true);
            expect(parsed).toHaveLength(2);
            expect(parsed[0]).toEqual({ name: "John", age: 30 });
            expect(parsed[1]).toEqual({ name: "Alice", age: 25 });
        });

        test("should handle nested code blocks correctly", () => {
            const response = `Here's the data:
\`\`\`json
{
  "code": "\`\`\`python\\nprint('hello')\\n\`\`\`",
  "name": "example"
}
\`\`\``;
            const result = formatResponseAsJson(response, true);
            const parsed = JSON.parse(result as string);
            expect(parsed.code).toBe("```python\nprint('hello')\n```");
            expect(parsed.name).toBe("example");
        });

        test("should return whole response when parsing disabled", () => {
            const response = `Here is your JSON:
\`\`\`json
{"name": "John", "age": 30}
\`\`\`
That's the result!`;
            const result = formatResponseAsJson(response, false);
            expect(result).toBe(response.trim());
        });

        test("should parse valid JSON response when no code blocks found", () => {
            const response = '{"name": "John", "age": 30}';
            const result = formatResponseAsJson(response, true);
            expect(result).toBe('{"name":"John","age":30}');
        });

        test("should return original response when not valid JSON and no code blocks", () => {
            const response = "This is just plain text";
            const result = formatResponseAsJson(response, true);
            expect(result).toBe("This is just plain text");
        });

        test("should detect JSON-like content in generic code blocks", () => {
            const response = `\`\`\`
{"name": "John", "age": 30}
\`\`\``;
            const result = formatResponseAsJson(response, true);
            expect(result).toBe('{"name":"John","age":30}');
        });

        test("should handle invalid JSON in multiple blocks gracefully", () => {
            const response = `\`\`\`json
{"name": "John", "age": 30}
\`\`\`

\`\`\`json
{invalid json}
\`\`\``;
            const result = formatResponseAsJson(response, true);
            const parsed = JSON.parse(result as string);
            expect(Array.isArray(parsed)).toBe(true);
            expect(parsed).toHaveLength(2);
            expect(parsed[0]).toEqual({ name: "John", age: 30 });
            expect(parsed[1]).toEqual({ content: "{invalid json}" });
        });

        test("should handle formatting errors when merging multiple blocks", () => {
            // Create a scenario where JSON.stringify of merged objects fails
            // by creating objects that can't be stringified together
            const response = `\`\`\`json
{"valid": "json"}
\`\`\`

\`\`\`json
{invalid: json without quotes}
\`\`\``;
            
            // Mock JSON.stringify to fail on the first call (line 133) but succeed on fallback (lines 136-148)
            const originalStringify = JSON.stringify;
            let callCount = 0;
            const stringifySpy = jest.spyOn(JSON, 'stringify').mockImplementation((...args) => {
                callCount++;
                if (callCount === 1) {
                    // First call (merging parsed objects) should fail
                    throw new Error("Stringify failed");
                }
                // Subsequent calls should work (fallback formatting)
                return originalStringify.apply(JSON, args);
            });

            const result = formatResponseAsJson(response, true);
            
            // Should fall back to manual array formatting (lines 136-148)
            expect(typeof result).toBe("string");
            expect(result).toContain("[");
            expect(result).toContain("]");
            
            stringifySpy.mockRestore();
        });

        test("should handle last resort formatting when all else fails", () => {
            const response = `\`\`\`json
{"valid": "json"}
\`\`\`

\`\`\`json
{invalid: json}
\`\`\``;
            
            // Mock JSON.stringify to fail on all calls except specific ones
            const originalStringify = JSON.stringify;
            let callCount = 0;
            const stringifySpy = jest.spyOn(JSON, 'stringify').mockImplementation((...args) => {
                callCount++;
                if (callCount === 1 || callCount === 3) {
                    // Fail on merging and fallback formatting
                    throw new Error("Stringify failed");
                }
                // Allow parsing individual blocks but fail on final formatting
                return originalStringify.apply(JSON, args);
            });

            const result = formatResponseAsJson(response, true);
            
            // Should fall back to simple comma-separated format (line 148)
            expect(typeof result).toBe("string");
            expect(result).toMatch(/^\[[\s\S]*\]$/);
            
            stringifySpy.mockRestore();
        });

        test("should handle single block parsing failure", () => {
            const response = `\`\`\`json
{invalid: json without quotes}
\`\`\``;
            
            const result = formatResponseAsJson(response, true);
            
            // Should return the invalid JSON as-is (lines 160-161)
            expect(result).toBe("{invalid: json without quotes}");
        });

        test("should handle empty code blocks", () => {
            const response = `\`\`\`json

\`\`\``;
            
            const result = formatResponseAsJson(response, true);
            
            // Should return the original response since no valid JSON is found
            expect(result).toBe(response.trim());
        });

        test("should detect JSON-like arrays in generic code blocks", () => {
            const response = `\`\`\`
[{"name": "John"}, {"name": "Alice"}]
\`\`\``;
            const result = formatResponseAsJson(response, true);
            expect(result).toBe('[{"name":"John"},{"name":"Alice"}]');
        });

        test("should ignore non-JSON-like content in generic code blocks", () => {
            const response = `\`\`\`
This is just plain text
with multiple lines
\`\`\`

And some text outside.`;
            const result = formatResponseAsJson(response, true);
            expect(result).toBe(response.trim());
        });
    });

    describe("validateAndFormatJson", () => {
        test("should return valid result for proper JSON response", () => {
            const response = '{"name": "John", "age": 30}';
            const result = validateAndFormatJson(response);
            expect(result.isValid).toBe(true);
            expect(result.json).toBe('{"name": "John", "age": 30}');
            expect(result.error).toBeUndefined();
        });

        test("should return valid result for response with JSON code block", () => {
            const response = `\`\`\`json
{"name": "John", "age": 30}
\`\`\``;
            const result = validateAndFormatJson(response);
            expect(result.isValid).toBe(true);
            expect(result.json).toBe(response.trim());
            expect(result.error).toBeUndefined();
        });

        test("should return valid result for plain text", () => {
            const response = "This is just plain text";
            const result = validateAndFormatJson(response);
            expect(result.isValid).toBe(true);
            expect(result.json).toBe("This is just plain text");
            expect(result.error).toBeUndefined();
        });

        test("should handle errors gracefully", () => {
            // Create a response that will cause formatResponseAsJson to be called but not throw
            const response = "test response";
            const result = validateAndFormatJson(response);
            expect(result.isValid).toBe(true);
            expect(result.json).toBe("test response");
            expect(result.error).toBeUndefined();
        });

    });
});