import { describe, expect, test, beforeEach, jest } from "@jest/globals";

// Mock the handlebars utility before importing the handler
const mockRenderTemplateFile = jest.fn();
jest.mock("../../../lib/utils/handlebars", () => ({
    renderTemplateFile: mockRenderTemplateFile
}));

// Import the function to test
import { createHtmlFileHandler } from "../../../lib/server/handler/htmlFileHandler";

describe("HTML File Handler Tests", () => {
    // Create mock Context object that matches Hono's interface
    let mockContext: any;

    beforeEach(() => {
        jest.clearAllMocks();

        // Create a comprehensive mock Context
        mockContext = {
            html: jest.fn().mockImplementation((content, status) => {
                return {
                    status: status || 200,
                    data: content,
                    headers: { "Content-Type": "text/html" }
                } as any;
            })
        };
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("createHtmlFileHandler - Basic Functionality", () => {
        test("should return a function", () => {
            const handler = createHtmlFileHandler("test.html");
            expect(typeof handler).toBe("function");
        });

        test("should return a function with template data", () => {
            const handler = createHtmlFileHandler("test.hbs", { name: "test" });
            expect(typeof handler).toBe("function");
        });

        test("should create handler that accepts Context parameter", () => {
            const handler = createHtmlFileHandler("test.html");
            // The handler should be a function that accepts a Context parameter
            expect(handler.length).toBe(1);
        });
    });

    describe("Handler Execution - Happy Path", () => {
        test("should serve HTML content successfully", async () => {
            // Arrange
            const filePath = "test.html";
            const templateData = { title: "Test Page" };
            const expectedContent = "<html><body><h1>Test Page</h1></body></html>";
            
            // @ts-ignore
            mockRenderTemplateFile.mockResolvedValue(expectedContent);
            const handler = createHtmlFileHandler(filePath, templateData);

            // Act
            const result = await handler(mockContext);

            // Assert
            expect(mockRenderTemplateFile).toHaveBeenCalledWith(filePath, templateData);
            expect(mockContext.html).toHaveBeenCalledWith(expectedContent);
            expect(result).toBeDefined();
        });

        test("should serve Handlebars template successfully", async () => {
            // Arrange
            const filePath = "template.hbs";
            const templateData = { name: "World", items: ["item1", "item2"] };
            const renderedContent = "<html><body><h1>Hello World</h1><ul><li>item1</li><li>item2</li></ul></body></html>";
            
            // @ts-ignore
            mockRenderTemplateFile.mockResolvedValue(renderedContent);
            const handler = createHtmlFileHandler(filePath, templateData);

            // Act
            await handler(mockContext);

            // Assert
            expect(mockRenderTemplateFile).toHaveBeenCalledWith(filePath, templateData);
            expect(mockContext.html).toHaveBeenCalledWith(renderedContent);
        });

        test("should handle file without template data", async () => {
            // Arrange
            const filePath = "static.html";
            const staticContent = "<html><body><h1>Static Content</h1></body></html>";
            
            // @ts-ignore
            mockRenderTemplateFile.mockResolvedValue(staticContent);
            const handler = createHtmlFileHandler(filePath);

            // Act
            await handler(mockContext);

            // Assert
            expect(mockRenderTemplateFile).toHaveBeenCalledWith(filePath, undefined);
            expect(mockContext.html).toHaveBeenCalledWith(staticContent);
        });

        test("should handle empty template data", async () => {
            // Arrange
            const filePath = "template.hbs";
            const templateData = {};
            const renderedContent = "<html><body><h1>Empty Data</h1></body></html>";
            
            // @ts-ignore
            mockRenderTemplateFile.mockResolvedValue(renderedContent);
            const handler = createHtmlFileHandler(filePath, templateData);

            // Act
            await handler(mockContext);

            // Assert
            expect(mockRenderTemplateFile).toHaveBeenCalledWith(filePath, templateData);
            expect(mockContext.html).toHaveBeenCalledWith(renderedContent);
        });

        test("should handle complex template data", async () => {
            // Arrange
            const filePath = "complex.hbs";
            const templateData = {
                user: { name: "John", email: "john@example.com" },
                settings: { theme: "dark", notifications: true },
                items: [
                    { id: 1, name: "Item 1", active: true },
                    { id: 2, name: "Item 2", active: false }
                ]
            };
            const complexContent = "<html><body><h1>Hello John</h1><div>Theme: dark</div></body></html>";
            
            // @ts-ignore
            mockRenderTemplateFile.mockResolvedValue(complexContent);
            const handler = createHtmlFileHandler(filePath, templateData);

            // Act
            await handler(mockContext);

            // Assert
            expect(mockRenderTemplateFile).toHaveBeenCalledWith(filePath, templateData);
            expect(mockContext.html).toHaveBeenCalledWith(complexContent);
        });

        test("should handle different file extensions", async () => {
            const testCases = [
                { path: "page.html", content: "<html>Static HTML</html>" },
                { path: "template.hbs", content: "<html>Handlebars Template</html>" },
                { path: "page.htm", content: "<html>HTM File</html>" },
                { path: "doc.xhtml", content: "<html>XHTML File</html>" }
            ];

            for (const testCase of testCases) {
                // Reset mocks for each iteration
                jest.clearAllMocks();
                
                // @ts-ignore
                mockRenderTemplateFile.mockResolvedValue(testCase.content);
                const handler = createHtmlFileHandler(testCase.path);

                await handler(mockContext);

                expect(mockRenderTemplateFile).toHaveBeenCalledWith(testCase.path, undefined);
                expect(mockContext.html).toHaveBeenCalledWith(testCase.content);
            }
        });
    });

    describe("Handler Execution - Error Handling", () => {
        test("should handle file not found errors (ENOENT)", async () => {
            // Arrange
            const filePath = "nonexistent.html";
            const enoentError = new Error("ENOENT: no such file or directory");
            
            // @ts-ignore
            mockRenderTemplateFile.mockRejectedValue(enoentError);
            const handler = createHtmlFileHandler(filePath);

            // Act
            await handler(mockContext);

            // Assert
            expect(mockRenderTemplateFile).toHaveBeenCalledWith(filePath, undefined);
            expect(mockContext.html).toHaveBeenCalledWith(`
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>File Not Found</title>
                    </head>
                    <body>
                        <h1>404 - File Not Found</h1>
                        <p>The requested file could not be found: ${filePath}</p>
                    </body>
                    </html>
                `, 404);
        });

        test("should handle template compilation errors", async () => {
            // Arrange
            const filePath = "invalid.hbs";
            const templateError = new Error("Template compilation failed");
            
            // @ts-ignore
            mockRenderTemplateFile.mockRejectedValue(templateError);
            const handler = createHtmlFileHandler(filePath);

            // Act
            await handler(mockContext);

            // Assert
            expect(mockContext.html).toHaveBeenCalledWith(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Server Error</title>
                </head>
                <body>
                    <h1>500 - Internal Server Error</h1>
                    <p>An error occurred while serving the HTML file.</p>
                </body>
                </html>
            `, 500);
        });

        test("should handle permission errors", async () => {
            // Arrange
            const filePath = "restricted.html";
            const permissionError = new Error("EACCES: permission denied");
            
            // @ts-ignore
            mockRenderTemplateFile.mockRejectedValue(permissionError);
            const handler = createHtmlFileHandler(filePath);

            // Act
            await handler(mockContext);

            // Assert
            expect(mockContext.html).toHaveBeenCalledWith(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Server Error</title>
                </head>
                <body>
                    <h1>500 - Internal Server Error</h1>
                    <p>An error occurred while serving the HTML file.</p>
                </body>
                </html>
            `, 500);
        });

        test("should handle non-Error exceptions", async () => {
            // Arrange
            const filePath = "problematic.html";
            const stringError = "Something went wrong";
            
            // @ts-ignore
            mockRenderTemplateFile.mockRejectedValue(stringError);
            const handler = createHtmlFileHandler(filePath);

            // Act
            await handler(mockContext);

            // Assert
            expect(mockContext.html).toHaveBeenCalledWith(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Server Error</title>
                </head>
                <body>
                    <h1>500 - Internal Server Error</h1>
                    <p>An error occurred while serving the HTML file.</p>
                </body>
                </html>
            `, 500);
        });

        test("should handle ENOENT error with different file paths", async () => {
            const testPaths = [
                "missing/file.html",
                "/absolute/path/missing.hbs",
                "../relative/missing.html",
                "file with spaces.html",
                "file-with-special@chars.html"
            ];

            for (const testPath of testPaths) {
                // Reset mocks for each iteration
                jest.clearAllMocks();
                
                const enoentError = new Error(`ENOENT: no such file or directory, open '${testPath}'`);
                // @ts-ignore
                mockRenderTemplateFile.mockRejectedValue(enoentError);
                const handler = createHtmlFileHandler(testPath);

                await handler(mockContext);

                expect(mockContext.html).toHaveBeenCalledWith(`
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>File Not Found</title>
                    </head>
                    <body>
                        <h1>404 - File Not Found</h1>
                        <p>The requested file could not be found: ${testPath}</p>
                    </body>
                    </html>
                `, 404);
            }
        });
    });

    describe("Handler Execution - Edge Cases", () => {
        test("should handle empty file content", async () => {
            // Arrange
            const filePath = "empty.html";
            const emptyContent = "";
            
            // @ts-ignore
            mockRenderTemplateFile.mockResolvedValue(emptyContent);
            const handler = createHtmlFileHandler(filePath);

            // Act
            await handler(mockContext);

            // Assert
            expect(mockContext.html).toHaveBeenCalledWith(emptyContent);
        });

        test("should handle large file content", async () => {
            // Arrange
            const filePath = "large.html";
            const largeContent = "<html><body>" + "Large content ".repeat(1000) + "</body></html>";
            
            // @ts-ignore
            mockRenderTemplateFile.mockResolvedValue(largeContent);
            const handler = createHtmlFileHandler(filePath);

            // Act
            await handler(mockContext);

            // Assert
            expect(mockContext.html).toHaveBeenCalledWith(largeContent);
        });

        test("should handle special characters in content", async () => {
            // Arrange
            const filePath = "special.html";
            const specialContent = '<html><body><p>Special chars: <>&"\'</p><p>Unicode: 你好 🚀</p></body></html>';
            
            // @ts-ignore
            mockRenderTemplateFile.mockResolvedValue(specialContent);
            const handler = createHtmlFileHandler(filePath);

            // Act
            await handler(mockContext);

            // Assert
            expect(mockContext.html).toHaveBeenCalledWith(specialContent);
        });

        test("should handle null template data", async () => {
            // Arrange
            const filePath = "template.hbs";
            const templateData = null;
            const renderedContent = "<html><body>Null data handled</body></html>";
            
            // @ts-ignore
            mockRenderTemplateFile.mockResolvedValue(renderedContent);
            const handler = createHtmlFileHandler(filePath, templateData as any);

            // Act
            await handler(mockContext);

            // Assert
            expect(mockRenderTemplateFile).toHaveBeenCalledWith(filePath, null);
            expect(mockContext.html).toHaveBeenCalledWith(renderedContent);
        });
    });

    describe("Handler Execution - File Path Variations", () => {
        test("should handle different path formats", async () => {
            const pathFormats = [
                "simple.html",
                "./relative.html",
                "../parent.html",
                "/absolute/path.html",
                "deeply/nested/path/file.html",
                "file-with-dashes.html",
                "file_with_underscores.html",
                "file.with.dots.html"
            ];

            for (const path of pathFormats) {
                // Reset mocks for each iteration
                jest.clearAllMocks();
                
                const content = `<html><body>Content for ${path}</body></html>`;
                // @ts-ignore
                mockRenderTemplateFile.mockResolvedValue(content);
                const handler = createHtmlFileHandler(path);

                await handler(mockContext);

                expect(mockRenderTemplateFile).toHaveBeenCalledWith(path, undefined);
                expect(mockContext.html).toHaveBeenCalledWith(content);
            }
        });

        test("should handle paths with spaces", async () => {
            // Arrange
            const filePath = "file with spaces.html";
            const content = "<html><body>File with spaces</body></html>";
            
            // @ts-ignore
            mockRenderTemplateFile.mockResolvedValue(content);
            const handler = createHtmlFileHandler(filePath);

            // Act
            await handler(mockContext);

            // Assert
            expect(mockRenderTemplateFile).toHaveBeenCalledWith(filePath, undefined);
            expect(mockContext.html).toHaveBeenCalledWith(content);
        });
    });

    describe("Handler Execution - Template Data Variations", () => {
        test("should handle various data types", async () => {
            const dataTypes = [
                { data: { string: "test" }, desc: "string data" },
                { data: { number: 123 }, desc: "number data" },
                { data: { boolean: true }, desc: "boolean data" },
                { data: { array: [1, 2, 3] }, desc: "array data" },
                { data: { nested: { key: "value" } }, desc: "nested object data" },
                { data: { mixed: { str: "test", num: 42, arr: ["a", "b"] } }, desc: "mixed data types" }
            ];

            for (const testCase of dataTypes) {
                // Reset mocks for each iteration
                jest.clearAllMocks();
                
                const filePath = "template.hbs";
                const content = `<html><body>Rendered with ${testCase.desc}</body></html>`;
                
                // @ts-ignore
                mockRenderTemplateFile.mockResolvedValue(content);
                const handler = createHtmlFileHandler(filePath, testCase.data);

                await handler(mockContext);

                expect(mockRenderTemplateFile).toHaveBeenCalledWith(filePath, testCase.data);
                expect(mockContext.html).toHaveBeenCalledWith(content);
            }
        });
    });

    describe("Handler Creation - Multiple Instances", () => {
        test("should create different handlers for different files", () => {
            const handler1 = createHtmlFileHandler("file1.html");
            const handler2 = createHtmlFileHandler("file2.hbs");
            
            expect(handler1).not.toBe(handler2);
            expect(typeof handler1).toBe("function");
            expect(typeof handler2).toBe("function");
        });

        test("should create different handlers for same file with different data", () => {
            const data1 = { title: "Page 1" };
            const data2 = { title: "Page 2" };
            
            const handler1 = createHtmlFileHandler("template.hbs", data1);
            const handler2 = createHtmlFileHandler("template.hbs", data2);
            
            expect(handler1).not.toBe(handler2);
        });
    });
});