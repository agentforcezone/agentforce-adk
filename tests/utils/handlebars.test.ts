import { describe, expect, test, beforeEach, jest } from "@jest/globals";

// Mock dependencies before importing the functions
const mockHandlebarsCompile = jest.fn();
const mockReadFileSync = jest.fn();
const mockResolve = jest.fn();

jest.mock("handlebars", () => ({
    __esModule: true,
    default: {
        compile: mockHandlebarsCompile
    }
}));

// Mock the dynamic imports with proper async handling
jest.mock("node:fs", () => ({
    readFileSync: mockReadFileSync
}));

jest.mock("node:path", () => ({
    resolve: mockResolve
}));

// Import the functions to test
import { renderTemplate, isHandlebarsTemplate, renderTemplateFile } from "../../lib/utils/handlebars";

describe("Handlebars Utilities Tests", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        
        // Set up default mock implementations
        mockResolve.mockImplementation((path) => `/resolved${String(path).startsWith("/") ? "" : "/"}${path}`);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("renderTemplate", () => {
        test("should compile and render template with data", () => {
            // Arrange
            const templateContent = "Hello {{name}}!";
            const templateData = { name: "World" };
            const mockCompiledTemplate = jest.fn().mockReturnValue("Hello World!");
            
            mockHandlebarsCompile.mockReturnValue(mockCompiledTemplate);

            // Act
            const result = renderTemplate(templateContent, templateData);

            // Assert
            expect(mockHandlebarsCompile).toHaveBeenCalledWith(templateContent);
            expect(mockCompiledTemplate).toHaveBeenCalledWith(templateData);
            expect(result).toBe("Hello World!");
        });

        test("should render template with empty object when no data provided", () => {
            // Arrange
            const templateContent = "Hello {{name}}!";
            const mockCompiledTemplate = jest.fn().mockReturnValue("Hello !");
            
            mockHandlebarsCompile.mockReturnValue(mockCompiledTemplate);

            // Act
            const result = renderTemplate(templateContent);

            // Assert
            expect(mockHandlebarsCompile).toHaveBeenCalledWith(templateContent);
            expect(mockCompiledTemplate).toHaveBeenCalledWith({});
            expect(result).toBe("Hello !");
        });

        test("should render template with undefined data as empty object", () => {
            // Arrange
            const templateContent = "Hello {{name}}!";
            const mockCompiledTemplate = jest.fn().mockReturnValue("Hello !");
            
            mockHandlebarsCompile.mockReturnValue(mockCompiledTemplate);

            // Act
            const result = renderTemplate(templateContent, undefined);

            // Assert
            expect(mockHandlebarsCompile).toHaveBeenCalledWith(templateContent);
            expect(mockCompiledTemplate).toHaveBeenCalledWith({});
            expect(result).toBe("Hello !");
        });
    });

    describe("isHandlebarsTemplate", () => {
        test("should return true for .hbs files", () => {
            const hbsFiles = [
                "template.hbs",
                "path/to/template.hbs",
                "/absolute/path/template.hbs",
                "complex-name_123.hbs",
                "file.min.hbs"
            ];

            hbsFiles.forEach(filePath => {
                expect(isHandlebarsTemplate(filePath)).toBe(true);
            });
        });

        test("should return false for non-.hbs files", () => {
            const nonHbsFiles = [
                "template.html",
                "template.htm",
                "template.txt",
                "template.js",
                "template",
                "template.hbs.backup",
                "file.handlebars"
            ];

            nonHbsFiles.forEach(filePath => {
                expect(isHandlebarsTemplate(filePath)).toBe(false);
            });
        });

        test("should handle empty string", () => {
            expect(isHandlebarsTemplate("")).toBe(false);
        });

        test("should handle files with multiple extensions", () => {
            expect(isHandlebarsTemplate("template.min.hbs")).toBe(true);
            expect(isHandlebarsTemplate("template.hbs.old")).toBe(false);
            expect(isHandlebarsTemplate("template.backup.hbs")).toBe(true);
        });

        test("should handle case sensitivity", () => {
            expect(isHandlebarsTemplate("template.HBS")).toBe(false);
            expect(isHandlebarsTemplate("template.Hbs")).toBe(false);
            expect(isHandlebarsTemplate("template.hBS")).toBe(false);
        });

        test("should handle special characters in filename", () => {
            expect(isHandlebarsTemplate("template-with-dashes.hbs")).toBe(true);
            expect(isHandlebarsTemplate("template_with_underscores.hbs")).toBe(true);
            expect(isHandlebarsTemplate("template@symbols.hbs")).toBe(true);
            expect(isHandlebarsTemplate("template with spaces.hbs")).toBe(true);
        });
    });

    describe("renderTemplateFile", () => {
        test("should read and render Handlebars template file", async () => {
            // Arrange
            const filePath = "template.hbs";
            const resolvedPath = "/resolved/template.hbs";
            const fileContent = "Hello {{name}}!";
            const templateData = { name: "World" };
            const mockCompiledTemplate = jest.fn().mockReturnValue("Hello World!");

            mockResolve.mockReturnValue(resolvedPath);
            mockReadFileSync.mockReturnValue(fileContent);
            mockHandlebarsCompile.mockReturnValue(mockCompiledTemplate);

            // Act
            const result = await renderTemplateFile(filePath, templateData);

            // Assert
            expect(result).toBe("Hello World!");
            expect(mockCompiledTemplate).toHaveBeenCalledWith(templateData);
        });

        test("should read and return static HTML file content", async () => {
            // Arrange
            const filePath = "static.html";
            const resolvedPath = "/resolved/static.html";
            const fileContent = "<h1>Static HTML</h1>";

            mockResolve.mockReturnValue(resolvedPath);
            mockReadFileSync.mockReturnValue(fileContent);

            // Act
            const result = await renderTemplateFile(filePath, { name: "World" });

            // Assert
            expect(result).toBe(fileContent);
            expect(mockHandlebarsCompile).not.toHaveBeenCalled();
        });

        test("should handle template file without data", async () => {
            // Arrange
            const filePath = "template.hbs";
            const resolvedPath = "/resolved/template.hbs";
            const fileContent = "Hello {{name}}!";
            const mockCompiledTemplate = jest.fn().mockReturnValue("Hello !");

            mockResolve.mockReturnValue(resolvedPath);
            mockReadFileSync.mockReturnValue(fileContent);
            mockHandlebarsCompile.mockReturnValue(mockCompiledTemplate);

            // Act
            const result = await renderTemplateFile(filePath);

            // Assert
            expect(result).toBe("Hello !");
            expect(mockCompiledTemplate).toHaveBeenCalledWith({});
        });

        test("should handle template file with undefined data", async () => {
            // Arrange
            const filePath = "template.hbs";
            const resolvedPath = "/resolved/template.hbs";
            const fileContent = "Hello {{name}}!";
            const mockCompiledTemplate = jest.fn().mockReturnValue("Hello !");

            mockResolve.mockReturnValue(resolvedPath);
            mockReadFileSync.mockReturnValue(fileContent);
            mockHandlebarsCompile.mockReturnValue(mockCompiledTemplate);

            // Act
            const result = await renderTemplateFile(filePath, undefined);

            // Assert
            expect(result).toBe("Hello !");
            expect(mockCompiledTemplate).toHaveBeenCalledWith({});
        });

        test("should handle various file extensions", async () => {
            // Test .hbs file
            const hbsPath = "template.hbs";
            const hbsContent = "Hello {{name}}!";
            const mockCompiledTemplate = jest.fn().mockReturnValue("Hello World!");

            mockResolve.mockReturnValue("/resolved/template.hbs");
            mockReadFileSync.mockReturnValue(hbsContent);
            mockHandlebarsCompile.mockReturnValue(mockCompiledTemplate);

            const hbsResult = await renderTemplateFile(hbsPath, { name: "World" });
            expect(hbsResult).toBe("Hello World!");

            // Reset mocks
            jest.clearAllMocks();
            mockResolve.mockReturnValue("/resolved/page.html");

            // Test .html file
            const htmlPath = "page.html";
            const htmlContent = "<h1>Static Page</h1>";
            mockReadFileSync.mockReturnValue(htmlContent);

            const htmlResult = await renderTemplateFile(htmlPath);
            expect(htmlResult).toBe(htmlContent);
            expect(mockHandlebarsCompile).not.toHaveBeenCalled();
        });

        test("should handle empty file content", async () => {
            // Test with .hbs file
            const hbsPath = "empty.hbs";
            const mockCompiledTemplate = jest.fn().mockReturnValue("");

            mockResolve.mockReturnValue("/resolved/empty.hbs");
            mockReadFileSync.mockReturnValue("");
            mockHandlebarsCompile.mockReturnValue(mockCompiledTemplate);

            const hbsResult = await renderTemplateFile(hbsPath, { name: "World" });
            expect(hbsResult).toBe("");

            // Test with .html file
            jest.clearAllMocks();
            const htmlPath = "empty.html";
            mockResolve.mockReturnValue("/resolved/empty.html");
            mockReadFileSync.mockReturnValue("");

            const htmlResult = await renderTemplateFile(htmlPath);
            expect(htmlResult).toBe("");
        });
    });

    describe("Integration Tests", () => {
        test("should work together for complete template processing", async () => {
            // Test the integration between isHandlebarsTemplate and renderTemplateFile
            const hbsPath = "integration.hbs";
            const htmlPath = "integration.html";
            
            // Verify file type detection
            expect(isHandlebarsTemplate(hbsPath)).toBe(true);
            expect(isHandlebarsTemplate(htmlPath)).toBe(false);

            // Test complete file processing
            const templateContent = "Hello {{name}} from {{location}}!";
            const templateData = { name: "User", location: "Earth" };
            const mockCompiledTemplate = jest.fn().mockReturnValue("Hello User from Earth!");

            mockResolve.mockReturnValue("/resolved/integration.hbs");
            mockReadFileSync.mockReturnValue(templateContent);
            mockHandlebarsCompile.mockReturnValue(mockCompiledTemplate);

            const result = await renderTemplateFile(hbsPath, templateData);
            expect(result).toBe("Hello User from Earth!");
        });

        test("should handle mixed file types in batch processing", async () => {
            const files = [
                { path: "template1.hbs", content: "Hello {{name}}!", isTemplate: true },
                { path: "static.html", content: "<h1>Static</h1>", isTemplate: false },
                { path: "template2.hbs", content: "Bye {{name}}!", isTemplate: true }
            ];

            const results = [];

            for (const file of files) {
                expect(isHandlebarsTemplate(file.path)).toBe(file.isTemplate);

                mockResolve.mockReturnValue(`/resolved/${file.path}`);
                mockReadFileSync.mockReturnValue(file.content);

                if (file.isTemplate) {
                    const mockCompiledTemplate = jest.fn().mockReturnValue(file.content.replace("{{name}}", "World"));
                    mockHandlebarsCompile.mockReturnValue(mockCompiledTemplate);
                }

                const result = await renderTemplateFile(file.path, { name: "World" });
                results.push(result);
            }

            expect(results).toEqual([
                "Hello World!",
                "<h1>Static</h1>",
                "Bye World!"
            ]);
        });
    });

    describe("Error Handling", () => {
        test("should handle file read errors gracefully", async () => {
            // Arrange
            const filePath = "nonexistent.hbs";
            const error = new Error("ENOENT: no such file or directory");
            
            mockResolve.mockReturnValue("/resolved/nonexistent.hbs");
            mockReadFileSync.mockImplementation(() => {
                throw error;
            });

            // Act & Assert
            await expect(renderTemplateFile(filePath)).rejects.toThrow("ENOENT: no such file or directory");
        });

        test("should handle Handlebars compilation errors", async () => {
            // Arrange
            const filePath = "invalid.hbs";
            const fileContent = "{{#invalid syntax";
            const error = new Error("Parse error");

            mockResolve.mockReturnValue("/resolved/invalid.hbs");
            mockReadFileSync.mockReturnValue(fileContent);
            mockHandlebarsCompile.mockImplementation(() => {
                throw error;
            });

            // Act & Assert
            await expect(renderTemplateFile(filePath)).rejects.toThrow("Parse error");
        });

        test("should handle template rendering errors", () => {
            // Arrange
            const templateContent = "{{helper that does not exist}}";
            const error = new Error("Missing helper");
            const mockCompiledTemplate = jest.fn().mockImplementation(() => {
                throw error;
            });

            mockHandlebarsCompile.mockReturnValue(mockCompiledTemplate);

            // Act & Assert
            expect(() => renderTemplate(templateContent, {})).toThrow("Missing helper");
            expect(mockCompiledTemplate).toHaveBeenCalledWith({});
        });
    });
});