// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	integrations: [
		starlight({
			title: 'AgentForce ADK',
			description: 'A powerful TypeScript Agentic Framework for building AiAgent Workflows',
			social: [
				{ 
					icon: 'github', 
					label: 'GitHub', 
					href: 'https://github.com/agentforcezone/agentforce-adk' 
				}
			],
			sidebar: [
				{
					label: 'Getting Started',
					items: [
						{ label: 'Introduction', slug: 'getting-started/introduction' },
						{ label: 'Installation', slug: 'getting-started/installation' },
						{ label: 'Quick Start', slug: 'getting-started/quick-start' },
						{ label: 'Provider Setup', slug: 'getting-started/provider-setup' },
						{ label: 'Server Mode', slug: 'getting-started/server-mode' },
					],
				},
				{
					label: 'Guides',
					items: [
						{ label: 'Basic Agents', slug: 'guides/basic-agents' },
						{ label: 'Method Chaining', slug: 'guides/method-chaining' },
						{ label: 'Multiple Providers', slug: 'guides/providers' },
						{ label: 'Output Formats', slug: 'guides/output-formats' },
						{ label: 'OpenAI Compatibility', slug: 'guides/openai-compatibility' },
					],
				},
				{
					label: 'API Reference',
					autogenerate: { directory: 'reference' },
				},
				{
					label: 'Examples',
					items: [
						{ label: 'Basic Examples', slug: 'examples/basic' },
						{ label: 'Server Examples', slug: 'examples/server' },
						{ label: 'Advanced Workflows', slug: 'examples/advanced' },
					],
				},
			],
			customCss: [
				// Relative path to your custom CSS files
				'./src/styles/custom.css',
				'./src/styles/home.css',
			],
		}),
	],
});
