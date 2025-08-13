import type { ToolImplementation } from "../../types";
import { executeGitHubCLI } from "../../utils/exec";

/**
 * GitHub list repositories tool
 * Lists repositories using the GitHub CLI (gh)
 */
export const gh_list_repos: ToolImplementation = {
    definition: {
        type: "function",
        function: {
            name: "gh_list_repos",
            description: "List GitHub repositories using the GitHub CLI. Can list repositories for a user/organization or search repositories.",
            parameters: {
                type: "object",
                properties: {
                    owner: {
                        type: "string",
                        description: "GitHub username or organization name to list repositories for (optional, defaults to authenticated user)",
                    },
                    limit: {
                        type: "number",
                        description: "Maximum number of repositories to return (default: 30, max: 100)",
                    },
                    visibility: {
                        type: "string",
                        description: "Repository visibility filter",
                        enum: ["public", "private", "internal"],
                    },
                    type: {
                        type: "string",
                        description: "Repository type filter",
                        enum: ["all", "owner", "member"],
                    },
                    sort: {
                        type: "string",
                        description: "Sort repositories by",
                        enum: ["created", "updated", "pushed", "full_name"],
                    },
                    direction: {
                        type: "string",
                        description: "Sort direction",
                        enum: ["asc", "desc"],
                    },
                    language: {
                        type: "string",
                        description: "Filter repositories by primary language",
                    },
                    topic: {
                        type: "string",
                        description: "Filter repositories by topic",
                    },
                    archived: {
                        type: "boolean",
                        description: "Include archived repositories (default: false)",
                    },
                    fork: {
                        type: "boolean",
                        description: "Include forked repositories (default: true)",
                    },
                },
                required: [],
            },
        },
    },
    execute: async (args: Record<string, any>) => {
        const {
            owner,
            limit = 30,
            visibility,
            type = "all",
            sort = "updated",
            direction = "desc",
            language,
            topic,
            archived = false,
            fork = true,
        } = args;

        try {
            // Validate limit
            const validLimit = Math.min(Math.max(1, limit), 100);

            // Build gh repo list command arguments
            const ghArgs = ["repo", "list"];

            // Add owner if specified
            if (owner) {
                ghArgs.push(owner);
            }

            // Add options
            ghArgs.push("--limit", validLimit.toString());
            ghArgs.push("--json", "name,nameWithOwner,owner,description,url,sshUrl,createdAt,updatedAt,pushedAt,isPrivate,isFork,isArchived,primaryLanguage,repositoryTopics,stargazerCount,forkCount,diskUsage");

            // Add filters
            if (visibility) {
                ghArgs.push("--visibility", visibility);
            }

            if (type !== "all") {
                ghArgs.push("--source");
            }

            if (language) {
                ghArgs.push("--language", language);
            }

            if (topic) {
                ghArgs.push("--topic", topic);
            }

            if (!archived) {
                ghArgs.push("--no-archived");
            }

            // Execute the GitHub CLI command
            const result = await executeGitHubCLI(ghArgs);

            if (!result.success) {
                return {
                    success: false,
                    error: result.error || result.stderr || "Failed to list repositories",
                    command: result.command,
                    exitCode: result.exitCode,
                };
            }

            // Parse JSON response
            let repositories = [];
            try {
                repositories = JSON.parse(result.stdout);
            } catch (parseError) {
                return {
                    success: false,
                    error: "Failed to parse GitHub CLI response",
                    rawOutput: result.stdout,
                };
            }

            // Apply additional filtering
            let filteredRepos = repositories;

            // Filter forks if requested
            if (!fork) {
                filteredRepos = filteredRepos.filter((repo: any) => !repo.isFork);
            }

            // Sort repositories
            if (sort) {
                filteredRepos.sort((a: any, b: any) => {
                    let aValue: any, bValue: any;
                    
                    switch (sort) {
                        case "created":
                            aValue = new Date(a.createdAt);
                            bValue = new Date(b.createdAt);
                            break;
                        case "updated":
                            aValue = new Date(a.updatedAt);
                            bValue = new Date(b.updatedAt);
                            break;
                        case "pushed":
                            aValue = new Date(a.pushedAt);
                            bValue = new Date(b.pushedAt);
                            break;
                        case "full_name":
                            aValue = `${a.owner.login}/${a.name}`;
                            bValue = `${b.owner.login}/${b.name}`;
                            break;
                        default:
                            aValue = a[sort];
                            bValue = b[sort];
                    }

                    if (direction === "desc") {
                        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
                    } else {
                        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
                    }
                });
            }

            // Process and format repository data
            const processedRepos = filteredRepos.map((repo: any) => ({
                name: repo.name,
                fullName: repo.nameWithOwner || `${repo.owner.login}/${repo.name}`,
                owner: repo.owner.login,
                description: repo.description || "",
                url: repo.url,
                sshUrl: repo.sshUrl,
                isPrivate: repo.isPrivate,
                isFork: repo.isFork,
                isArchived: repo.isArchived,
                language: repo.primaryLanguage?.name || "Unknown",
                topics: repo.repositoryTopics?.map((t: any) => t.topic?.name).filter(Boolean) || [],
                stars: repo.stargazerCount || 0,
                forks: repo.forkCount || 0,
                size: repo.diskUsage || 0,
                createdAt: repo.createdAt,
                updatedAt: repo.updatedAt,
                pushedAt: repo.pushedAt,
            }));

            // Generate summary statistics
            const stats = {
                totalRepos: processedRepos.length,
                publicRepos: processedRepos.filter((repo: any) => !repo.isPrivate).length,
                privateRepos: processedRepos.filter((repo: any) => repo.isPrivate).length,
                forkedRepos: processedRepos.filter((repo: any) => repo.isFork).length,
                archivedRepos: processedRepos.filter((repo: any) => repo.isArchived).length,
                totalStars: processedRepos.reduce((sum: number, repo: any) => sum + repo.stars, 0),
                totalForks: processedRepos.reduce((sum: number, repo: any) => sum + repo.forks, 0),
                languages: [...new Set(processedRepos.map((repo: any) => repo.language).filter(Boolean))],
            };

            return {
                success: true,
                owner: owner || "authenticated user",
                repositories: processedRepos,
                statistics: stats,
                filters: {
                    limit: validLimit,
                    visibility,
                    type,
                    sort,
                    direction,
                    language,
                    topic,
                    includeArchived: archived,
                    includeForks: fork,
                },
            };
        } catch (error: any) {
            return {
                success: false,
                error: `GitHub CLI execution failed: ${error.message}`,
                owner: owner || "authenticated user",
            };
        }
    },
};