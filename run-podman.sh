#!/bin/bash

# AgentForce SDK Podman Runner Script
# This script helps you easily run the AgentForce server with Podman

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
IMAGE_NAME="agentforce-server"
CONTAINER_NAME="agentforce-server"
PORT="3000"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Podman is installed
check_podman() {
    if ! command -v podman &> /dev/null; then
        print_error "Podman is not installed. Please install Podman Desktop or Podman CLI."
        exit 1
    fi
    
    print_status "Podman version: $(podman --version)"
}

# Check if Podman machine is running
check_podman_machine() {
    if ! podman machine list | grep -q "Currently running"; then
        print_warning "Podman machine is not running. Starting..."
        podman machine start
    fi
}

# Build the container image
build_image() {
    print_status "Building AgentForce server image..."
    podman build -t $IMAGE_NAME .
    print_success "Image built successfully!"
}

# Run the container
run_container() {
    # Stop existing container if running
    if podman ps -a --format "{{.Names}}" | grep -q "^${CONTAINER_NAME}$"; then
        print_status "Stopping existing container..."
        podman stop $CONTAINER_NAME || true
        podman rm $CONTAINER_NAME || true
    fi
    
    print_status "Starting AgentForce server on port $PORT..."
    podman run -d \
        --name $CONTAINER_NAME \
        -p $PORT:3000 \
        $IMAGE_NAME
    
    print_success "Container started successfully!"
    print_status "Server is running at: http://localhost:$PORT"
}

# Show logs
show_logs() {
    print_status "Showing container logs (Ctrl+C to exit)..."
    podman logs -f $CONTAINER_NAME
}

# Stop the container
stop_container() {
    print_status "Stopping AgentForce server..."
    podman stop $CONTAINER_NAME
    print_success "Container stopped!"
}

# Show help
show_help() {
    echo "AgentForce SDK Podman Runner"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  build       Build the container image"
    echo "  run         Run the container (builds if needed)"
    echo "  start       Start the container"
    echo "  stop        Stop the container"
    echo "  restart     Restart the container"
    echo "  logs        Show container logs"
    echo "  status      Show container status"
    echo "  clean       Stop and remove container and image"
    echo "  help        Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 run              # Build and run the server"
    echo "  $0 logs             # View server logs"
    echo "  $0 stop             # Stop the server"
}

# Show container status
show_status() {
    print_status "Container status:"
    podman ps -a --filter "name=$CONTAINER_NAME" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
}

# Clean up everything
clean_up() {
    print_status "Cleaning up containers and images..."
    podman stop $CONTAINER_NAME 2>/dev/null || true
    podman rm $CONTAINER_NAME 2>/dev/null || true
    podman rmi $IMAGE_NAME 2>/dev/null || true
    print_success "Cleanup completed!"
}

# Main script logic
main() {
    check_podman
    check_podman_machine
    
    case "${1:-run}" in
        "build")
            build_image
            ;;
        "run")
            build_image
            run_container
            ;;
        "start")
            if ! podman ps -a --format "{{.Names}}" | grep -q "^${CONTAINER_NAME}$"; then
                print_error "Container does not exist. Run '$0 run' first."
                exit 1
            fi
            podman start $CONTAINER_NAME
            print_success "Container started!"
            ;;
        "stop")
            stop_container
            ;;
        "restart")
            stop_container
            sleep 2
            run_container
            ;;
        "logs")
            show_logs
            ;;
        "status")
            show_status
            ;;
        "clean")
            clean_up
            ;;
        "help"|"-h"|"--help")
            show_help
            ;;
        *)
            print_error "Unknown command: $1"
            show_help
            exit 1
            ;;
    esac
}

main "$@"
