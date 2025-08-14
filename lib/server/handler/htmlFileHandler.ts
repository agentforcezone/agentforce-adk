import type { Context } from "hono";
import { renderTemplateFile } from "../../utils/handlebars";
import { defaultLogger } from "../../logger";

/**
 * Creates a handler for serving HTML or Handlebars template files
 * @param filePath - Path to the HTML or HBS file to serve
 * @param templateData - Optional data to pass to Handlebars templates
 * @returns Hono route handler function
 */
export function createHtmlFileHandler(filePath: string, templateData?: Record<string, any>): (c: Context) => Promise<Response> {
    return async (c: Context): Promise<Response> => {
        try {
            const htmlContent = await renderTemplateFile(filePath, templateData);
            
            // Return HTML response
            return c.html(htmlContent);
        } catch (error) {
            defaultLogger.error(`Error serving file ${filePath}:`, error);
            
            if (error instanceof Error && error.message.includes("ENOENT")) {
                return c.html(`
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
            }
            
            return c.html(`
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
        }
    };
}