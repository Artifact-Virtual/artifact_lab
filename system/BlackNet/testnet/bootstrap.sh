#!/bin/bash

# This script sets up the local testing environment for the Blacknet project.

# Create necessary directories
mkdir -p ./testnet/logs
mkdir -p ./testnet/data

# Initialize configuration
echo "Initializing testnet configuration..."
cp ./configs/node.yaml ./testnet/test_config.yaml

# Start local services
echo "Starting local services..."
# Placeholder for starting services (e.g., relay, mix, exit nodes)
# ./node/relay/main &
# ./node/mix/main &
# ./node/exit/main &

echo "Testnet environment setup complete."