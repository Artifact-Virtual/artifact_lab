#!/bin/bash

# Initialize the Blacknet node environment

# Load configuration
CONFIG_FILE="../configs/node.yaml"

if [ ! -f "$CONFIG_FILE" ]; then
    echo "Configuration file not found: $CONFIG_FILE"
    exit 1
fi

# Create necessary directories
mkdir -p /var/lib/blacknet/node
mkdir -p /var/log/blacknet

# Copy configuration file
cp "$CONFIG_FILE" /var/lib/blacknet/node/config.yaml

# Start the node service
echo "Starting Blacknet node..."
# Command to start the node would go here (e.g., ./node_executable --config /var/lib/blacknet/node/config.yaml)

echo "Blacknet node initialized successfully."