import type { AgentForceAgent } from "../../../agent";
import { GoogleProvider } from "../../../provider/google";
import { OllamaProvider } from "../../../provider/ollama";
import { OpenRouterProvider } from "../../../provider/openrouter";
import { loadSkills } from "../../functions/skills";
import { loadTools } from "../../functions/tools";
import { truncate } from "../../../utils/truncate";

/**
 * Executes the agent's provider call to generate response
 * @param this - The AgentForceAgent instance (bound context)
 * @returns {Promise<string>} Returns the generated response from the provider
 */
export async function execute(this: AgentForceAgent): Promise<string> {
    const logger = this.getLogger();
    
    // Get agent configuration
    const provider = this.getProvider();
    const model = this.getModel();
    const systemPrompt = this.getSystemPrompt();
    const template = this.getTemplate();
    const userPrompt = this.getUserPrompt();
    const modelConfig = (this as any).getModelConfig?.() || undefined; // access if available
    const taskList = this.getTaskList();
    
    // Load skills content
    const skills = this.getSkills();
    const skillsContent = (skills && skills.length > 0) ? (loadSkills(this) || "") : "";

    // Load tools if configured
    const tools = this.getTools();
    const loadedTools = (tools && tools.length > 0) ? (loadTools(this) || []) : [];

    // Construct the full system prompt in order: systemPrompt + skills + template
    let fullSystemPrompt = systemPrompt;
    
    // Add skills content if available
    if (skillsContent) {
        fullSystemPrompt = `${fullSystemPrompt}${skillsContent}`;
    }
    
    // Add template if available
    if (template && template.trim()) {
        fullSystemPrompt = `${fullSystemPrompt}\n\n${template}`;
    }

    // Log the execution details
    logger.debug(
        "Run execute", 
        { agent: this.getName() }, 
        { provider: provider },
        { model: model }, 
        { systemPrompt: truncate(systemPrompt, 100) },
        { skillsContent: skillsContent ? truncate(skillsContent, 100) : "none" },
        { template: template ? truncate(template, 100) : "none" },
        { userPrompt: userPrompt },
    );
    
    // Check if we have tasks to process
    if (taskList && taskList.length > 0) {
        logger.debug({ taskCount: taskList.length }, "Processing task list");
        
        // Add the initial user prompt to chat history if it exists
        if (userPrompt && userPrompt.trim()) {
            this.pushToChatHistory("user", userPrompt);
        }
        
        const results: string[] = [];
        
        // Process each task sequentially
        for (let i = 0; i < taskList.length; i++) {
            const task = taskList[i];
            if (!task) {
                logger.debug({ taskIndex: i }, "Skipping undefined task");
                continue;
            }
            
            logger.debug({ taskIndex: i, task: task.description }, "Processing task");
            
            // Add the current task as a user message to chat history
            this.pushToChatHistory("user", task.description);
            
            // Execute the task with full chat history context
            const taskResult = await executeProviderCallWithChatHistory(
                this,
                provider,
                model,
                modelConfig,
                fullSystemPrompt,
                task.description,
                loadedTools,
                logger,
            );
            
            // Add the task result to chat history
            this.pushToChatHistory("assistant", taskResult);
            
            // Store the result
            task.result = taskResult;
            results.push(taskResult);
            
            logger.debug({ taskIndex: i, resultLength: taskResult.length }, "Task completed");
        }
        
        // Clear the task list after processing
        this.clearTaskList();
        
        // Return the final result (last task's output) or empty string if no results
        return results.length > 0 ? results[results.length - 1]! : "";
    }
    
    // Store the user prompt in chat history if not already stored
    const chatHistory = this.getChatHistory();
    const lastUserMessage = chatHistory.findLast(msg => msg.role === "user");
    if (!lastUserMessage || lastUserMessage.content !== userPrompt) {
        this.pushToChatHistory("user", userPrompt);
    }

    try {
        let response: string;

        response = await executeProviderCall(
            this,
            provider,
            model,
            modelConfig,
            fullSystemPrompt,
            userPrompt,
            loadedTools,
            logger,
        );

        // Store the assistant response in chat history
        this.pushToChatHistory("assistant", response);
        
        return response;

    } catch (error) {
        // Store error in chat history as well
        const errorMessage = `Error: ${error}`;
        this.pushToChatHistory("assistant", errorMessage);
        logger.error("Execution error:", errorMessage);
        throw error; // Re-throw to let caller handle the error
    }
}

/**
 * Helper function to execute provider calls with full chat history context
 * @internal
 */
async function executeProviderCallWithChatHistory(
    agent: AgentForceAgent,
    provider: string,
    model: string,
    modelConfig: any,
    systemPrompt: string,
    currentUserPrompt: string,
    loadedTools: any[],
    logger: any,
): Promise<string> {
    const chatHistory = (agent as any).getChatHistory();
    
    // Prepare messages for chat format - include system prompt as first message
    const messages: Array<{ role: string; content: string }> = [];
    
    // Add system message if we have one
    if (systemPrompt && systemPrompt.trim()) {
        messages.push({ role: "system", content: systemPrompt });
    }
    
    // Add chat history
    messages.push(...chatHistory);
    
    // Add current user prompt
    messages.push({ role: "user", content: currentUserPrompt });
    
    // Execute based on provider
    switch (provider.toLowerCase()) {
        case "ollama":
            // Initialize Ollama provider with model config
            const ollamaProvider = new OllamaProvider(model, modelConfig);
            // Generate response using Ollama with tools if available
            if (loadedTools && loadedTools.length > 0) {
                logger.debug("Using Ollama with tools and chat history", { 
                    toolCount: loadedTools.length,
                    chatHistoryLength: chatHistory.length,
                    totalMessages: messages.length,
                });
                return await ollamaProvider.chatWithTools(messages, loadedTools, logger);
            } else {
                logger.debug("Using Ollama with chat history", { 
                    chatHistoryLength: chatHistory.length,
                    totalMessages: messages.length,
                });
                return await ollamaProvider.chat(messages);
            }

        case "openrouter":
            // Initialize OpenRouter provider
            const openRouterProvider = new OpenRouterProvider(model, modelConfig);
            // Generate response using OpenRouter with tools if available
            if (loadedTools && loadedTools.length > 0) {
                logger.debug("Using OpenRouter with tools and chat history", { 
                    toolCount: loadedTools.length,
                    chatHistoryLength: chatHistory.length,
                    totalMessages: messages.length,
                });
                return await openRouterProvider.chatWithTools(messages, loadedTools, logger);
            } else {
                logger.debug("Using OpenRouter with chat history", { 
                    chatHistoryLength: chatHistory.length,
                    totalMessages: messages.length,
                });
                return await openRouterProvider.chat(messages);
            }

        case "google":
            // Initialize Google provider
            const googleProvider = new GoogleProvider(model, modelConfig);
            // Generate response using Google with chat history
            logger.debug("Using Google with chat history", { 
                chatHistoryLength: chatHistory.length,
                totalMessages: messages.length,
            });
            return await googleProvider.chat(messages);

        case "openai":
            return "OpenAI integration not implemented yet.";

        case "anthropic":
            return "Anthropic integration not implemented yet.";

        default:
            return `Unknown provider integration not available: ${provider}`;
    }
}

/**
 * Helper function to execute provider calls (legacy - for non-task execution)
 * @internal
 */
async function executeProviderCall(
    _agent: AgentForceAgent,
    provider: string,
    model: string,
    modelConfig: any,
    systemPrompt: string,
    userPrompt: string,
    loadedTools: any[],
    logger: any,
): Promise<string> {
    // Execute based on provider
    switch (provider.toLowerCase()) {
        case "ollama":
            // Initialize Ollama provider with model config
            const ollamaProvider = new OllamaProvider(model, modelConfig);
            // Generate response using Ollama with tools if available
            if (loadedTools && loadedTools.length > 0) {
                logger.debug("Using Ollama with tools", { toolCount: loadedTools.length });
                return await ollamaProvider.generateWithTools(userPrompt, loadedTools, systemPrompt, logger);
            } else {
                return await ollamaProvider.generate(userPrompt, systemPrompt);
            }

        case "openrouter":
            // Initialize OpenRouter provider
            const openRouterProvider = new OpenRouterProvider(model, modelConfig);
            // Generate response using OpenRouter with tools if available
            if (loadedTools && loadedTools.length > 0) {
                logger.debug("Using OpenRouter with tools", { toolCount: loadedTools.length });
                return await openRouterProvider.generateWithTools(userPrompt, loadedTools, systemPrompt, logger);
            } else {
                return await openRouterProvider.generate(userPrompt, systemPrompt);
            }

        case "google":
            // Initialize Google provider
            const googleProvider = new GoogleProvider(model, modelConfig);
            // Generate response using Google
            return await googleProvider.generate(userPrompt, systemPrompt);    

        case "openai":
            return "OpenAI integration not implemented yet.";

        case "anthropic":
            return "Anthropic integration not implemented yet.";

        default:
            return `Unknown provider integration not available: ${provider}`;
    }
}
