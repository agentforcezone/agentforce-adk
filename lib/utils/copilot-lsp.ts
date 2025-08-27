/**
 * GitHub Copilot LSP Integration Utility
 * Handles authentication flow and communication with GitHub Copilot Language Server
 */

import { spawn, ChildProcess } from "child_process";
import { promises as fs } from "fs";
import * as path from "path";
import * as os from "os";

/**
 * Authentication token structure
 */
interface AuthToken {
    token: string;
    expiresAt: number;
}

/**
 * Sign-in response from Copilot Language Server
 */
interface SignInResponse {
    userCode: string;
    verificationUri: string;
    expiresIn: number;
    interval: number;
    command: {
        command: string;
        arguments: any[];
        title: string;
    };
}

/**
 * LSP Message interface
 */
interface LSPMessage {
    id?: number;
    method: string;
    params?: any;
    jsonrpc: string;
    result?: any;
    error?: any;
}

/**
 * GitHub Copilot LSP Manager
 * Handles authentication and communication with the Language Server
 */
export class CopilotLSPManager {
    private server: ChildProcess | null = null;
    private requestId: number = 0;
    private tokenPath: string;
    private resolveMap: Map<number, (payload: any) => void> = new Map();
    private rejectMap: Map<number, (payload: any) => void> = new Map();
    private isInitialized: boolean = false;
    private documentVersion: number = 0;
    private static instance: CopilotLSPManager | null = null;

    constructor() {
        this.tokenPath = path.join(os.tmpdir(), "github-copilot-auth.json");
    }

    /**
     * Get singleton instance
     */
    static getInstance(): CopilotLSPManager {
        if (!CopilotLSPManager.instance) {
            CopilotLSPManager.instance = new CopilotLSPManager();
        }
        return CopilotLSPManager.instance;
    }

    /**
     * Initialize the GitHub Copilot Language Server
     */
    async initialize(): Promise<void> {
        if (this.isInitialized) {
            console.log("✅ GitHub Copilot Language Server already initialized");
            return;
        }

        try {
            console.log("🚀 Starting GitHub Copilot Language Server...");
            
            // Start the language server
            this.server = spawn("node", [
                "./node_modules/@github/copilot-language-server/dist/language-server.js",
                "--stdio",
                "true",
            ]);

            if (!this.server.stdin || !this.server.stdout || !this.server.stderr) {
                throw new Error("Failed to initialize language server streams");
            }

            console.log("📡 Setting up language server communication...");

            // Set up data handlers
            this.server.stdout.on("data", (data) => {
                this.handleServerMessage(data);
            });

            this.server.stderr.on("data", (data) => {
                console.error("Language server error:", data.toString());
            });

            this.server.on("error", (error) => {
                console.error("Language server process error:", error);
            });

            // Wait for server to start
            console.log("⏳ Waiting for language server to initialize...");
            await this.wait(1000);

            console.log("📤 Sending initialize request...");
            // Send initialize request
            await this.sendRequest("initialize", {
                capabilities: { 
                    workspace: { workspaceFolders: true },
                    textDocument: {
                        completion: {
                            completionItem: {
                                snippetSupport: true,
                            },
                        },
                    },
                },
                initializationOptions: {
                    editorInfo: {
                        name: "AgentForce",
                        version: "1.0.0",
                    },
                    editorPluginInfo: {
                        name: "agentforce-adk",
                        version: "0.12.1",
                    },
                },
            });

            console.log("📤 Sending initialized notification...");
            // Send initialized notification
            this.sendNotification("initialized", {});
            this.isInitialized = true;
            console.log("✅ GitHub Copilot Language Server initialized successfully");

        } catch (error) {
            console.error("❌ Failed to initialize GitHub Copilot Language Server:", error);
            throw error;
        }
    }

    /**
     * Check if user is authenticated with GitHub Copilot
     */
    async isAuthenticated(): Promise<boolean> {
        console.log("🔍 Checking GitHub Copilot authentication status...");
        
        try {
            if (!this.isInitialized) {
                console.log("🔄 Initializing GitHub Copilot Language Server...");
                await this.initialize();
            }
            
            console.log("📡 Sending signInInitiate request to check auth status...");
            // Check authentication status with the language server
            const response = await this.sendRequest("signInInitiate", {}) as any;
            console.log("📄 Auth status response:", JSON.stringify(response, null, 2));
            
            if (response.status === "AlreadySignedIn") {
                console.log("✅ User is already signed in:", response.user);
                // Save auth token
                const authToken: AuthToken = {
                    token: "authenticated",
                    expiresAt: Date.now() + (24 * 60 * 60 * 1000),
                };
                await fs.writeFile(this.tokenPath, JSON.stringify(authToken, null, 2));
                return true;
            }
            
            console.log("❌ User is not authenticated, sign-in required");
            return false;
        } catch (error) {
            console.error("⚠️ Error checking authentication with LSP:", error);
            console.log("🔄 Checking local token file as fallback...");
            
            // Also check local token file as fallback
            try {
                const tokenData = await fs.readFile(this.tokenPath, "utf8");
                const authToken: AuthToken = JSON.parse(tokenData);
                const isValid = authToken.expiresAt > Date.now();
                console.log(isValid ? "✅ Local token is valid" : "❌ Local token expired");
                return isValid;
            } catch {
                console.log("❌ No valid local token found");
                return false;
            }
        }
    }

    /**
     * Start the login process and wait for completion
     */
    async loginAndWaitForAuth(): Promise<void> {
        console.log("🔐 Starting GitHub Copilot authentication...");
        
        try {
            // Start sign-in process
            const signInResponse = await this.startSignIn();
            
            if (signInResponse.userCode === "ALREADY_AUTHENTICATED") {
                console.log("✅ Already authenticated with GitHub Copilot!");
                return;
            }

            // Display user code and wait for authentication
            this.displayUserCode(signInResponse);
            
            // Wait for user to complete authentication
            await this.waitForAuthentication(signInResponse);
            
            console.log("✅ GitHub Copilot authentication completed!");
        } catch (error) {
            console.error("❌ Authentication failed:", error);
            throw error;
        }
    }

    /**
     * Start the sign-in process
     */
    private async startSignIn(): Promise<SignInResponse> {
        if (!this.isInitialized) {
            await this.initialize();
        }

        try {
            const response = await this.sendRequest("signInInitiate", {}) as any;
            
            // Check if already signed in
            if (response.status === "AlreadySignedIn") {
                return {
                    userCode: "ALREADY_AUTHENTICATED",
                    verificationUri: "",
                    expiresIn: 0,
                    interval: 0,
                    command: {
                        command: "already.authenticated",
                        arguments: [response.user],
                        title: "Already signed in",
                    },
                };
            }
            
            return {
                userCode: response.userCode || response.user_code,
                verificationUri: response.verificationUri || "https://github.com/login/device",
                expiresIn: response.expiresIn || 900,
                interval: response.interval || 5,
                command: response.command || {
                    command: "github.copilot.finishDeviceFlow",
                    arguments: [],
                    title: "Sign in",
                },
            };
            
        } catch (error) {
            console.error("❌ Sign-in initiation failed:", error);
            throw error;
        }
    }

    /**
     * Display user code prominently
     */
    private displayUserCode(signInResponse: SignInResponse): void {
        console.log("\n" + "=".repeat(60));
        console.log("🔑 GITHUB COPILOT AUTHENTICATION REQUIRED");
        console.log("=".repeat(60));
        console.log("🌐 STEP 1: Open this URL in your browser:");
        console.log(`          ${signInResponse.verificationUri}`);
        console.log("");
        console.log("🔢 STEP 2: Enter this USER CODE when prompted:");
        console.log(`          ${signInResponse.userCode}`);
        console.log("");
        console.log("⏳ STEP 3: Complete authentication in browser");
        console.log("   Waiting for authentication to complete...");
        console.log("=".repeat(60));
    }

    /**
     * Wait for authentication to complete
     */
    private async waitForAuthentication(signInResponse: SignInResponse): Promise<void> {
        const maxAttempts = Math.floor(signInResponse.expiresIn / signInResponse.interval);
        let attempts = 0;

        while (attempts < maxAttempts) {
            await this.wait(signInResponse.interval * 1000);
            
            try {
                // Try to finish the sign-in process
                await this.executeCommand(signInResponse.command.command, signInResponse.command.arguments);
                
                // Save auth token
                const authToken: AuthToken = {
                    token: "authenticated",
                    expiresAt: Date.now() + (24 * 60 * 60 * 1000),
                };
                await fs.writeFile(this.tokenPath, JSON.stringify(authToken, null, 2));
                
                return; // Success!
            } catch (error) {
                // Authentication not completed yet, continue waiting
                attempts++;
                process.stdout.write(".");
            }
        }
        
        throw new Error("Authentication timeout - please try again");
    }

    /**
     * Get completions from GitHub Copilot
     */
    async getCompletions(text: string, position: { line: number; character: number }): Promise<any[]> {
        if (!this.isInitialized) {
            await this.initialize();
        }

        const uri = "file:///tmp/agentforce-copilot-temp.py";
        
        // Send textDocument/didOpen notification
        this.sendNotification("textDocument/didOpen", {
            textDocument: {
                uri,
                languageId: "python",
                version: this.documentVersion,
                text,
            },
        });

        try {
            // Send getCompletions request
            const completions = await this.sendRequest("getCompletions", {
                doc: {
                    version: this.documentVersion,
                    position,
                    uri,
                },
            });

            // Close the document
            this.sendNotification("textDocument/didClose", {
                textDocument: { uri },
            });

            return completions?.completions || [];
        } catch (error) {
            console.error("Failed to get completions:", error);
            return [];
        } finally {
            this.documentVersion++;
        }
    }

    /**
     * Shutdown the language server
     */
    async shutdown(): Promise<void> {
        if (this.server) {
            try {
                console.log("🔄 Shutting down GitHub Copilot Language Server...");
                await this.sendRequest("shutdown", {});
                this.sendNotification("exit", {});
                
                // Give the server time to shut down gracefully
                await this.wait(1000);
                
                this.server.kill();
                this.server = null;
                this.isInitialized = false;
                CopilotLSPManager.instance = null;
                console.log("✅ GitHub Copilot Language Server shut down successfully");
            } catch (error) {
                console.error("Error during language server shutdown:", error);
                if (this.server) {
                    this.server.kill("SIGKILL");
                    this.server = null;
                    this.isInitialized = false;
                    CopilotLSPManager.instance = null;
                }
            }
        }
    }

    /**
     * Auto-shutdown the language server after a delay
     * Useful for preventing the process from hanging after completion
     */
    autoShutdown(delayMs: number = 5000): void {
        setTimeout(async () => {
            try {
                await this.shutdown();
            } catch (error) {
                console.error("Auto-shutdown error:", error);
            }
        }, delayMs);
    }

    /**
     * Handle incoming messages from the language server
     */
    private handleServerMessage(data: Buffer): void {
        const rawString = data.toString("utf-8");
        const payloadStrings = rawString.split(/Content-Length: \d+\r\n\r\n/).filter(s => s);

        for (const payloadString of payloadStrings) {
            try {
                const payload = JSON.parse(payloadString) as LSPMessage;
                this.handleReceivedPayload(payload);
            } catch (error) {
                // Ignore parsing errors for partial messages
            }
        }
    }

    /**
     * Handle received LSP payload
     */
    private handleReceivedPayload(payload: LSPMessage): void {
        if (payload.id !== undefined) {
            if (payload.result !== undefined) {
                const resolve = this.resolveMap.get(payload.id);
                if (resolve) {
                    resolve(payload.result);
                    this.resolveMap.delete(payload.id);
                }
            } else if (payload.error !== undefined) {
                const reject = this.rejectMap.get(payload.id);
                if (reject) {
                    reject(payload.error);
                    this.rejectMap.delete(payload.id);
                }
            }
        }
    }

    /**
     * Send an LSP message to the server
     */
    private sendMessage(data: Partial<LSPMessage>): void {
        if (!this.server?.stdin) {
            throw new Error("Language server not initialized");
        }

        const message = { ...data, jsonrpc: "2.0" };
        const dataString = JSON.stringify(message);
        const contentLength = Buffer.byteLength(dataString, "utf8");
        const rpcString = `Content-Length: ${contentLength}\r\n\r\n${dataString}`;
        
        this.server.stdin.write(rpcString);
    }

    /**
     * Send an LSP request to the server
     */
    private sendRequest(method: string, params?: any): Promise<any> {
        const id = ++this.requestId;
        this.sendMessage({ id, method, params });
        
        return new Promise((resolve, reject) => {
            this.resolveMap.set(id, resolve);
            this.rejectMap.set(id, reject);
        });
    }

    /**
     * Send an LSP notification to the server
     */
    private sendNotification(method: string, params?: any): void {
        this.sendMessage({ method, params });
    }

    /**
     * Execute a workspace command
     */
    private async executeCommand(command: string, args: any[] = []): Promise<any> {
        return this.sendRequest("workspace/executeCommand", {
            command,
            arguments: args,
        });
    }

    /**
     * Wait for a specified number of milliseconds
     */
    private wait(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

/**
 * Global LSP manager instance
 */
export const copilotLSP = CopilotLSPManager.getInstance();