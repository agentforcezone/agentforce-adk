import { beforeEach, describe, expect, jest, test } from "@jest/globals";

// Mock puppeteer-extra before importing the module
jest.mock("puppeteer-extra", () => ({
  __esModule: true,
  default: {
    use: jest.fn(),
    launch: jest.fn(),
  },
}));

jest.mock("puppeteer-extra-plugin-stealth", () => ({
  __esModule: true,
  default: jest.fn(() => ({})),
}));

import puppeteer from "puppeteer-extra";
import { web_fetch } from "../../lib/tools/web_fetch";

const mockPuppeteer = puppeteer as jest.Mocked<typeof puppeteer>;

describe("web_fetch Tool Tests (Mocked Puppeteer)", () => {
    const mockPage = {
        goto: jest.fn(),
        setViewport: jest.fn(),
        setUserAgent: jest.fn(),
        setCookie: jest.fn(),
        setJavaScriptEnabled: jest.fn(),
        setRequestInterception: jest.fn(),
        on: jest.fn(),
        waitForSelector: jest.fn(),
        evaluate: jest.fn(),
        content: jest.fn(),
        screenshot: jest.fn(),
        title: jest.fn(),
        url: jest.fn(),
        close: jest.fn(),
    };

    const mockBrowser = {
        newPage: jest.fn(),
        close: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
        
        // Setup default mock implementations
        mockPuppeteer.launch.mockResolvedValue(mockBrowser as any);
        mockBrowser.newPage.mockResolvedValue(mockPage as any);
        
        mockPage.goto.mockResolvedValue({
            status: () => 200,
            statusText: () => "OK",
        } as any);
        
        mockPage.evaluate.mockImplementation((fn: any) => {
            const fnString = fn.toString();
            if (fnString.includes("innerText") || fnString.includes("textContent")) {
                return Promise.resolve("Mocked page content");
            }
            if (fnString.includes('querySelectorAll("a[href]")')) {
                return Promise.resolve(["https://example.com/link1", "https://example.com/link2"]);
            }
            if (fnString.includes('querySelectorAll("img[src]")')) {
                return Promise.resolve(["https://example.com/image1.jpg", "https://example.com/image2.png"]);
            }
            return Promise.resolve("");
        });
        
        mockPage.content.mockResolvedValue("<html><body>Mocked HTML content</body></html>");
        mockPage.title.mockResolvedValue("Mocked Page Title");
        mockPage.url.mockReturnValue("https://httpbin.org/html");
        mockPage.screenshot.mockResolvedValue(Buffer.from("fake-screenshot-data") as any);
        mockPage.setViewport.mockResolvedValue(undefined);
        mockPage.setUserAgent.mockResolvedValue(undefined);
        mockPage.setCookie.mockResolvedValue(undefined);
        mockPage.setJavaScriptEnabled.mockResolvedValue(undefined);
        mockPage.setRequestInterception.mockResolvedValue(undefined);
        mockPage.on.mockReturnValue(undefined);
        mockPage.waitForSelector.mockResolvedValue(undefined);
        mockPage.close.mockResolvedValue(undefined);
        mockBrowser.close.mockResolvedValue(undefined);
    });

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

        expect(result.success).toBe(true);
        expect(result.content).toBe("Mocked page content");
        expect(result.html).toBe("<html><body>Mocked HTML content</body></html>");
        expect(result.contentLength).toBeGreaterThan(0);
        expect(result.htmlLength).toBeGreaterThan(0);
        expect(result.title).toBe("Mocked Page Title");
        expect(result.responseTime).toBeGreaterThan(0);
        expect(result.requestUrl).toBe("https://httpbin.org/html");
        expect(result.url).toBe("https://httpbin.org/html");
        expect(result.javascriptEnabled).toBe(true);
        expect(result.viewportWidth).toBe(1920);
        expect(result.viewportHeight).toBe(1080);
    });

    test("should handle timeout", async () => {
        // Mock page.goto to throw a TimeoutError
        mockPage.goto.mockRejectedValue(Object.assign(new Error("Navigation timeout"), { name: "TimeoutError" }));

        const result = await web_fetch.execute({
            url: "https://httpbin.org/delay/10",
            timeout_ms: 2000,
        });

        expect(result.success).toBe(false);
        expect(result.timeout).toBe(true);
        expect(result.timeoutMs).toBe(2000);
        expect(result.error).toBeDefined();
    });

    test("should extract links when requested", async () => {
        const result = await web_fetch.execute({
            url: "https://httpbin.org/html",
            extract_links: true,
            timeout_ms: 30000,
        });

        expect(result.success).toBe(true);
        expect(result.links).toBeDefined();
        expect(Array.isArray(result.links)).toBe(true);
        expect(result.links).toEqual(["https://example.com/link1", "https://example.com/link2"]);
    });

    test("should extract images when requested", async () => {
        const result = await web_fetch.execute({
            url: "https://httpbin.org/html",
            extract_images: true,
            timeout_ms: 30000,
        });

        expect(result.success).toBe(true);
        expect(result.images).toBeDefined();
        expect(Array.isArray(result.images)).toBe(true);
        expect(result.images).toEqual(["https://example.com/image1.jpg", "https://example.com/image2.png"]);
    });

    test("should set custom viewport size", async () => {
        const result = await web_fetch.execute({
            url: "https://httpbin.org/html",
            viewport_width: 800,
            viewport_height: 600,
            timeout_ms: 30000,
        });

        expect(result.success).toBe(true);
        expect(result.viewportWidth).toBe(800);
        expect(result.viewportHeight).toBe(600);
        expect(mockPage.setViewport).toHaveBeenCalledWith({
            width: 800,
            height: 600,
        });
    });

    test("should disable JavaScript when requested", async () => {
        const result = await web_fetch.execute({
            url: "https://httpbin.org/html",
            javascript_enabled: false,
            timeout_ms: 30000,
        });

        expect(result.success).toBe(true);
        expect(result.javascriptEnabled).toBe(false);
        expect(mockPage.setJavaScriptEnabled).toHaveBeenCalledWith(false);
    });

    test("should take screenshot when requested", async () => {
        const result = await web_fetch.execute({
            url: "https://httpbin.org/html",
            screenshot: true,
            timeout_ms: 30000,
        });

        expect(result.success).toBe(true);
        expect(result.screenshot).toBeDefined();
        expect(typeof result.screenshot).toBe("string");
        expect(result.screenshot!.length).toBeGreaterThan(0);
        // Should be base64 encoded
        expect(result.screenshot).toMatch(/^[A-Za-z0-9+/=]+$/);
        expect(mockPage.screenshot).toHaveBeenCalledWith({
            type: "png",
            fullPage: true,
        });
    });

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

        expect(result.success).toBe(true);
        expect(mockPage.setCookie).toHaveBeenCalledWith({
            name: "test_cookie",
            value: "test_value",
            domain: "httpbin.org",
        });
    });

    test("should wait for selector when provided", async () => {
        const result = await web_fetch.execute({
            url: "https://httpbin.org/html",
            wait_for_selector: "body",
            timeout_ms: 30000,
        });

        expect(result.success).toBe(true);
        expect(result.content).toBeDefined();
        expect(mockPage.waitForSelector).toHaveBeenCalledWith("body", { timeout: 30000 });
    });

    test("should handle network errors gracefully", async () => {
        // Mock page.goto to throw a network error
        mockPage.goto.mockRejectedValue(new Error("net::ERR_NAME_NOT_RESOLVED"));

        const result = await web_fetch.execute({
            url: "https://this-domain-should-not-exist-12345.com",
            timeout_ms: 5000,
        });

        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
    });

    test("should work with custom user agent", async () => {
        const result = await web_fetch.execute({
            url: "https://httpbin.org/user-agent",
            user_agent: "Custom-Agent/1.0",
            timeout_ms: 30000,
        });

        expect(result.success).toBe(true);
        expect(mockPage.setUserAgent).toHaveBeenCalledWith("Custom-Agent/1.0");
    });

    test("should work with resource blocking", async () => {
        const result = await web_fetch.execute({
            url: "https://httpbin.org/html",
            block_images: true,
            block_css: true,
            timeout_ms: 30000,
        });

        expect(result.success).toBe(true);
        expect(result.content).toBeDefined();
        expect(mockPage.setRequestInterception).toHaveBeenCalledWith(true);
        expect(mockPage.on).toHaveBeenCalledWith("request", expect.any(Function));
    });
});