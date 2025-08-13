import { describe, expect, test, beforeEach, jest } from "@jest/globals";

// Import the functions to test
import { validateHttpMethod, normalizePath } from "../../../lib/server/handler/validationHandler";

describe("Validation Handler Tests", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("validateHttpMethod", () => {
        test("should validate valid HTTP methods", () => {
            const validMethods = ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"];
            
            validMethods.forEach(method => {
                expect(validateHttpMethod(method)).toBe(method);
                expect(validateHttpMethod(method.toLowerCase())).toBe(method);
            });
        });

        test("should normalize method to uppercase", () => {
            expect(validateHttpMethod("get")).toBe("GET");
            expect(validateHttpMethod("post")).toBe("POST");
            expect(validateHttpMethod("Put")).toBe("PUT");
            expect(validateHttpMethod("delete")).toBe("DELETE");
            expect(validateHttpMethod("patch")).toBe("PATCH");
            expect(validateHttpMethod("head")).toBe("HEAD");
            expect(validateHttpMethod("options")).toBe("OPTIONS");
        });

        test("should reject invalid methods", () => {
            const invalidMethods = ["INVALID", "TRACE", "CONNECT"];
            
            invalidMethods.forEach(method => {
                expect(() => validateHttpMethod(method)).toThrow("Invalid HTTP method");
            });
        });

        test("should reject non-string methods", () => {
            expect(() => validateHttpMethod(null as any)).toThrow("HTTP method must be a non-empty string");
            expect(() => validateHttpMethod(undefined as any)).toThrow("HTTP method must be a non-empty string");
            expect(() => validateHttpMethod(123 as any)).toThrow("HTTP method must be a non-empty string");
            expect(() => validateHttpMethod([] as any)).toThrow("HTTP method must be a non-empty string");
            expect(() => validateHttpMethod({} as any)).toThrow("HTTP method must be a non-empty string");
        });

        test("should reject empty string", () => {
            expect(() => validateHttpMethod("")).toThrow("HTTP method must be a non-empty string");
        });

        test("should include valid methods in error message", () => {
            try {
                validateHttpMethod("INVALID");
            } catch (error) {
                expect((error as Error).message).toContain("GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS");
                expect((error as Error).message).toContain("INVALID");
            }
        });

        test("should handle mixed case methods", () => {
            expect(validateHttpMethod("GeT")).toBe("GET");
            expect(validateHttpMethod("pOsT")).toBe("POST");
            expect(validateHttpMethod("PuT")).toBe("PUT");
        });

        test("should handle methods with whitespace", () => {
            expect(() => validateHttpMethod("GET ")).toThrow("Invalid HTTP method");
            expect(() => validateHttpMethod(" GET")).toThrow("Invalid HTTP method");
            expect(() => validateHttpMethod("G ET")).toThrow("Invalid HTTP method");
        });

        test("should handle boolean inputs", () => {
            expect(() => validateHttpMethod(true as any)).toThrow("HTTP method must be a non-empty string");
            expect(() => validateHttpMethod(false as any)).toThrow("HTTP method must be a non-empty string");
        });

        test("should handle function inputs", () => {
            const fn = () => {};
            expect(() => validateHttpMethod(fn as any)).toThrow("HTTP method must be a non-empty string");
        });

        test("should handle symbol inputs", () => {
            const sym = Symbol("test");
            expect(() => validateHttpMethod(sym as any)).toThrow("HTTP method must be a non-empty string");
        });

        test("should provide clear error messages for invalid methods", () => {
            try {
                validateHttpMethod("INVALID_METHOD");
            } catch (error) {
                expect((error as Error).message).toContain("Invalid HTTP method: INVALID_METHOD");
                expect((error as Error).message).toContain("Valid methods are:");
            }
        });

        test("should provide clear error messages for non-string inputs", () => {
            try {
                validateHttpMethod(null as any);
            } catch (error) {
                expect((error as Error).message).toBe("HTTP method must be a non-empty string");
            }
        });

        test("should handle case sensitivity consistently", () => {
            const caseSensitiveTests = [
                { input: "get", expected: "GET" },
                { input: "GET", expected: "GET" },
                { input: "Get", expected: "GET" },
                { input: "gET", expected: "GET" },
                { input: "post", expected: "POST" },
                { input: "POST", expected: "POST" },
                { input: "Post", expected: "POST" },
                { input: "pOSt", expected: "POST" }
            ];

            caseSensitiveTests.forEach(({ input, expected }) => {
                expect(validateHttpMethod(input)).toBe(expected);
            });
        });
    });

    describe("normalizePath", () => {
        test("should add leading slash to paths without one", () => {
            expect(normalizePath("path")).toBe("/path");
            expect(normalizePath("api/users")).toBe("/api/users");
            expect(normalizePath("deeply/nested/path")).toBe("/deeply/nested/path");
            expect(normalizePath("simple")).toBe("/simple");
        });

        test("should preserve paths that already have leading slash", () => {
            expect(normalizePath("/path")).toBe("/path");
            expect(normalizePath("/api/users")).toBe("/api/users");
            expect(normalizePath("/")).toBe("/");
            expect(normalizePath("/simple")).toBe("/simple");
        });

        test("should reject non-string paths", () => {
            expect(() => normalizePath(null as any)).toThrow("Route path must be a non-empty string");
            expect(() => normalizePath(undefined as any)).toThrow("Route path must be a non-empty string");
            expect(() => normalizePath(123 as any)).toThrow("Route path must be a non-empty string");
            expect(() => normalizePath([] as any)).toThrow("Route path must be a non-empty string");
            expect(() => normalizePath({} as any)).toThrow("Route path must be a non-empty string");
        });

        test("should reject empty string", () => {
            expect(() => normalizePath("")).toThrow("Route path must be a non-empty string");
        });

        test("should handle special characters in paths", () => {
            expect(normalizePath("path-with-dashes")).toBe("/path-with-dashes");
            expect(normalizePath("path_with_underscores")).toBe("/path_with_underscores");
            expect(normalizePath("path.with.dots")).toBe("/path.with.dots");
            expect(normalizePath("path@with@symbols")).toBe("/path@with@symbols");
            expect(normalizePath("path+with+plus")).toBe("/path+with+plus");
        });

        test("should handle whitespace paths", () => {
            expect(normalizePath("   ")).toBe("/   "); // Whitespace is technically non-empty
            expect(normalizePath("path with spaces")).toBe("/path with spaces");
            expect(normalizePath("  path  ")).toBe("/  path  ");
        });

        test("should handle query parameters and fragments", () => {
            expect(normalizePath("path?query=value")).toBe("/path?query=value");
            expect(normalizePath("path#fragment")).toBe("/path#fragment");
            expect(normalizePath("path?query=value#fragment")).toBe("/path?query=value#fragment");
        });

        test("should handle complex nested paths", () => {
            expect(normalizePath("api/v1/users/123/posts")).toBe("/api/v1/users/123/posts");
            expect(normalizePath("very/deeply/nested/path/structure")).toBe("/very/deeply/nested/path/structure");
        });

        test("should handle paths with multiple slashes", () => {
            expect(normalizePath("//double-slash")).toBe("//double-slash"); // Already starts with /
            expect(normalizePath("path//with//double")).toBe("/path//with//double");
        });

        test("should handle boolean inputs", () => {
            expect(() => normalizePath(true as any)).toThrow("Route path must be a non-empty string");
            expect(() => normalizePath(false as any)).toThrow("Route path must be a non-empty string");
        });

        test("should handle function inputs", () => {
            const fn = () => {};
            expect(() => normalizePath(fn as any)).toThrow("Route path must be a non-empty string");
        });

        test("should handle symbol inputs", () => {
            const sym = Symbol("test");
            expect(() => normalizePath(sym as any)).toThrow("Route path must be a non-empty string");
        });

        test("should provide clear error messages", () => {
            try {
                normalizePath(null as any);
            } catch (error) {
                expect((error as Error).message).toBe("Route path must be a non-empty string");
            }
        });

        test("should handle various path formats", () => {
            const pathTests = [
                { input: "simple", expected: "/simple" },
                { input: "/already-slash", expected: "/already-slash" },
                { input: "api/v1", expected: "/api/v1" },
                { input: "/api/v1", expected: "/api/v1" },
                { input: "users/123", expected: "/users/123" },
                { input: "/users/123", expected: "/users/123" }
            ];

            pathTests.forEach(({ input, expected }) => {
                expect(normalizePath(input)).toBe(expected);
            });
        });

        test("should handle Unicode characters in paths", () => {
            expect(normalizePath("café")).toBe("/café");
            expect(normalizePath("用户")).toBe("/用户");
            expect(normalizePath("🚀/rocket")).toBe("/🚀/rocket");
        });

        test("should handle percent-encoded paths", () => {
            expect(normalizePath("path%20with%20spaces")).toBe("/path%20with%20spaces");
            expect(normalizePath("file%2Ename")).toBe("/file%2Ename");
        });

        test("should handle extremely long paths", () => {
            const longSegment = "a".repeat(100);
            const longPath = Array(10).fill(longSegment).join("/");
            expect(normalizePath(longPath)).toBe(`/${longPath}`);
        });
    });

    describe("Integration Tests", () => {
        test("should work together for route processing", () => {
            // Test that the functions work together for typical use cases
            const method = validateHttpMethod("post");
            const path = normalizePath("api/users");
            
            expect(method).toBe("POST");
            expect(path).toBe("/api/users");
        });

        test("should handle edge cases together", () => {
            const method = validateHttpMethod("OPTIONS");
            const path = normalizePath("complex/path-with_special.chars");
            
            expect(method).toBe("OPTIONS");
            expect(path).toBe("/complex/path-with_special.chars");
        });

        test("should validate common HTTP operations", () => {
            const operations = [
                { method: "get", path: "users" },
                { method: "post", path: "users" },
                { method: "put", path: "users/123" },
                { method: "delete", path: "users/123" },
                { method: "patch", path: "users/123" }
            ];

            operations.forEach(({ method, path }) => {
                const normalizedMethod = validateHttpMethod(method);
                const normalizedPath = normalizePath(path);
                
                expect(normalizedMethod).toBe(method.toUpperCase());
                expect(normalizedPath).toBe(`/${path}`);
            });
        });

        test("should handle API versioning patterns", () => {
            const apiPaths = [
                "v1/users",
                "v2/posts", 
                "api/v1/auth",
                "api/v2/admin/users"
            ];

            apiPaths.forEach(path => {
                const normalized = normalizePath(path);
                expect(normalized).toBe(`/${path}`);
                expect(normalized.startsWith("/")).toBe(true);
            });
        });

        test("should handle RESTful resource patterns", () => {
            const restPatterns = [
                "users",
                "users/123",
                "users/123/posts",
                "users/123/posts/456",
                "posts/456/comments"
            ];

            restPatterns.forEach(pattern => {
                const path = normalizePath(pattern);
                expect(path).toBe(`/${pattern}`);
            });
        });

        test("should handle full HTTP request configurations", () => {
            const httpConfigs = [
                { method: "get", path: "/" },
                { method: "post", path: "api/auth/login" },
                { method: "put", path: "users/profile" },
                { method: "delete", path: "posts/123" },
                { method: "patch", path: "settings/preferences" },
                { method: "head", path: "health" },
                { method: "options", path: "api/info" }
            ];

            httpConfigs.forEach(({ method, path }) => {
                const validatedMethod = validateHttpMethod(method);
                const normalizedPath = normalizePath(path);
                
                expect(typeof validatedMethod).toBe("string");
                expect(validatedMethod).toBe(method.toUpperCase());
                expect(typeof normalizedPath).toBe("string");
                expect(normalizedPath.startsWith("/")).toBe(true);
            });
        });

        test("should maintain consistency across multiple calls", () => {
            // Test that multiple calls with same input return same result
            const testMethod = "post";
            const testPath = "api/users";

            for (let i = 0; i < 10; i++) {
                expect(validateHttpMethod(testMethod)).toBe("POST");
                expect(normalizePath(testPath)).toBe("/api/users");
            }
        });

        test("should handle parallel processing scenarios", () => {
            const testData = [
                { method: "get", path: "users" },
                { method: "post", path: "users" },
                { method: "put", path: "users/123" }
            ];

            // Simulate parallel processing
            const results = testData.map(({ method, path }) => ({
                method: validateHttpMethod(method),
                path: normalizePath(path)
            }));

            expect(results).toEqual([
                { method: "GET", path: "/users" },
                { method: "POST", path: "/users" },
                { method: "PUT", path: "/users/123" }
            ]);
        });
    });

    describe("Performance and Edge Cases", () => {
        test("should handle rapid successive calls", () => {
            const iterations = 1000;
            
            for (let i = 0; i < iterations; i++) {
                expect(validateHttpMethod("GET")).toBe("GET");
                expect(normalizePath("path")).toBe("/path");
            }
        });

        test("should handle memory pressure scenarios", () => {
            const largePath = "segment/".repeat(100) + "end";
            expect(normalizePath(largePath)).toBe(`/${largePath}`);
            
            const allMethods = ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"];
            allMethods.forEach(method => {
                expect(validateHttpMethod(method.toLowerCase())).toBe(method);
            });
        });

        test("should maintain thread safety", () => {
            // These functions should be stateless and thread-safe
            const promises = Array.from({ length: 100 }, (_, i) => 
                Promise.resolve({
                    method: validateHttpMethod("get"),
                    path: normalizePath(`path${i}`)
                })
            );

            return Promise.all(promises).then(results => {
                results.forEach((result, index) => {
                    expect(result.method).toBe("GET");
                    expect(result.path).toBe(`/path${index}`);
                });
            });
        });
    });
});