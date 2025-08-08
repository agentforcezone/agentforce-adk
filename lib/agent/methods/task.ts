import type { AgentForceAgent } from "../../agent";

/**
 * Adds a task to the agent's task list for sequential execution.
 * Each task is executed independently, and its result is passed as context to the next task.
 * Tasks are processed during the execute() method call.
 *
 * @memberof AgentForceAgent
 * @function task
 * @param {string} taskDescription - The task description/prompt to execute
 * @returns {AgentForceAgent} Returns the agent instance for method chaining
 * 
 * @example
 * const agent = new AgentForceAgent({ name: "TaskAgent", tools: ["web_fetch", "fs_write_file"] });
 * agent
 *   .task("Fetch content from a URL")
 *   .task("Extract all links from the content")
 *   .task("Save the links to a file")
 *   .run();
 */
export function task(this: AgentForceAgent, taskDescription: string): AgentForceAgent {
    const logger = this.getLogger();
    
    // Validate input
    if (!taskDescription || taskDescription.trim() === "") {
        throw new Error("Task description cannot be empty");
    }
    
    // Get the task list (accessing via bracket notation for private property)
    const taskList = this["getTaskList"]();
    
    // Add the task to the list
    taskList.push({
        description: taskDescription.trim(),
        result: null,
    });
    
    // Update the task list
    this["setTaskList"](taskList);
    
    logger.debug({ task: taskDescription, taskCount: taskList.length }, "Task added to execution list");
    
    // Return this for chaining
    return this;
}