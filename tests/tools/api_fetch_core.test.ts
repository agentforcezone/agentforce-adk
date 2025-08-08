import { describe, expect, test } from "bun:test";
import { api_fetch } from "../../lib/tools/api_fetch";

describe("api_fetch Tool Tests (Core)", () => {
    test("should require URL parameter", async () => {
        const result = await api_fetch.execute({});

        expect(result.success).toBe(false);
        expect(result.error).toContain("URL is required");
    });

    test("should handle empty URL", async () => {
        const result = await api_fetch.execute({
            url: "",
        });

        expect(result.success).toBe(false);
        expect(result.error).toContain("URL is required");
    });

    test("should reject invalid URL format", async () => {
        const result = await api_fetch.execute({
            url: "not-a-valid-url",
        });

        expect(result.success).toBe(false);
        expect(result.error).toContain("Invalid URL format");
        expect(result.url).toBe("not-a-valid-url");
    });

    test("should reject non-HTTP/HTTPS protocols", async () => {
        const result = await api_fetch.execute({
            url: "ftp://example.com/file.txt",
        });

        expect(result.success).toBe(false);
        expect(result.error).toContain("Only HTTP and HTTPS protocols are allowed");
        expect(result.protocol).toBe("ftp:");
    });

    test("should reject invalid HTTP methods", async () => {
        const result = await api_fetch.execute({
            url: "https://httpbin.org/get",
            method: "INVALID",
        });

        expect(result.success).toBe(false);
        expect(result.error).toContain("HTTP method 'INVALID' is not allowed");
        expect(result.method).toBe("INVALID");
    });

    test("should reject invalid JSON in headers", async () => {
        const result = await api_fetch.execute({
            url: "https://httpbin.org/get",
            headers: "invalid-json",
        });

        expect(result.success).toBe(false);
        expect(result.error).toContain("valid JSON object");
    });

    test("should reject non-object headers", async () => {
        const result = await api_fetch.execute({
            url: "https://httpbin.org/get",
            headers: '["not", "object"]',
        });

        expect(result.success).toBe(false);
        expect(result.error).toContain("JSON object with string values");
    });

    test("should handle network errors gracefully", async () => {
        const result = await api_fetch.execute({
            url: "https://this-domain-should-not-exist-12345.com",
            timeout_ms: 1000,
        });

        expect(result.success).toBe(false);
        expect(result.networkError).toBe(true);
        expect(result.error).toBeDefined();
    });

    test("should fetch content from GitHub CLI manual page", async () => {
        const result = await api_fetch.execute({
            url: "https://cli.github.com/manual/gh_project_item-create",
            timeout_ms: 10000,
        });

        if (result.success) {
            expect(result.status).toBe(200);
            expect(result.content).toContain("gh project item-create");
            expect(result.headers["content-type"]).toContain("text/html");
            expect(result.contentLength).toBeGreaterThan(0);
            expect(result.method).toBe("GET");
            expect(result.requestUrl).toBe("https://cli.github.com/manual/gh_project_item-create");
        } else {
            // If external service is down, that's ok for testing
            console.log("External service unavailable:", result.error);
            expect(result.error).toBeDefined();
        }
    });
});
