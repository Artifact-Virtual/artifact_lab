# Makefile

# Makefile for Blacknet Project

# Variables
PROJECT_NAME := blacknet
CLIENT_DIR := client
NODE_DIR := node
CRYPTO_DIR := crypto
SNAPPKIT_DIR := snappkit
TESTNET_DIR := testnet
DEPLOYMENTS_DIR := deployments

# Build targets
.PHONY: all clean build client node crypto snappkit testnet

all: build

build: client node crypto snappkit

client:
	@echo "Building Client..."
	cargo build --manifest-path=$(CLIENT_DIR)/Cargo.toml

node:
	@echo "Building Node..."
	cargo build --manifest-path=$(NODE_DIR)/Cargo.toml

crypto:
	@echo "Building Crypto..."
	cargo build --manifest-path=$(CRYPTO_DIR)/Cargo.toml

snappkit:
	@echo "Building SNAppKit..."
	cargo build --manifest-path=$(SNAPPKIT_DIR)/Cargo.toml

testnet:
	@echo "Setting up Testnet..."
	$(TESTNET_DIR)/bootstrap.sh

clean:
	@echo "Cleaning up..."
	cargo clean --manifest-path=$(CLIENT_DIR)/Cargo.toml
	cargo clean --manifest-path=$(NODE_DIR)/Cargo.toml
	cargo clean --manifest-path=$(CRYPTO_DIR)/Cargo.toml
	cargo clean --manifest-path=$(SNAPPKIT_DIR)/Cargo.toml

# Deployment targets
.PHONY: deploy

deploy:
	@echo "Deploying Blacknet..."
	# Add deployment commands here (e.g., Helm, Docker, Ansible)