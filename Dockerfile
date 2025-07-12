# Use the official Bun image
FROM oven/bun:1 AS base

# Set working directory
WORKDIR /app

# Copy package.json and bun.lockb for dependency installation
COPY package.json bun.lock* ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy TypeScript configuration
COPY tsconfig.json ./

# Copy the entire lib directory (contains the AgentForce SDK)
COPY lib/ ./lib/

# Copy the examples directory
COPY examples/ ./examples/

# Expose the port that the server will run on
EXPOSE 3000

# Set environment variable for production
ENV NODE_ENV=production

# Command to run the basic server
CMD ["bun", "run", "./examples/server/basic-server.ts"]
