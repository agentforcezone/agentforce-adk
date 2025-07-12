# Container Setup for AgentForce SDK

This directory contains container configuration files to run the AgentForce SDK server in a containerized environment using either Docker or Podman.

## Files

- `Dockerfile` - Multi-stage container build configuration
- `.dockerignore` - Excludes unnecessary files from the container build context
- `docker-compose.yml` - Docker Compose configuration for easy deployment

## Quick Start

### Using Podman (Recommended for macOS)

1. **Install Podman Desktop:**
   - Download from [Podman Desktop](https://podman-desktop.io/)
   - Or install via Homebrew: `brew install podman-desktop`
   - Start Podman Desktop and initialize the machine

2. **Build the container image:**
   ```bash
   podman build -t agentforce-server .
   ```

3. **Run the container:**
   ```bash
   podman run -p 3000:3000 agentforce-server
   ```

4. **Run in detached mode:**
   ```bash
   podman run -d -p 3000:3000 --name agentforce-server agentforce-server
   ```

5. **View logs:**
   ```bash
   podman logs -f agentforce-server
   ```

6. **Stop the container:**
   ```bash
   podman stop agentforce-server
   ```

### Using Docker

1. **Build the Docker image:**
   ```bash
   docker build -t agentforce-server .
   ```

2. **Run the container:**
   ```bash
   docker run -p 3000:3000 agentforce-server
   ```

### Using Docker Compose

1. **Start the service:**
   ```bash
   docker-compose up -d
   ```

2. **View logs:**
   ```bash
   docker-compose logs -f agentforce-server
   ```

3. **Stop the service:**
   ```bash
   docker-compose down
   ```

## Accessing the Server

Once running, the server will be available at:
- **HTTP**: `http://localhost:3000`

## Configuration

The server runs the basic example from `examples/server/basic-server.ts` which:
- Uses Hono framework for HTTP handling
- Includes structured logging with Pino
- Exposes port 3000

## Environment Variables

- `NODE_ENV` - Set to "production" by default in the container

## Development

For development with Podman, you can mount the source code as a volume:

```bash
podman run -p 3000:3000 -v $(pwd):/app:Z agentforce-server
```

For Docker:
```bash
docker run -p 3000:3000 -v $(pwd):/app agentforce-server
```

Or modify the docker-compose.yml to include volume mounts for live reloading during development.

## Podman-specific Notes

- **SELinux Context**: On macOS with Podman, the `:Z` flag in volume mounts handles SELinux context automatically
- **Podman Desktop**: Provides a GUI for managing containers, images, and volumes
- **Compatibility**: Podman commands are largely compatible with Docker commands
- **Rootless**: Podman runs containers without requiring root privileges by default

## Troubleshooting

### Podman Issues
- **Machine not running**: Start Podman Desktop or run `podman machine start`
- **Port binding**: Ensure Podman machine is properly configured for port forwarding
- **Volume mounts**: Use absolute paths and `:Z` flag for SELinux contexts when needed

### Build Issues
- Ensure all dependencies are properly listed in `package.json`
- Check that TypeScript path mappings are correctly configured
- Verify Podman/Docker daemon is running

### Runtime Issues
- Check container logs: `podman logs <container-name>` or `docker logs <container-id>`
- Verify port 3000 is not already in use on your host machine
- Ensure the server starts correctly: `bun run examples/server/basic-server.ts`

### Ollama Integration
If your AgentForce server needs to connect to Ollama:
1. Uncomment the network configuration in `docker-compose.yml`
2. Add Ollama service to the compose file
3. Update connection settings to use the service name as hostname

For Podman, you can also use pods:
```bash
# Create a pod
podman pod create --name agentforce-pod -p 3000:3000

# Run containers in the pod
podman run -d --pod agentforce-pod --name agentforce-server agentforce-server
```
