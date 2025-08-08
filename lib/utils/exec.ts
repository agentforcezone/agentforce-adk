import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export interface ExecOptions {
    cwd?: string;
    timeout?: number;
    env?: Record<string, string>;
    shell?: string | boolean;
    encoding?: BufferEncoding;
    maxBuffer?: number;
}

export interface ExecResult {
    success: boolean;
    stdout: string;
    stderr: string;
    exitCode: number | null;
    command: string;
    error?: string;
}

/**
 * Execute a shell command asynchronously
 * @param command The command to execute
 * @param options Execution options
 * @returns Promise with execution result
 */
export async function executeCommand(command: string, options: ExecOptions = {}): Promise<ExecResult> {
    const {
        cwd = process.cwd(),
        timeout = 30000, // 30 seconds default timeout
        env = process.env,
        encoding = "utf8",
        maxBuffer = 1024 * 1024 * 10, // 10MB default buffer
    } = options;

    try {
        const { stdout, stderr } = await execAsync(command, {
            cwd,
            timeout,
            env: { ...env },
            encoding,
            maxBuffer,
        });

        return {
            success: true,
            stdout: stdout.toString().trim(),
            stderr: stderr.toString().trim(),
            exitCode: 0,
            command,
        };
    } catch (error: any) {
        return {
            success: false,
            stdout: error.stdout ? error.stdout.toString().trim() : "",
            stderr: error.stderr ? error.stderr.toString().trim() : "",
            exitCode: error.code || -1,
            command,
            error: error.message || "Unknown error occurred",
        };
    }
}

/**
 * Check if a command/program is available in the system PATH
 * @param command The command to check
 * @returns Promise<boolean> indicating if command is available
 */
export async function isCommandAvailable(command: string): Promise<boolean> {
    const checkCommand = process.platform === "win32" 
        ? `where ${command}` 
        : `which ${command}`;
    
    const result = await executeCommand(checkCommand, { timeout: 5000 });
    return result.success && result.stdout.length > 0;
}

/**
 * Execute GitHub CLI command with proper error handling
 * @param ghArgs Array of arguments for gh command
 * @param options Execution options
 * @returns Promise with execution result
 */
export async function executeGitHubCLI(ghArgs: string[], options: ExecOptions = {}): Promise<ExecResult> {
    // Check if gh is available
    const isGhAvailable = await isCommandAvailable("gh");
    if (!isGhAvailable) {
        return {
            success: false,
            stdout: "",
            stderr: "",
            exitCode: -1,
            command: `gh ${ghArgs.join(" ")}`,
            error: "GitHub CLI (gh) is not installed or not available in PATH",
        };
    }

    // Build the gh command
    const command = `gh ${ghArgs.join(" ")}`;
    
    // Execute with enhanced timeout for GitHub API calls
    const enhancedOptions: ExecOptions = {
        timeout: 60000, // 60 seconds for GitHub API calls
        ...options,
    };

    const result = await executeCommand(command, enhancedOptions);
    
    // Enhanced error handling for GitHub CLI specific errors
    if (!result.success) {
        // Check for common gh authentication errors
        if (result.stderr.includes("authentication") || result.stderr.includes("login")) {
            result.error = "GitHub CLI authentication required. Run 'gh auth login' to authenticate.";
        } else if (result.stderr.includes("rate limit")) {
            result.error = "GitHub API rate limit exceeded. Please try again later.";
        } else if (result.stderr.includes("not found")) {
            result.error = "Repository or resource not found. Check permissions and repository name.";
        }
    }

    return result;
}