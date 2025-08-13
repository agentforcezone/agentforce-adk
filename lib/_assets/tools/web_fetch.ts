import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import type { ToolImplementation } from "../../types";

// Add stealth plugin to avoid detection
puppeteer.use(StealthPlugin());

/**
 * Default timeout in milliseconds (60 seconds)
 */
const TIMEOUT_MS_DEFAULT = 60_000;

/**
 * Default wait time for page load in milliseconds (5 seconds)
 */
const WAIT_FOR_LOAD_MS_DEFAULT = 5_000;

/**
 * Web fetch tool using Puppeteer - performs web scraping with JavaScript rendering, stealth capabilities, and browser automation
 */
export const web_fetch: ToolImplementation = {
    definition: {
        type: "function",
        function: {
            name: "web_fetch",
            description: "Fetch content from a web page using Puppeteer with JavaScript rendering, stealth mode, and browser automation capabilities. Better for SPAs and dynamic content.",
            parameters: {
                type: "object",
                properties: {
                    url: {
                        type: "string",
                        description: "The URL to fetch content from (must be http:// or https://)",
                    },
                    wait_for_selector: {
                        type: "string",
                        description: "CSS selector to wait for before considering the page loaded",
                    },
                    wait_for_load_ms: {
                        type: "number",
                        description: "Time to wait for page load in milliseconds (default 5000)",
                    },
                    timeout_ms: {
                        type: "number",
                        description: "Browser timeout in milliseconds (default 60000)",
                    },
                    viewport_width: {
                        type: "number",
                        description: "Viewport width in pixels (default 1920)",
                    },
                    viewport_height: {
                        type: "number", 
                        description: "Viewport height in pixels (default 1080)",
                    },
                    user_agent: {
                        type: "string",
                        description: "Custom user agent string (optional)",
                    },
                    screenshot: {
                        type: "boolean",
                        description: "Take a screenshot of the page (default false)",
                    },
                    block_images: {
                        type: "boolean",
                        description: "Block image requests to improve performance (default false)",
                    },
                    block_css: {
                        type: "boolean",
                        description: "Block CSS requests to improve performance (default false)",
                    },
                    javascript_enabled: {
                        type: "boolean",
                        description: "Enable JavaScript execution (default true)",
                    },
                    extract_links: {
                        type: "boolean",
                        description: "Extract all links from the page (default false)",
                    },
                    extract_images: {
                        type: "boolean",
                        description: "Extract all image sources from the page (default false)",
                    },
                    cookies: {
                        type: "string",
                        description: "JSON array of cookie objects to set before loading the page",
                    },
                },
                required: ["url"],
            },
        },
    },
    execute: async (args: Record<string, any>) => {
        const url = String(args.url || "").trim();
        const waitForSelector = args.wait_for_selector ? String(args.wait_for_selector).trim() : null;
        const waitForLoadMs = Number.isFinite(args.wait_for_load_ms) ? Number(args.wait_for_load_ms) : WAIT_FOR_LOAD_MS_DEFAULT;
        const timeoutMs = Number.isFinite(args.timeout_ms) ? Number(args.timeout_ms) : TIMEOUT_MS_DEFAULT;
        const viewportWidth = Number.isFinite(args.viewport_width) ? Number(args.viewport_width) : 1920;
        const viewportHeight = Number.isFinite(args.viewport_height) ? Number(args.viewport_height) : 1080;
        const userAgent = args.user_agent ? String(args.user_agent) : null;
        const takeScreenshot = args.screenshot === true;
        const blockImages = args.block_images === true;
        const blockCss = args.block_css === true;
        const javascriptEnabled = args.javascript_enabled !== false; // Default to true
        const extractLinks = args.extract_links === true;
        const extractImages = args.extract_images === true;

        // Validate URL
        if (!url) {
            return {
                success: false,
                error: "URL is required and cannot be empty",
            };
        }

        let parsedUrl: URL;
        try {
            parsedUrl = new URL(url);
        } catch {
            return {
                success: false,
                error: "Invalid URL format",
                url,
            };
        }

        // Security: Only allow http and https protocols
        if (!["http:", "https:"].includes(parsedUrl.protocol)) {
            return {
                success: false,
                error: "Only HTTP and HTTPS protocols are allowed",
                url,
                protocol: parsedUrl.protocol,
            };
        }

        // Parse cookies if provided
        let cookies: any[] = [];
        if (args.cookies) {
            try {
                const parsed = JSON.parse(String(args.cookies));
                if (Array.isArray(parsed)) {
                    cookies = parsed;
                } else {
                    return {
                        success: false,
                        error: "cookies must be a JSON array of cookie objects",
                    };
                }
            } catch {
                return {
                    success: false,
                    error: "cookies must be valid JSON array",
                };
            }
        }

        let browser;
        let page;
        
        try {
            const startTime = Date.now();
            
            // Launch browser with stealth mode
            browser = await puppeteer.launch({
                headless: true,
                args: [
                    "--no-sandbox",
                    "--disable-setuid-sandbox",
                    "--disable-dev-shm-usage",
                    "--disable-accelerated-2d-canvas",
                    "--no-first-run",
                    "--no-zygote",
                    "--disable-gpu",
                ],
                timeout: timeoutMs,
            });

            page = await browser.newPage();

            // Set viewport
            await page.setViewport({
                width: viewportWidth,
                height: viewportHeight,
            });

            // Set custom user agent if provided
            if (userAgent) {
                await page.setUserAgent(userAgent);
            }

            // Set cookies if provided
            if (cookies.length > 0) {
                for (const cookie of cookies) {
                    await page.setCookie(cookie);
                }
            }

            // Enable/disable JavaScript
            await page.setJavaScriptEnabled(javascriptEnabled);

            // Block resources if requested
            if (blockImages || blockCss) {
                await page.setRequestInterception(true);
                page.on("request", (request) => {
                    const resourceType = request.resourceType();
                    if (blockImages && resourceType === "image") {
                        request.abort();
                    } else if (blockCss && resourceType === "stylesheet") {
                        request.abort();
                    } else {
                        request.continue();
                    }
                });
            }

            // Navigate to URL
            const response = await page.goto(url, {
                waitUntil: "networkidle2",
                timeout: timeoutMs,
            });

            // Wait for specific selector if provided
            if (waitForSelector) {
                await page.waitForSelector(waitForSelector, { timeout: timeoutMs });
            } else if (waitForLoadMs > 0) {
                // Wait for additional load time
                await new Promise(resolve => setTimeout(resolve, waitForLoadMs));
            }

            // Extract content
            const content = await page.evaluate(() => {
                // Remove script and style tags for cleaner content
                const scripts = (globalThis as any).document.querySelectorAll("script, style");
                scripts.forEach((el: any) => el.remove());
                
                const doc = (globalThis as any).document;
                return doc.body ? doc.body.innerText || doc.body.textContent || "" : "";
            });

            // Extract HTML if needed
            const html = await page.content();

            // Extract links if requested
            let links: string[] = [];
            if (extractLinks) {
                links = await page.evaluate(() => {
                    const doc = (globalThis as any).document;
                    const linkElements = Array.from(doc.querySelectorAll("a[href]"));
                    return linkElements.map((link: any) => link.href);
                });
            }

            // Extract images if requested
            let images: string[] = [];
            if (extractImages) {
                images = await page.evaluate(() => {
                    const doc = (globalThis as any).document;
                    const imgElements = Array.from(doc.querySelectorAll("img[src]"));
                    return imgElements.map((img: any) => img.src);
                });
            }

            // Take screenshot if requested
            let screenshot: string | null = null;
            if (takeScreenshot) {
                const screenshotBuffer = await page.screenshot({ 
                    type: "png",
                    fullPage: true, 
                });
                screenshot = Buffer.from(screenshotBuffer).toString("base64");
            }

            // Get page title
            const title = await page.title();

            // Get final URL (after redirects)
            const finalUrl = page.url();

            const responseTime = Date.now() - startTime;

            return {
                success: true,
                url: finalUrl,
                requestUrl: url,
                title,
                content,
                html,
                contentLength: content.length,
                htmlLength: html.length,
                links: extractLinks ? links : undefined,
                images: extractImages ? images : undefined,
                screenshot: takeScreenshot ? screenshot : undefined,
                responseTime,
                statusCode: response?.status(),
                statusText: response?.statusText(),
                javascriptEnabled,
                viewportWidth,
                viewportHeight,
            };

        } catch (error: any) {
            return {
                success: false,
                error: error.message || "Browser automation failed",
                url,
                timeout: error.name === "TimeoutError",
                timeoutMs,
            };
        } finally {
            // Always close browser and page
            try {
                if (page) await page.close();
                if (browser) await browser.close();
            } catch {
                // Ignore cleanup errors
            }
        }
    },
};