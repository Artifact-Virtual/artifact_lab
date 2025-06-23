# Architecture of Blacknet

## Overview
The architecture of Blacknet is designed to provide a robust, privacy-focused networking protocol that integrates various layers of functionality to ensure secure and anonymous communication. This document outlines the key components and their interactions within the Blacknet ecosystem.

## Core Components

### 1. Transport Layer
- **Protocol**: Utilizes UDP-over-QUIC for efficient and secure data transmission.
- **Encryption**: Employs the Noise Protocol Framework to ensure confidentiality and integrity of the data.
- **Fallback Mechanism**: TCP over TLS 1.3 is used as a fallback to maintain connectivity in restrictive environments.

### 2. Routing Stack
- **Onion Routing Layer**: Implements a modified version of LLARP to achieve IP-layer anonymity through layered encryption.
- **Mixnet Layer**: Facilitates message mixing and batching, enhancing privacy through pluggable delay strategies.
- **Session Management**: Utilizes ephemeral key exchanges for each tunnel, with key rotation occurring per stream/session to enhance security.

### 3. Identity Layer
- **zk-SNARK Identity Proofs**: Allows for proof of identity without revealing the source or credential, ensuring user privacy.
- **Ephemeral Tokens**: Validated locally and used for routing prioritization and Sybil resistance, enhancing the integrity of the network.

## Node Architecture

### 1. Node Roles
- **Relay Node**: Responsible for routing and mixing packets to obscure the origin of the data.
- **Mix Node**: Provides delay batching and timing obfuscation to further enhance privacy.
- **Exit Node**: Routes anonymized traffic to clearnet destinations, acting as the gateway to the public internet.
- **SNApp Host**: Hosts decentralized applications (SNApps) and serves both public and private content.

### 2. Reputation and Reward System
- **Reputation Metrics**: Nodes are evaluated based on uptime, bandwidth, latency, and behavior through challenge-response mechanisms.
- **Reward Model**: Incorporates optional staking in cryptocurrencies (e.g., Oxen or Monero) and allocates rewards based on reputation and task priority.

### 3. System Configuration
- Nodes are configured using YAML files, supporting dynamic role switching and service registration via DID documents stored on a distributed hash table (DHT).

## Exit System

### 1. Clearnet Gateway Design
- **Smart Exit Interfaces**: Include HTTP(S) proxies, DNS resolvers with encrypted query splitting, and WebSocket tunneling for interactive services.
  
### 2. Bridge Nodes
- **Audited Egress Infrastructure**: Features rotatable public IPs with signed logs and usage tokens signed by client wallets for pseudonymous proof of consent.

## Conclusion
The architecture of Blacknet is a comprehensive framework that integrates advanced cryptographic techniques, dynamic routing mechanisms, and a robust node architecture to provide a secure and anonymous networking experience. This design aims to meet the growing demand for privacy in digital communications while ensuring scalability and resilience against censorship.