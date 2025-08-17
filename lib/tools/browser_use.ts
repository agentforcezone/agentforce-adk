import type { ToolImplementation } from "../types";
import puppeteer from "puppeteer";
import type { Browser, Page } from "puppeteer";
import { spawn } from "child_process";
import { existsSync } from "fs";
import { platform } from "os";

/**
 * Browser action types
 */
type BrowserAction = 
    | "navigate"
    | "click"
    | "type"
    | "extract"
    | "screenshot"
    | "evaluate"
    | "wait"
    | "scroll"
    | "hover"
    | "select"
    | "press"
    | "get_cookies"
    | "set_cookie"
    | "disconnect"
    | "close";

/**
 * Browser information
 */
type BrowserInfo = {
    name: string;
    command: string;
    found: boolean;
};

/**
 * Browser detection and startup utilities
 */
class BrowserDetector {
    /**
     * Detect OS platform
     */
    static getOS(): string {
        const os = platform();
        return os;
    }

    /**
     * Get browser candidates based on OS
     */
    static getBrowserCandidates(): BrowserInfo[] {
        const os = this.getOS();
        const browsers: BrowserInfo[] = [];

        switch (os) {
            case "darwin": // macOS
                browsers.push(
                    { name: "Brave (macOS)", command: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser", found: false },
                    { name: "Chrome (macOS)", command: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", found: false },
                    { name: "Chromium (macOS)", command: "/Applications/Chromium.app/Contents/MacOS/Chromium", found: false },
                );
                break;
            case "win32": // Windows
                browsers.push(
                    { name: "Brave (Windows)", command: "brave", found: false },
                    { name: "Chrome (Windows)", command: "chrome", found: false },
                    { name: "Chromium (Windows)", command: "chromium", found: false },
                );
                break;
            default: // Linux and others
                browsers.push(
                    { name: "Brave", command: "brave", found: false },
                    { name: "Chrome", command: "google-chrome", found: false },
                    { name: "Chromium", command: "chromium", found: false },
                    { name: "Chromium Browser", command: "chromium-browser", found: false },
                );
        }

        return browsers;
    }

    /**
     * Detect available browsers
     */
    static async detectBrowsers(): Promise<BrowserInfo[]> {
        const candidates = this.getBrowserCandidates();
        const os = this.getOS();

        for (const browser of candidates) {
            try {
                if (os === "darwin" && browser.command.startsWith("/Applications")) {
                    // macOS: Check if app bundle exists
                    browser.found = existsSync(browser.command);
                } else {
                    // Other platforms: Check if command is available in PATH
                    const process = spawn("which", [browser.command], { stdio: "pipe" });
                    browser.found = await new Promise((resolve) => {
                        process.on("close", (code) => resolve(code === 0));
                    });
                }
            } catch {
                browser.found = false;
            }
        }

        return candidates.filter(b => b.found);
    }

    /**
     * Start browser with remote debugging
     */
    static async startBrowser(browserCommand: string, port: number): Promise<boolean> {
        return new Promise((resolve) => {
            const tempDir = `/tmp/browser-adk-${Date.now()}`;
            console.log(`🚀 Starting browser: ${browserCommand.split("/").pop()} on port ${port}`);
            
            const args = [
                `--remote-debugging-port=${port}`,
                `--user-data-dir=${tempDir}`,
                "--no-first-run",
                "--no-default-browser-check",
                "--disable-default-apps",
                //`--disable-extensions`,
                //`--disable-plugins`,
                "--disable-translate",
                "--disable-background-timer-throttling",
                "--disable-renderer-backgrounding",
                "--disable-backgrounding-occluded-windows",
                "--disable-component-extensions-with-background-pages",
                "--new-window",
            ];
            
            const browser = spawn(browserCommand, args, {
                stdio: "pipe",
                detached: true,
            });

            browser.unref();

            // Give browser time to start
            setTimeout(() => {
                console.log(`✅ Browser ready on port ${port}`);
                resolve(true);
            }, 4000);

            browser.on("error", (error) => {
                console.error(`❌ Failed to start browser: ${error.message}`);
                resolve(false);
            });

            browser.stderr?.on("data", (data) => {
                const stderr = data.toString();
                if (stderr.includes("ERROR") || stderr.includes("FATAL")) {
                    console.error(`Browser stderr: ${stderr}`);
                }
            });
        });
    }

    /**
     * Check if browser is running on port
     */
    static async isBrowserRunning(port: number): Promise<boolean> {
        try {
            const response = await fetch(`http://localhost:${port}/json/version`);
            return response.ok;
        } catch {
            return false;
        }
    }
}

/**
 * Browser instance manager with auto-startup
 */
class BrowserManager {
    private static browser: Browser | null = null;
    private static currentPage: Page | null = null;
    private static connectionPort: number = 9080; // Use dedicated port for agents
    private static sessionActive: boolean = false; // Track if we're in an active session
    private static lastActivity: number = 0; // Track last activity timestamp

    /**
     * Connect to browser instance via CDP with automatic startup
     */
    static async connect(port: number = 9080): Promise<{ browser: Browser; page: Page }> {
        try {
            // Update activity timestamp
            this.lastActivity = Date.now();
            
            // Check if already connected to the same port and connection is healthy
            if (this.browser && this.connectionPort === port && this.sessionActive) {
                try {
                    // Test connection health with a simple operation
                    const pages = await this.browser.pages();
                    if (pages.length > 0) {
                        this.currentPage = pages[0];
                    } else {
                        this.currentPage = await this.browser.newPage();
                    }
                    // Connection is healthy, reuse it
                    return { browser: this.browser, page: this.currentPage };
                } catch (connectionError) {
                    // Connection is stale, reset and reconnect
                    console.log("🔄 Existing connection stale, reconnecting...");
                    this.browser = null;
                    this.currentPage = null;
                    this.sessionActive = false;
                }
            }

            this.connectionPort = port;
            
            // Try to connect to existing browser
            try {
                this.browser = await puppeteer.connect({
                    browserURL: `http://localhost:${port}`,
                    defaultViewport: null,
                });

                const pages = await this.browser.pages();
                if (pages.length > 0) {
                    this.currentPage = pages[0];
                } else {
                    this.currentPage = await this.browser.newPage();
                }

                console.log(`🔌 Connected to existing browser on port ${port}`);
                this.sessionActive = true; // Mark session as active
                return { browser: this.browser, page: this.currentPage };
            } catch (connectionError) {
                // No browser running, try to start one
                console.log(`🔍 No browser found on port ${port}, attempting auto-startup...`);
                
                const isRunning = await BrowserDetector.isBrowserRunning(port);
                if (isRunning) {
                    throw new Error(`Browser appears to be running on port ${port} but connection failed: ${connectionError}`);
                }

                // Detect available browsers
                const availableBrowsers = await BrowserDetector.detectBrowsers();
                if (availableBrowsers.length === 0) {
                    throw new Error("No supported browsers found. Please install Chrome, Brave, or Chromium and try again.");
                }

                // Start the first available browser
                const selectedBrowser = availableBrowsers[0];
                console.log(`🎯 Starting ${selectedBrowser.name}...`);
                
                const started = await BrowserDetector.startBrowser(selectedBrowser.command, port);
                if (!started) {
                    throw new Error(`Failed to start ${selectedBrowser.name}. Please start it manually with: ${selectedBrowser.command} --remote-debugging-port=${port}`);
                }

                // Wait a moment for browser to fully initialize
                await new Promise(resolve => setTimeout(resolve, 1000));

                // Try connecting again
                this.browser = await puppeteer.connect({
                    browserURL: `http://localhost:${port}`,
                    defaultViewport: null,
                });

                const pages = await this.browser.pages();
                if (pages.length > 0) {
                    this.currentPage = pages[0];
                } else {
                    this.currentPage = await this.browser.newPage();
                }

                console.log(`✅ Successfully started and connected to ${selectedBrowser.name} on port ${port}`);
                this.sessionActive = true; // Mark session as active
                return { browser: this.browser, page: this.currentPage };
            }
        } catch (error: any) {
            throw new Error(`Browser connection failed: ${error.message}`);
        }
    }

    /**
     * Get current page or create new one
     */
    static async getPage(port: number = 9080): Promise<Page> {
        const { page } = await this.connect(port);
        return page;
    }

    /**
     * Disconnect from browser (keeps browser running, just disconnects)
     */
    static async disconnect(): Promise<void> {
        if (this.browser) {
            await this.browser.disconnect();
            this.browser = null;
            this.currentPage = null;
            this.sessionActive = false;
            console.log("🔌 Disconnected from browser (browser still running)");
        }
    }

    /**
     * Close browser instance (kills the browser process)
     */
    static async close(): Promise<void> {
        if (this.browser) {
            try {
                await this.browser.close();
                console.log("🛑 Browser process terminated");
            } catch (error) {
                console.log(`⚠️  Browser close warning: ${error instanceof Error ? error.message : "Unknown error"}`);
            }
            this.browser = null;
            this.currentPage = null;
            this.sessionActive = false;
        }
    }
    
    /**
     * Check if browser session is active and healthy
     */
    static isSessionActive(): boolean {
        return this.sessionActive && this.browser !== null;
    }
    
    /**
     * Get session info for debugging
     */
    static getSessionInfo(): { active: boolean; port: number; lastActivity: number } {
        return {
            active: this.sessionActive,
            port: this.connectionPort,
            lastActivity: this.lastActivity,
        };
    }
}

/**
 * Browser control tool using Chrome DevTools Protocol
 * Automatically detects, starts, and connects to browser instances with remote debugging
 */
export const browser_use: ToolImplementation = {
    definition: {
        type: "function",
        function: {
            name: "browser_use",
            description: "Control a browser instance via Chrome DevTools Protocol. Automatically detects and starts Chrome/Brave/Chromium browsers if not running. Maintains session persistence between tool calls until explicitly closed. Supports navigation, interaction, and content extraction from web pages.",
            parameters: {
                type: "object",
                properties: {
                    action: {
                        type: "string",
                        description: "The browser action to perform",
                        enum: ["navigate", "click", "type", "extract", "screenshot", "evaluate", "wait", "scroll", "hover", "select", "press", "get_cookies", "set_cookie", "disconnect", "close"],
                    },
                    url: {
                        type: "string",
                        description: "URL to navigate to (for navigate action)",
                    },
                    selector: {
                        type: "string",
                        description: "CSS selector for element interaction",
                    },
                    text: {
                        type: "string",
                        description: "Text to type or option to select",
                    },
                    script: {
                        type: "string",
                        description: "JavaScript code to evaluate in page context",
                    },
                    waitFor: {
                        type: "string",
                        description: "Selector or condition to wait for",
                    },
                    timeout: {
                        type: "number",
                        description: "Operation timeout in milliseconds (default 30000)",
                    },
                    port: {
                        type: "number",
                        description: "CDP port to connect to (default 9080)",
                    },
                    key: {
                        type: "string",
                        description: "Keyboard key to press (for press action)",
                    },
                    scrollX: {
                        type: "number",
                        description: "Horizontal scroll position in pixels",
                    },
                    scrollY: {
                        type: "number",
                        description: "Vertical scroll position in pixels",
                    },
                    extractType: {
                        type: "string",
                        description: "Type of content to extract: text, html, attribute, or value",
                        enum: ["text", "html", "attribute", "value"],
                    },
                    attributeName: {
                        type: "string",
                        description: "Name of attribute to extract (when extractType is 'attribute')",
                    },
                    screenshotType: {
                        type: "string",
                        description: "Screenshot type: fullpage or viewport",
                        enum: ["fullpage", "viewport"],
                    },
                    cookie: {
                        type: "string",
                        description: "Cookie data as JSON string for set_cookie action",
                    },
                },
                required: ["action"],
            },
        },
    },
    execute: async (args: Record<string, any>) => {
        const action = String(args.action || "").toLowerCase() as BrowserAction;
        const port = Number(args.port) || 9080;
        const timeout = Number(args.timeout) || 30000;

        try {
            const page = await BrowserManager.getPage(port);

            switch (action) {
                case "navigate": {
                    const url = String(args.url || "");
                    if (!url) {
                        return {
                            success: false,
                            error: "URL is required for navigate action",
                        };
                    }
                    
                    const response = await page.goto(url, {
                        waitUntil: "domcontentloaded",
                        timeout,
                    });
                    
                    return {
                        success: true,
                        action: "navigate",
                        url: page.url(),
                        status: response?.status(),
                        title: await page.title(),
                    };
                }

                case "click": {
                    const selector = String(args.selector || "");
                    if (!selector) {
                        return {
                            success: false,
                            error: "Selector is required for click action",
                        };
                    }

                    await page.waitForSelector(selector, { timeout });
                    await page.click(selector);

                    return {
                        success: true,
                        action: "click",
                        selector,
                        url: page.url(),
                    };
                }

                case "type": {
                    const selector = String(args.selector || "");
                    const text = String(args.text || "");
                    
                    if (!selector) {
                        return {
                            success: false,
                            error: "Selector is required for type action",
                        };
                    }

                    await page.waitForSelector(selector, { timeout });
                    await page.type(selector, text);

                    return {
                        success: true,
                        action: "type",
                        selector,
                        text: text.substring(0, 50) + (text.length > 50 ? "..." : ""),
                        url: page.url(),
                    };
                }

                case "extract": {
                    const selector = args.selector ? String(args.selector) : "body";
                    const extractType = String(args.extractType || "text");
                    const attributeName = String(args.attributeName || "");

                    await page.waitForSelector(selector, { timeout });

                    let content: any;
                    
                    switch (extractType) {
                        case "text":
                            content = await page.$eval(selector, el => el.textContent?.trim() || "");
                            break;
                        case "html":
                            content = await page.$eval(selector, el => el.innerHTML);
                            break;
                        case "attribute":
                            if (!attributeName) {
                                return {
                                    success: false,
                                    error: "attributeName is required when extractType is 'attribute'",
                                };
                            }
                            content = await page.$eval(selector, (el, attr) => el.getAttribute(attr), attributeName);
                            break;
                        case "value":
                            content = await page.$eval(selector, el => (el as HTMLInputElement).value || "");
                            break;
                        default:
                            content = await page.$eval(selector, el => el.textContent?.trim() || "");
                    }

                    return {
                        success: true,
                        action: "extract",
                        selector,
                        extractType,
                        content,
                        url: page.url(),
                    };
                }

                case "screenshot": {
                    const screenshotType = String(args.screenshotType || "viewport");
                    const selector = args.selector;

                    let screenshot: Buffer;
                    
                    if (selector) {
                        await page.waitForSelector(selector, { timeout });
                        const element = await page.$(selector);
                        if (!element) {
                            return {
                                success: false,
                                error: `Element not found: ${selector}`,
                            };
                        }
                        screenshot = await element.screenshot({ encoding: "base64" }) as unknown as Buffer;
                    } else {
                        screenshot = await page.screenshot({
                            fullPage: screenshotType === "fullpage",
                            encoding: "base64",
                        }) as unknown as Buffer;
                    }

                    return {
                        success: true,
                        action: "screenshot",
                        type: screenshotType,
                        screenshot: screenshot.toString(),
                        url: page.url(),
                    };
                }

                case "evaluate": {
                    const script = String(args.script || "");
                    if (!script) {
                        return {
                            success: false,
                            error: "Script is required for evaluate action",
                        };
                    }

                    const result = await page.evaluate((code) => {
                        try {
                            return eval(code);
                        } catch (error: any) {
                            return { error: error.message };
                        }
                    }, script);

                    return {
                        success: true,
                        action: "evaluate",
                        result,
                        url: page.url(),
                    };
                }

                case "wait": {
                    const waitFor = String(args.waitFor || "");
                    if (!waitFor) {
                        return {
                            success: false,
                            error: "waitFor selector or time is required",
                        };
                    }

                    if (/^\d+$/.test(waitFor)) {
                        await page.waitForTimeout(parseInt(waitFor));
                    } else {
                        await page.waitForSelector(waitFor, { timeout });
                    }

                    return {
                        success: true,
                        action: "wait",
                        waitFor,
                        url: page.url(),
                    };
                }

                case "scroll": {
                    const scrollX = Number(args.scrollX) || 0;
                    const scrollY = Number(args.scrollY) || 0;

                    await page.evaluate((x, y) => {
                        window.scrollTo(x, y);
                    }, scrollX, scrollY);

                    return {
                        success: true,
                        action: "scroll",
                        scrollX,
                        scrollY,
                        url: page.url(),
                    };
                }

                case "hover": {
                    const selector = String(args.selector || "");
                    if (!selector) {
                        return {
                            success: false,
                            error: "Selector is required for hover action",
                        };
                    }

                    await page.waitForSelector(selector, { timeout });
                    await page.hover(selector);

                    return {
                        success: true,
                        action: "hover",
                        selector,
                        url: page.url(),
                    };
                }

                case "select": {
                    const selector = String(args.selector || "");
                    const text = String(args.text || "");
                    
                    if (!selector) {
                        return {
                            success: false,
                            error: "Selector is required for select action",
                        };
                    }

                    await page.waitForSelector(selector, { timeout });
                    await page.select(selector, text);

                    return {
                        success: true,
                        action: "select",
                        selector,
                        value: text,
                        url: page.url(),
                    };
                }

                case "press": {
                    const key = String(args.key || "");
                    if (!key) {
                        return {
                            success: false,
                            error: "Key is required for press action",
                        };
                    }

                    await page.keyboard.press(key);

                    return {
                        success: true,
                        action: "press",
                        key,
                        url: page.url(),
                    };
                }

                case "get_cookies": {
                    const cookies = await page.cookies();
                    
                    return {
                        success: true,
                        action: "get_cookies",
                        cookies,
                        url: page.url(),
                    };
                }

                case "set_cookie": {
                    const cookieData = String(args.cookie || "");
                    if (!cookieData) {
                        return {
                            success: false,
                            error: "Cookie data is required for set_cookie action",
                        };
                    }

                    try {
                        const cookie = JSON.parse(cookieData);
                        await page.setCookie(cookie);
                        
                        return {
                            success: true,
                            action: "set_cookie",
                            cookie,
                            url: page.url(),
                        };
                    } catch (error: any) {
                        return {
                            success: false,
                            error: `Invalid cookie JSON: ${error.message}`,
                        };
                    }
                }

                case "disconnect": {
                    await BrowserManager.disconnect();
                    
                    return {
                        success: true,
                        action: "disconnect",
                        message: "Disconnected from browser (browser still running)",
                    };
                }
                
                case "close": {
                    await BrowserManager.close();
                    
                    return {
                        success: true,
                        action: "close",
                        message: "Browser closed successfully",
                    };
                }

                default:
                    return {
                        success: false,
                        error: `Unknown action: ${action}`,
                        availableActions: ["navigate", "click", "type", "extract", "screenshot", "evaluate", "wait", "scroll", "hover", "select", "press", "get_cookies", "set_cookie", "disconnect", "close"],
                    };
            }
        } catch (error: any) {
            return {
                success: false,
                error: error.message || "Browser operation failed",
                action,
                port,
            };
        }
    },
};