#!/bin/bash

# Build all components of the Blacknet project

# Navigate to the client directory and build the client
echo "Building client..."
cd client
cargo build --release
if [ $? -ne 0 ]; then
    echo "Client build failed!"
    exit 1
fi
cd ..

# Navigate to the node directory and build the node
echo "Building node..."
cd node
cargo build --release
if [ $? -ne 0 ]; then
    echo "Node build failed!"
    exit 1
fi
cd ..

# Navigate to the crypto directory and build the crypto components
echo "Building crypto components..."
cd crypto
cargo build --release
if [ $? -ne 0 ]; then
    echo "Crypto build failed!"
    exit 1
fi
cd ..

# Navigate to the snappkit directory and build the SDK
echo "Building SNAppKit SDK..."
cd snappkit
cargo build --release
if [ $? -ne 0 ]; then
    echo "SNAppKit build failed!"
    exit 1
fi
cd ..

# Build the tools
echo "Building tools..."
cd tools/blackcli
cargo build --release
if [ $? -ne 0 ]; then
    echo "BlackCLI build failed!"
    exit 1
fi
cd ../monitor
cargo build --release
if [ $? -ne 0 ]; then
    echo "Monitor build failed!"
    exit 1
fi
cd ../../..

echo "All components built successfully!"