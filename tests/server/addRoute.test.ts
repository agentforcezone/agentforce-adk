import { describe, expect, test, beforeEach } from "bun:test";
import { AgentForceServer, type ServerConfig } from "../../lib/mod";

describe("AgentForceServer addRoute Method Tests", () => {
    let server: AgentForceServer;

    beforeEach(() => {
        const config: ServerConfig = {
            name: "TestServer"
        };
        server = new AgentForceServer(config);
    });

    test("should return server instance for method chaining", () => {
        const result = server.addRoute("GET", "/health", { status: "ok" });
        expect(result).toBe(server);
    });

    test("should add static route to server collection", () => {
        server.addRoute("GET", "/health", { status: "ok" });
        const staticRoutes = server.getStaticRoutes();
        
        expect(staticRoutes).toHaveLength(1);
        expect(staticRoutes[0]).toEqual({
            method: "GET",
            path: "/health",
            responseData: { status: "ok" },
        });
    });

    test("should normalize HTTP method to uppercase", () => {
        server.addRoute("get", "/status", { status: "running" });
        const staticRoutes = server.getStaticRoutes();
        
        expect(staticRoutes[0].method).toBe("GET");
    });

    test("should normalize path to start with slash", () => {
        server.addRoute("GET", "health", { status: "ok" });
        const staticRoutes = server.getStaticRoutes();
        
        expect(staticRoutes[0].path).toBe("/health");
    });

    test("should work with method chaining", () => {
        const result = server
            .addRoute("GET", "/health", { status: "ok" })
            .addRoute("GET", "/status", { status: "running" });
        
        expect(result).toBe(server);
        expect(server.getStaticRoutes()).toHaveLength(2);
    });

    test("should validate HTTP method parameter", () => {
        expect(() => server.addRoute("", "/health", { status: "ok" }))
            .toThrow("HTTP method must be a non-empty string");
        
        expect(() => server.addRoute("INVALID", "/health", { status: "ok" }))
            .toThrow("Invalid HTTP method: INVALID");
    });

    test("should validate path parameter", () => {
        expect(() => server.addRoute("GET", "", { status: "ok" }))
            .toThrow("Route path must be a non-empty string");
        
        expect(() => server.addRoute("GET", null as any, { status: "ok" }))
            .toThrow("Route path must be a non-empty string");
    });

    test("should validate response data parameter", () => {
        expect(() => server.addRoute("GET", "/health", undefined))
            .toThrow("Response data is required");
        
        expect(() => server.addRoute("GET", "/health", null))
            .toThrow("Response data is required");
    });

    test("should accept valid HTTP methods", () => {
        const validMethods = ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"];
        
        validMethods.forEach((method, index) => {
            expect(() => server.addRoute(method, `/test${index}`, { test: true }))
                .not.toThrow();
        });
        
        expect(server.getStaticRoutes()).toHaveLength(validMethods.length);
    });

    test("should accept object response data", () => {
        const responseData = { 
            message: "Hello World", 
            timestamp: "2024-01-01T00:00:00Z",
            data: { user: "test" }
        };
        
        server.addRoute("GET", "/api/data", responseData);
        const staticRoutes = server.getStaticRoutes();
        
        expect(staticRoutes[0].responseData).toEqual(responseData);
    });

    test("should accept function response data", () => {
        const responseFunction = () => ({ timestamp: new Date().toISOString() });
        
        server.addRoute("GET", "/api/time", responseFunction);
        const staticRoutes = server.getStaticRoutes();
        
        expect(typeof staticRoutes[0].responseData).toBe("function");
    });

    test("should accept primitive response data", () => {
        server.addRoute("GET", "/api/count", 42);
        const staticRoutes = server.getStaticRoutes();
        
        expect(staticRoutes[0].responseData).toBe(42);
    });

    test("should handle multiple static routes", () => {
        server
            .addRoute("GET", "/health", { status: "healthy" })
            .addRoute("POST", "/webhook", { received: true })
            .addRoute("GET", "/version", { version: "1.0.0" });
        
        const staticRoutes = server.getStaticRoutes();
        expect(staticRoutes).toHaveLength(3);
        
        expect(staticRoutes[0]).toEqual({
            method: "GET",
            path: "/health",
            responseData: { status: "healthy" },
        });
        
        expect(staticRoutes[1]).toEqual({
            method: "POST",
            path: "/webhook",
            responseData: { received: true },
        });
        
        expect(staticRoutes[2]).toEqual({
            method: "GET",
            path: "/version",
            responseData: { version: "1.0.0" },
        });
    });
});
