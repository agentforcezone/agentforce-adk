# Kind (Kubernetes in Docker) Setup for AgentForce SDK

This guide covers setting up and managing a local Kubernetes cluster using Kind for the AgentForce SDK project.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Kind Installation](#kind-installation)
- [Cluster Management](#cluster-management)
- [Image Management](#image-management)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Advanced Configuration](#advanced-configuration)

## Prerequisites

### Required Software
- **Kind**: Kubernetes in Docker
- **kubectl**: Kubernetes command-line tool
- **Docker/Podman**: Container runtime
- **Bun**: JavaScript runtime (for building the app)

### Installation Commands
```bash
# Install Kind (macOS with Homebrew)
brew install kind

# Install kubectl (if not already installed)
brew install kubectl

# Verify installations
kind version
kubectl version --client
```

## Kind Experimental Provider Configuration

### Setting Environment Variables

For Podman users (recommended for macOS):
```bash
# Set the experimental provider to use Podman
export KIND_EXPERIMENTAL_PROVIDER=podman

# Verify the setting
echo $KIND_EXPERIMENTAL_PROVIDER
```

For Docker users:
```bash
# Set the experimental provider to use Docker
export KIND_EXPERIMENTAL_PROVIDER=docker

# Or unset to use default Docker
unset KIND_EXPERIMENTAL_PROVIDER
```

### Making Environment Variables Persistent

Add to your shell profile (`~/.zshrc`, `~/.bashrc`, etc.):
```bash
# For Podman users
echo 'export KIND_EXPERIMENTAL_PROVIDER=podman' >> ~/.zshrc

# Reload shell configuration
source ~/.zshrc
```

## Cluster Management

### Basic Cluster Operations

#### Create a Cluster
```bash
# Create a basic cluster with default name 'kind'
kind create cluster

# Create a cluster with custom name
kind create cluster --name agentforce-cluster

# Create cluster with specific Kubernetes version
kind create cluster --name agentforce-cluster --image kindest/node:v1.28.0
```

#### List Clusters
```bash
# List all Kind clusters
kind get clusters
```

#### Get Cluster Info
```bash
# Get cluster info for default cluster
kind get kubeconfig

# Get cluster info for specific cluster
kind get kubeconfig --name agentforce-cluster

# Get nodes
kind get nodes

# Get nodes for specific cluster
kind get nodes --name agentforce-cluster
```

#### Delete Clusters
```bash
# Delete default cluster
kind delete cluster

# Delete specific cluster
kind delete cluster --name agentforce-cluster

# Delete all clusters
kind delete clusters --all
```

### Advanced Cluster Configuration

#### Custom Cluster Configuration File
Create `kind-config.yaml`:
```yaml
# kind-config.yaml
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
name: agentforce-cluster
nodes:
- role: control-plane
  image: kindest/node:v1.28.0
  kubeadmConfigPatches:
  - |
    kind: InitConfiguration
    nodeRegistration:
      kubeletExtraArgs:
        node-labels: "ingress-ready=true"
  extraPortMappings:
  - containerPort: 80
    hostPort: 80
    protocol: TCP
  - containerPort: 443
    hostPort: 443
    protocol: TCP
  - containerPort: 3000
    hostPort: 3000
    protocol: TCP
- role: worker
  image: kindest/node:v1.28.0
- role: worker
  image: kindest/node:v1.28.0
networking:
  # By default the API server listens on a random port
  # You can set it to a specific port
  apiServerPort: 6443
  # By default pods and services in the cluster use these subnets
  podSubnet: "10.244.0.0/16"
  serviceSubnet: "10.96.0.0/12"
```

#### Create Cluster with Configuration
```bash
# Create cluster using configuration file
kind create cluster --config kind-config.yaml

# Create with specific name and config
kind create cluster --name agentforce-cluster --config kind-config.yaml
```

## Image Management

### Building and Loading Images

#### Build AgentForce Server Image
```bash
# Build the Docker image using Podman/Docker
docker build -t agentforce-server:latest .

# Build with specific tag
docker build -t agentforce-server:v1.0.0 .
```

#### Load Images into Kind Cluster
```bash
# Load image into default cluster
kind load docker-image agentforce-server:latest

# Load image into specific cluster
kind load docker-image agentforce-server:latest --name agentforce-cluster

# Load multiple images
kind load docker-image agentforce-server:latest nginx:alpine --name agentforce-cluster

# Load image with different tag
kind load docker-image agentforce-server:v1.0.0 --name agentforce-cluster
```

#### Verify Images in Cluster
```bash
# List all images in cluster nodes
docker exec -it agentforce-cluster-control-plane crictl images

# List specific image
docker exec -it agentforce-cluster-control-plane crictl images | grep agentforce
```

#### Alternative: Load from Archive
```bash
# Save image to archive
docker save agentforce-server:latest > agentforce-server.tar

# Load from archive into Kind
kind load image-archive agentforce-server.tar --name agentforce-cluster
```

## Deployment

### Kubernetes Manifests

#### Deployment Manifest (`k8s-deployment.yaml`)
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: agentforce-server
  labels:
    app: agentforce-server
spec:
  replicas: 3
  selector:
    matchLabels:
      app: agentforce-server
  template:
    metadata:
      labels:
        app: agentforce-server
    spec:
      containers:
      - name: agentforce-server
        image: agentforce-server:latest
        imagePullPolicy: Never  # Important for local images
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        resources:
          requests:
            memory: "64Mi"
            cpu: "50m"
          limits:
            memory: "128Mi"
            cpu: "100m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 30
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 10
```

#### Service Manifest (`k8s-service.yaml`)
```yaml
apiVersion: v1
kind: Service
metadata:
  name: agentforce-service
  labels:
    app: agentforce-server
spec:
  type: LoadBalancer
  ports:
  - port: 3000
    targetPort: 3000
    protocol: TCP
    name: http
  selector:
    app: agentforce-server
```

### Deployment Commands

#### Deploy to Cluster
```bash
# Apply deployment and service
kubectl apply -f k8s-deployment.yaml
kubectl apply -f k8s-service.yaml

# Or apply all manifests in directory
kubectl apply -f .

# Apply with specific context
kubectl apply -f k8s-deployment.yaml --context kind-agentforce-cluster
```

#### Check Deployment Status
```bash
# Get deployments
kubectl get deployments

# Get pods
kubectl get pods

# Get services
kubectl get services

# Get all resources
kubectl get all

# Describe deployment
kubectl describe deployment agentforce-server

# Get pod logs
kubectl logs -l app=agentforce-server

# Follow logs
kubectl logs -f deployment/agentforce-server
```

### Port Forwarding and Access

#### Port Forward to Service
```bash
# Forward local port 8080 to service port 3000
kubectl port-forward service/agentforce-service 8080:3000

# Forward to specific pod
kubectl port-forward pod/<pod-name> 8080:3000

# Forward in background
kubectl port-forward service/agentforce-service 8080:3000 &
```

#### Test Endpoints
```bash
# Test root endpoint
curl http://localhost:8080/

# Test health endpoint
curl http://localhost:8080/health

# Test with detailed output
curl -v http://localhost:8080/health
```

## Troubleshooting

### Common Issues and Solutions

#### 1. Kind Cluster Won't Start
```bash
# Check if Docker/Podman is running
docker version
podman version

# Check Kind provider
echo $KIND_EXPERIMENTAL_PROVIDER

# Clean up and recreate
kind delete cluster --name agentforce-cluster
kind create cluster --name agentforce-cluster
```

#### 2. Image Not Found in Cluster
```bash
# Verify image exists locally
docker images | grep agentforce

# Re-load image into cluster
kind load docker-image agentforce-server:latest --name agentforce-cluster

# Check if image is in cluster
docker exec -it agentforce-cluster-control-plane crictl images
```

#### 3. Pods in ImagePullBackOff
```bash
# Check pod events
kubectl describe pod <pod-name>

# Ensure imagePullPolicy is set to Never for local images
kubectl patch deployment agentforce-server -p '{"spec":{"template":{"spec":{"containers":[{"name":"agentforce-server","imagePullPolicy":"Never"}]}}}}'
```

#### 4. Service Not Accessible
```bash
# Check service endpoints
kubectl get endpoints agentforce-service

# Check if pods are ready
kubectl get pods -o wide

# Test service directly
kubectl exec -it <pod-name> -- curl http://localhost:3000/health
```

### Debug Commands

#### Cluster Debugging
```bash
# Get cluster info
kubectl cluster-info

# Get node status
kubectl get nodes -o wide

# Check cluster events
kubectl get events --sort-by=.metadata.creationTimestamp

# Get detailed cluster info
kubectl cluster-info dump
```

#### Container Debugging
```bash
# Execute shell in pod
kubectl exec -it <pod-name> -- /bin/sh

# Check container logs
kubectl logs <pod-name> -c <container-name>

# Get resource usage
kubectl top pods
kubectl top nodes
```

### Log Analysis

#### Viewing Logs
```bash
# Get logs from all pods
kubectl logs -l app=agentforce-server --all-containers=true

# Get logs with timestamps
kubectl logs -l app=agentforce-server --timestamps=true

# Get previous container logs
kubectl logs <pod-name> --previous

# Stream logs
kubectl logs -f deployment/agentforce-server
```

## Advanced Configuration

### Multi-Node Cluster
```yaml
# kind-multi-node.yaml
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
name: agentforce-multi
nodes:
- role: control-plane
- role: worker
  labels:
    app: agentforce
- role: worker
  labels:
    app: agentforce
- role: worker
  labels:
    app: database
```

### Ingress Setup
```bash
# Install NGINX Ingress Controller
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml

# Wait for ingress controller to be ready
kubectl wait --namespace ingress-nginx \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/component=controller \
  --timeout=90s
```

### Volume Mounts
```yaml
# kind-with-volumes.yaml
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
nodes:
- role: control-plane
  extraMounts:
  - hostPath: /path/to/local/data
    containerPath: /data
    readOnly: false
    selinuxRelabel: false
    propagation: None
```

## Environment Variables Reference

### Kind Environment Variables
```bash
# Provider selection
export KIND_EXPERIMENTAL_PROVIDER=podman  # or docker

# Custom cluster name prefix
export KIND_CLUSTER_NAME=agentforce

# Custom kubeconfig location
export KUBECONFIG=~/.kube/kind-config

# Docker/Podman socket path (if non-standard)
export DOCKER_HOST=unix:///var/run/docker.sock
```

### Useful Aliases
```bash
# Add to ~/.zshrc or ~/.bashrc
alias k='kubectl'
alias kgp='kubectl get pods'
alias kgs='kubectl get services'
alias kgd='kubectl get deployments'
alias kga='kubectl get all'
alias klogs='kubectl logs'
alias kdesc='kubectl describe'

# Kind specific aliases
alias kind-create='kind create cluster --name agentforce-cluster'
alias kind-delete='kind delete cluster --name agentforce-cluster'
alias kind-load='kind load docker-image agentforce-server:latest --name agentforce-cluster'
```

## Complete Workflow Example

### End-to-End Deployment
```bash
#!/bin/bash
# deploy-to-kind.sh

set -e

echo "🏗️  Building AgentForce server image..."
docker build -t agentforce-server:latest .

echo "🚀 Creating Kind cluster..."
export KIND_EXPERIMENTAL_PROVIDER=podman
kind create cluster --name agentforce-cluster

echo "📦 Loading image into cluster..."
kind load docker-image agentforce-server:latest --name agentforce-cluster

echo "🎯 Deploying to Kubernetes..."
kubectl apply -f k8s-deployment.yaml
kubectl apply -f k8s-service.yaml

echo "⏳ Waiting for deployment to be ready..."
kubectl wait --for=condition=available --timeout=300s deployment/agentforce-server

echo "🔍 Checking deployment status..."
kubectl get pods -l app=agentforce-server

echo "🌐 Starting port forwarding..."
kubectl port-forward service/agentforce-service 8080:3000 &
PORT_FORWARD_PID=$!

sleep 5

echo "✅ Testing endpoints..."
curl -s http://localhost:8080/ | jq .
curl -s http://localhost:8080/health | jq .

echo "🎉 Deployment complete!"
echo "Access your application at: http://localhost:8080"
echo "To stop port forwarding: kill $PORT_FORWARD_PID"
```

### Cleanup Script
```bash
#!/bin/bash
# cleanup-kind.sh

echo "🧹 Cleaning up Kind cluster..."
kubectl delete -f k8s-deployment.yaml --ignore-not-found=true
kubectl delete -f k8s-service.yaml --ignore-not-found=true
kind delete cluster --name agentforce-cluster

echo "✅ Cleanup complete!"
```

This comprehensive guide covers all aspects of using Kind with your AgentForce SDK, from basic setup to advanced configurations and troubleshooting.
