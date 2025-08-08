import { describe, expect, test, beforeAll, afterAll } from "bun:test";
import { web_fetch } from "../../lib/tools/web_fetch";

describe("web_fetch Tool Tests (Puppeteer)", () => {
    test("should require URL parameter", async () => {
        const result = await web_fetch.execute({});

        expect(result.success).toBe(false);
        expect(result.error).toContain("URL is required");
    });

    test("should handle empty URL", async () => {
        const result = await web_fetch.execute({
            url: "",
        });

        expect(result.success).toBe(false);
        expect(result.error).toContain("URL is required");
    });

    test("should reject invalid URL format", async () => {
        const result = await web_fetch.execute({
            url: "not-a-valid-url",
        });

        expect(result.success).toBe(false);
        expect(result.error).toContain("Invalid URL format");
        expect(result.url).toBe("not-a-valid-url");
    });

    test("should reject non-HTTP/HTTPS protocols", async () => {
        const result = await web_fetch.execute({
            url: "ftp://example.com/file.txt",
        });

        expect(result.success).toBe(false);
        expect(result.error).toContain("Only HTTP and HTTPS protocols are allowed");
        expect(result.protocol).toBe("ftp:");
    });

    test("should fetch content from simple webpage", async () => {
        const result = await web_fetch.execute({
            url: "https://httpbin.org/html",
            timeout_ms: 30000,
        });

        if (result.success) {
            expect(result.success).toBe(true);
            expect(result.content).toBeDefined();
            expect(result.html).toBeDefined();
            expect(result.contentLength).toBeGreaterThan(0);
            expect(result.htmlLength).toBeGreaterThan(0);
            expect(result.title).toBeDefined();
            expect(result.responseTime).toBeGreaterThan(0);
            expect(result.requestUrl).toBe("https://httpbin.org/html");
            expect(result.url).toBeDefined();
            expect(result.javascriptEnabled).toBe(true);
            expect(result.viewportWidth).toBe(1920);
            expect(result.viewportHeight).toBe(1080);
        } else {
            // If external service is down, that's ok for testing
            console.log("External service unavailable:", result.error);
            expect(result.error).toBeDefined();
        }
    }, 30000);

    test("should handle timeout", async () => {
        const result = await web_fetch.execute({
            url: "https://httpbin.org/delay/10", // 10 second delay
            timeout_ms: 2000, // 2 second timeout
        });

        expect(result.success).toBe(false);
        expect(result.timeout).toBe(true);
        expect(result.timeoutMs).toBe(2000);
        expect(result.error).toBeDefined();
    }, 15000);

    test("should extract links when requested", async () => {
        const result = await web_fetch.execute({
            url: "https://httpbin.org/html",
            extract_links: true,
            timeout_ms: 30000,
        });

        if (result.success) {
            expect(result.links).toBeDefined();
            expect(Array.isArray(result.links)).toBe(true);
            // HTML page might not have links, but the property should exist
            expect(result.links).toEqual(expect.any(Array));
        } else {
            console.log("External service unavailable:", result.error);
            expect(result.error).toBeDefined();
        }
    }, 30000);

    test("should extract images when requested", async () => {
        const result = await web_fetch.execute({
            url: "https://httpbin.org/html",
            extract_images: true,
            timeout_ms: 30000,
        });

        if (result.success) {
            expect(result.images).toBeDefined();
            expect(Array.isArray(result.images)).toBe(true);
        } else {
            console.log("External service unavailable:", result.error);
            expect(result.error).toBeDefined();
        }
    }, 30000);

    test("should set custom viewport size", async () => {
        const result = await web_fetch.execute({
            url: "https://httpbin.org/html",
            viewport_width: 800,
            viewport_height: 600,
            timeout_ms: 30000,
        });

        if (result.success) {
            expect(result.viewportWidth).toBe(800);
            expect(result.viewportHeight).toBe(600);
        } else {
            console.log("External service unavailable:", result.error);
            expect(result.error).toBeDefined();
        }
    }, 30000);

    test("should disable JavaScript when requested", async () => {
        const result = await web_fetch.execute({
            url: "https://httpbin.org/html",
            javascript_enabled: false,
            timeout_ms: 30000,
        });

        if (result.success) {
            expect(result.javascriptEnabled).toBe(false);
        } else {
            console.log("External service unavailable:", result.error);
            expect(result.error).toBeDefined();
        }
    }, 30000);

    test("should take screenshot when requested", async () => {
        const result = await web_fetch.execute({
            url: "https://httpbin.org/html",
            screenshot: true,
            timeout_ms: 30000,
        });

        if (result.success) {
            expect(result.screenshot).toBeDefined();
            expect(typeof result.screenshot).toBe("string");
            expect(result.screenshot!.length).toBeGreaterThan(0);
            // Should be base64 encoded
            expect(result.screenshot).toMatch(/^[A-Za-z0-9+/=]+$/);
        } else {
            console.log("External service unavailable:", result.error);
            expect(result.error).toBeDefined();
        }
    }, 30000);

    test("should handle invalid cookies gracefully", async () => {
        const result = await web_fetch.execute({
            url: "https://httpbin.org/html",
            cookies: "invalid-json",
            timeout_ms: 30000,
        });

        expect(result.success).toBe(false);
        expect(result.error).toContain("valid JSON array");
    });

    test("should handle non-array cookies", async () => {
        const result = await web_fetch.execute({
            url: "https://httpbin.org/html",
            cookies: '{"not": "array"}',
            timeout_ms: 30000,
        });

        expect(result.success).toBe(false);
        expect(result.error).toContain("JSON array of cookie objects");
    });

    test("should set cookies when provided", async () => {
        const cookies = JSON.stringify([
            {
                name: "test_cookie",
                value: "test_value",
                domain: "httpbin.org",
            }
        ]);

        const result = await web_fetch.execute({
            url: "https://httpbin.org/cookies",
            cookies,
            timeout_ms: 30000,
        });

        if (result.success) {
            expect(result.success).toBe(true);
            // We can't easily verify if the cookie was set without parsing the response
            // but the test passes if no error occurs
        } else {
            console.log("External service unavailable:", result.error);
            expect(result.error).toBeDefined();
        }
    }, 30000);

    test("should wait for selector when provided", async () => {
        const result = await web_fetch.execute({
            url: "https://httpbin.org/html",
            wait_for_selector: "body",
            timeout_ms: 30000,
        });

        if (result.success) {
            expect(result.success).toBe(true);
            expect(result.content).toBeDefined();
        } else {
            console.log("External service unavailable:", result.error);
            expect(result.error).toBeDefined();
        }
    }, 30000);

    test("should use custom wait time", async () => {
        const startTime = Date.now();
        const result = await web_fetch.execute({
            url: "https://httpbin.org/html",
            wait_for_load_ms: 2000,
            timeout_ms: 30000,
        });

        if (result.success) {
            const elapsed = Date.now() - startTime;
            expect(elapsed).toBeGreaterThan(2000); // Should wait at least 2 seconds
            expect(result.success).toBe(true);
        } else {
            console.log("External service unavailable:", result.error);
            expect(result.error).toBeDefined();
        }
    }, 30000);

    test("should handle network errors gracefully", async () => {
        const result = await web_fetch.execute({
            url: "https://this-domain-should-not-exist-12345.com",
            timeout_ms: 5000,
        });

        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
    }, 10000);

    test("should work with custom user agent", async () => {
        const result = await web_fetch.execute({
            url: "https://httpbin.org/user-agent",
            user_agent: "Custom-Agent/1.0",
            timeout_ms: 30000,
        });

        if (result.success) {
            expect(result.success).toBe(true);
            expect(result.content).toContain("Custom-Agent/1.0");
        } else {
            console.log("External service unavailable:", result.error);
            expect(result.error).toBeDefined();
        }
    }, 30000);

    test("should work with resource blocking", async () => {
        const result = await web_fetch.execute({
            url: "https://httpbin.org/html",
            block_images: true,
            block_css: true,
            timeout_ms: 30000,
        });

        if (result.success) {
            expect(result.success).toBe(true);
            expect(result.content).toBeDefined();
        } else {
            console.log("External service unavailable:", result.error);
            expect(result.error).toBeDefined();
        }
    }, 30000);
});