import type { ToolImplementation } from "../types";

/**
 * Maximum response size in bytes (5MB default)
 */
const MAX_RESPONSE_BYTES_DEFAULT = 5_000_000;

/**
 * Default timeout in milliseconds (30 seconds)
 */
const TIMEOUT_MS_DEFAULT = 30_000;

/**
 * Maximum number of redirects to follow
 */
const MAX_REDIRECTS_DEFAULT = 5;

/**
 * API fetch tool - performs HTTP requests with security and resource limits
 */
export const api_fetch: ToolImplementation = {
    definition: {
        type: "function",
        function: {
            name: "api_fetch",
            description: "Fetch content from a web URL with HTTP methods, headers, timeout, and response size limits. Supports GET, POST, PUT, DELETE, PATCH methods.",
            parameters: {
                type: "object",
                properties: {
                    url: {
                        type: "string",
                        description: "The URL to fetch content from (must be http:// or https://)",
                    },
                    method: {
                        type: "string",
                        description: "HTTP method to use",
                        enum: ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"],
                    },
                    headers: {
                        type: "string",
                        description: "HTTP headers as JSON object (e.g., '{\"Content-Type\":\"application/json\",\"Authorization\":\"Bearer token\"}')",
                    },
                    body: {
                        type: "string",
                        description: "Request body data (for POST, PUT, PATCH methods)",
                    },
                    timeout_ms: {
                        type: "number",
                        description: "Request timeout in milliseconds (default 30000)",
                    },
                    max_response_bytes: {
                        type: "number",
                        description: "Maximum response size in bytes (default 5MB)",
                    },
                    follow_redirects: {
                        type: "boolean",
                        description: "Whether to follow HTTP redirects (default true)",
                    },
                },
                required: ["url"],
            },
        },
    },
    execute: async (args: Record<string, any>) => {
        const url = String(args.url || "").trim();
        const method = String(args.method || "GET").toUpperCase();
        const timeoutMs = Number.isFinite(args.timeout_ms) ? Number(args.timeout_ms) : TIMEOUT_MS_DEFAULT;
        const maxBytes = Number.isFinite(args.max_response_bytes) ? Number(args.max_response_bytes) : MAX_RESPONSE_BYTES_DEFAULT;
        const followRedirects = args.follow_redirects !== false; // Default to true

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

        // Validate method
        const allowedMethods = ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"];
        if (!allowedMethods.includes(method)) {
            return {
                success: false,
                error: `HTTP method '${method}' is not allowed. Allowed methods: ${allowedMethods.join(", ")}`,
                method,
            };
        }

        // Parse headers
        let headers: Record<string, string> = {};
        if (args.headers) {
            try {
                const parsed = JSON.parse(String(args.headers));
                if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
                    headers = parsed;
                } else {
                    return {
                        success: false,
                        error: "headers must be a JSON object with string values",
                    };
                }
            } catch {
                return {
                    success: false,
                    error: "headers must be valid JSON object",
                };
            }
        }

        // Set default headers
        if (!headers["User-Agent"]) {
            headers["User-Agent"] = "AgentForce-ADK/1.0";
        }

        // Prepare request options
        const requestOptions: RequestInit = {
            method,
            headers,
            redirect: followRedirects ? "follow" : "manual",
        };

        // Add body for appropriate methods
        if (["POST", "PUT", "PATCH"].includes(method) && args.body) {
            requestOptions.body = String(args.body);
            
            // Set Content-Type if not provided and body looks like JSON
            if (!headers["Content-Type"] && !headers["content-type"]) {
                try {
                    JSON.parse(String(args.body));
                    headers["Content-Type"] = "application/json";
                } catch {
                    // Not JSON, leave Content-Type unset
                }
            }
        }

        // Create abort controller for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
        requestOptions.signal = controller.signal;

        try {
            const startTime = Date.now();
            const response = await fetch(url, requestOptions);
            clearTimeout(timeoutId);
            
            const responseTime = Date.now() - startTime;

            // Read response with size limit
            let content = "";
            let contentLength = 0;
            let truncated = false;

            if (response.body) {
                const reader = response.body.getReader();
                const decoder = new TextDecoder();

                try {
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;

                        contentLength += value.length;
                        if (contentLength > maxBytes) {
                            truncated = true;
                            // Read up to the limit
                            const remainingBytes = maxBytes - (contentLength - value.length);
                            if (remainingBytes > 0) {
                                const limitedChunk = value.slice(0, remainingBytes);
                                content += decoder.decode(limitedChunk, { stream: false });
                            }
                            break;
                        }

                        content += decoder.decode(value, { stream: true });
                    }
                } finally {
                    reader.releaseLock();
                }
            }

            // Collect response headers
            const responseHeaders: Record<string, string> = {};
            response.headers.forEach((value, key) => {
                responseHeaders[key] = value;
            });

            return {
                success: response.ok,
                status: response.status,
                statusText: response.statusText,
                url: response.url, // Final URL after redirects
                headers: responseHeaders,
                content,
                contentLength,
                truncated,
                responseTime,
                method,
                requestUrl: url,
            };
        } catch (error: any) {
            clearTimeout(timeoutId);
            
            if (error.name === "AbortError") {
                return {
                    success: false,
                    error: "Request timed out",
                    timedOut: true,
                    timeoutMs,
                    url,
                    method,
                };
            }

            return {
                success: false,
                error: error.message || "Network request failed",
                url,
                method,
                networkError: true,
            };
        }
    },
};
