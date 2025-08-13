import type { AgentForceAgent } from "../../agent";
import { existsSync, readFileSync } from "fs";
import { resolve, dirname, join } from "path";
import { fileURLToPath } from "url";

/**
 * Internal function to load skill files specified in the agent configuration.
 * Skills are loaded from file paths and their content is returned as a string.
 * 
 * @internal
 * @param agent - The AgentForceAgent instance
 * @returns {string} The loaded skills content or empty string if no skills
 */
export function loadSkills(agent: AgentForceAgent): string {
    const logger = agent["getLogger"]();
    const skills = agent["getSkills"]();
    
    if (!skills || skills.length === 0) {
        logger.debug("No skills to load");
        return "";
    }
    
    const loadedSkills: string[] = [];
    const skillContents: string[] = [];
    
    for (const skillPath of skills) {
        try {
            let absolutePath: string;
            let skillName: string;
            
            // Check if skillPath contains a path separator (file path) or is just a skill name
            if (skillPath.includes("/") || skillPath.includes("\\")) {
                // File path provided - use as is
                absolutePath = resolve(process.cwd(), skillPath);
                skillName = skillPath.split("/").pop()?.replace(/\.(md|txt)$/, "") || "skill";
            } else {
                // Skill name only - look in lib/_assets/skills directory relative to this package
                const currentDir = dirname(fileURLToPath(import.meta.url));
                const packageRoot = join(currentDir, "../../..");  // Go up to package root from lib/agent/functions/
                absolutePath = join(packageRoot, "lib", "_assets", "skills", `${skillPath}.md`);
                skillName = skillPath;
            }
            
            if (existsSync(absolutePath)) {
                // Read the skill file content
                const content = readFileSync(absolutePath, "utf-8");
                
                skillContents.push(`\n## Skill: ${skillName}\n${content}`);
                loadedSkills.push(skillName);
                
                logger.debug({ skill: skillName, path: absolutePath }, "Skill loaded successfully");
            } else {
                logger.warn({ skillPath, resolvedPath: absolutePath }, "Skill file not found");
            }
        } catch (error) {
            logger.error({ skillPath, error }, "Failed to load skill");
        }
    }
    
    // Return skill contents if any were loaded
    if (skillContents.length > 0) {
        logger.debug({ skills: loadedSkills }, "Skills loaded successfully");
        return `\n\n# Loaded Skills\n${skillContents.join("\n")}`;
    }
    
    return "";
}