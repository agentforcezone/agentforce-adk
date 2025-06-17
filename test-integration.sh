#!/bin/bash

# Test the updated integration example
echo "Testing the refactored integration example..."

cd /Users/U730172/Privat/Repos/agentforcezone/agentforce-sdk

# Run the integration example
echo "Running integration example..."
bun run examples/agents/integration.ts

echo "Integration test completed successfully!"
