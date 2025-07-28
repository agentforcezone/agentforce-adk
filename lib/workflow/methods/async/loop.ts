import type { AgentForceWorkflow } from "../../../workflow";

/**
 * Runs the entire workflow in an infinite loop.
 *
 * @param this - The AgentForceWorkflow instance.
 * @param delayInMs - The delay between loop iterations.
 */
export function loop(this: AgentForceWorkflow, delayInMs: number = 0): void {
    this.getLogger().info(`Starting workflow loop with delay: ${delayInMs}ms`);
    const runLoop = async () => {
        try {
            await this.run();
        } catch (error) {
            this.getLogger().error({ message: "Workflow loop iteration failed.", error: (error as Error).message });
        }
        setTimeout(runLoop, delayInMs);
    };
    runLoop();
}