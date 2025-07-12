# Kind Kubernetes Cluster for AgentForce SDK

This document provides instructions for managing the Kind Kubernetes cluster for the AgentForce SDK.

## Cluster Information

- **Cluster Name**: `agentforce-cluster`
- **Provider**: Podman (experimental)
- **Kubernetes Version**: v1.29.2
- **Context**: `kind-agentforce-cluster`

## Quick Commands

### Cluster Management

```bash
# Check cluster status
kubectl cluster-info --context kind-agentforce-cluster

# Get cluster nodes
kubectl get nodes

# Delete the cluster
kind delete cluster --name agentforce-cluster
```

### Application Management

```bash
# Deploy AgentForce server
kubectl apply -f k8s-deployment.yaml

# Check deployment status
kubectl get deployments
kubectl get pods
kubectl get services

# View application logs
kubectl logs deployment/agentforce-server --tail=20
kubectl logs -f deployment/agentforce-server  # Follow logs

# Scale the deployment
kubectl scale deployment agentforce-server --replicas=3

# Delete the deployment
kubectl delete -f k8s-deployment.yaml
```

### Service Access

```bash
# Port forward to access the service locally
kubectl port-forward service/agentforce-server-service 8080:80

# Access the application
curl http://localhost:8080/
curl http://localhost:8080/health
```

### Debugging

```bash
# Describe a pod for troubleshooting
kubectl describe pod <pod-name>

# Get events
kubectl get events --sort-by=.metadata.creationTimestamp

# Execute commands in a pod
kubectl exec -it <pod-name> -- /bin/bash

# Check service endpoints
kubectl get endpoints
```

## Deployment Details

### Resources Deployed

1. **Deployment**: `agentforce-server`
   - 2 replicas by default
   - Health checks enabled
   - Resource limits set

2. **Service**: `agentforce-server-service`
   - LoadBalancer type (pending in Kind)
   - Port 80 → 3000

3. **Ingress**: `agentforce-server-ingress`
   - Basic ingress configuration

### Resource Specifications

- **CPU Request**: 50m, **Limit**: 100m
- **Memory Request**: 64Mi, **Limit**: 128Mi
- **Container Port**: 3000
- **Health Check**: `/health` endpoint

## Image Management

```bash
# Build and load image into Kind cluster
docker build --load -t agentforce-server .
KIND_EXPERIMENTAL_PROVIDER=podman kind load docker-image agentforce-server:latest --name agentforce-cluster

# Update deployment after image changes
kubectl rollout restart deployment/agentforce-server
kubectl rollout status deployment/agentforce-server
```

## Useful kubectl Commands

```bash
# Watch resources in real-time
kubectl get pods -w
kubectl get deployments -w

# Get detailed resource information
kubectl describe deployment agentforce-server
kubectl describe service agentforce-server-service

# Check resource usage
kubectl top nodes
kubectl top pods

# Get all resources
kubectl get all
```

## Troubleshooting

### Common Issues

1. **Pods not starting**: Check `kubectl describe pod <pod-name>`
2. **Image pull errors**: Ensure image is loaded with `kind load docker-image`
3. **Service not accessible**: Use `kubectl port-forward` for local access
4. **Health check failures**: Check application logs and health endpoint

### Recovery Commands

```bash
# Restart all pods
kubectl rollout restart deployment/agentforce-server

# Delete and recreate resources
kubectl delete -f k8s-deployment.yaml
kubectl apply -f k8s-deployment.yaml

# Clean restart of cluster
kind delete cluster --name agentforce-cluster
KIND_EXPERIMENTAL_PROVIDER=podman kind create cluster --name agentforce-cluster
```

## Environment Variables

The deployment uses the following environment variables:
- `NODE_ENV=production`

## Health Checks

- **Liveness Probe**: HTTP GET `/health` (port 3000)
- **Readiness Probe**: HTTP GET `/health` (port 3000)

## Next Steps

1. **Add Ingress Controller**: Install nginx-ingress for external access
2. **Persistent Storage**: Add volumes for data persistence
3. **ConfigMaps/Secrets**: Externalize configuration
4. **Monitoring**: Add Prometheus/Grafana for monitoring
5. **Logging**: Set up centralized logging with ELK stack
