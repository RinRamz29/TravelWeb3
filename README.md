# Travel3 NFT Project

A Dockerized NFT minting application for the Internet Computer blockchain. This project allows you to mint historical place NFTs with location metadata, images, and documents.

## Overview

This project demonstrates how to:
- Set up a local Internet Computer environment using Docker
- Mint NFTs with rich metadata including images and documents
- Handle the complexities of the Candid interface format correctly
- Solve common issues with WSL permissions and local development

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)

No need to install dfx, Node.js, or any Internet Computer tools locally - they're all included in the Docker image.

## Setup Instructions

### 1. Create Required Files

Create the following files in your project directory:

#### `Dockerfile`
```dockerfile
FROM ubuntu:22.04

# Install essential packages
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    git \
    gnupg \
    build-essential \
    python3 \
    python3-pip \
    cmake \
    unzip \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js (required for dfx)
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Install Rust (required for some IC apps)
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
ENV PATH="/root/.cargo/bin:${PATH}"

# Install DFINITY SDK (dfx) - using non-interactive approach
RUN wget -q -O dfx-install.sh https://internetcomputer.org/install.sh \
    && DFX_NON_INTERACTIVE=true bash dfx-install.sh \
    && rm dfx-install.sh

# Create a non-root user for running dfx
RUN useradd -m -s /bin/bash ic-user
USER ic-user
WORKDIR /home/ic-user

# Expose DFX ports
EXPOSE 8000 8080

# Entry point script
COPY --chown=ic-user:ic-user docker-entrypoint.sh /home/ic-user/
RUN chmod +x /home/ic-user/docker-entrypoint.sh

# Set the default command
ENTRYPOINT ["/home/ic-user/docker-entrypoint.sh"]
```

#### `docker-compose.yml`
```yaml
version: '3.8'

services:
  ic-replica:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: travel3-ic-replica
    ports:
      - "8000:8000"  # IC replica API
      - "8080:8080"  # Frontend canister
    volumes:
      - .:/home/ic-user/project
      - dfx-cache:/home/ic-user/.cache/dfx
      - identity:/home/ic-user/.config/dfx/identity
    command: dfx-start
    restart: unless-stopped

  mint-nfts:
    build:
      context: .
      dockerfile: Dockerfile
    depends_on:
      - ic-replica
    volumes:
      - .:/home/ic-user/project
      - dfx-cache:/home/ic-user/.cache/dfx
      - identity:/home/ic-user/.config/dfx/identity
    command: mint
    environment:
      - DFX_NETWORK_HOST=ic-replica

  dfx-shell:
    build:
      context: .
      dockerfile: Dockerfile
    volumes:
      - .:/home/ic-user/project
      - dfx-cache:/home/ic-user/.cache/dfx
      - identity:/home/ic-user/.config/dfx/identity
    command: bash
    stdin_open: true
    tty: true
    environment:
      - DFX_NETWORK_HOST=ic-replica

volumes:
  dfx-cache:
  identity:
```

#### `docker-entrypoint.sh`
Save the content of the enhanced docker-entrypoint.sh that contains the embedded minting script.

#### `dfx.json`
```json
{
  "canisters": {
    "Travel3Nft_backend": {
      "main": "src/Travel3Nft_backend/main.mo",
      "type": "motoko"
    },
    "Travel3Nft_frontend": {
      "dependencies": [
        "Travel3Nft_backend"
      ],
      "frontend": {
        "entrypoint": "src/Travel3Nft_frontend/src/index.html"
      },
      "source": [
        "src/Travel3Nft_frontend/assets",
        "dist/Travel3Nft_frontend/"
      ],
      "type": "assets"
    }
  },
  "defaults": {
    "build": {
      "args": "",
      "packtool": ""
    }
  },
  "version": 1
}
```

### 2. Create Project Structure

Ensure you have the Motoko source files in the correct locations:

```
your-project/
├── Dockerfile
├── docker-compose.yml
├── docker-entrypoint.sh
├── dfx.json
└── src/
    ├── Travel3Nft_backend/
    │   ├── main.mo
    │   └── types.mo
    └── Travel3Nft_frontend/
        └── src/
            └── index.html
```

### 3. Build and Run the Docker Environment

First, make the entrypoint script executable:
```bash
chmod +x docker-entrypoint.sh
```

Then build and start the services:
```bash
# Build the Docker images
docker-compose build

# Start the IC replica in the background
docker-compose up ic-replica -d

# Wait a moment for the replica to start
sleep 10

# Run the NFT minting process
docker-compose up mint-nfts
```

## Using the Environment

### Minting NFTs

The minting process will automatically:
1. Start a local Internet Computer replica
2. Build the canisters
3. Mint three historical place NFTs with metadata
4. Set image and document locations for each NFT

### Working with the dfx Shell

For interactive work with dfx:
```bash
docker-compose run dfx-shell
```

This gives you access to all dfx commands in a properly configured environment.

### Viewing the Frontend

Once deployed, you can access your frontend at:
```
http://localhost:8080
```

## Troubleshooting

### Container Logs

View logs for a specific service:
```bash
docker-compose logs ic-replica
docker-compose logs mint-nfts
```

### Restarting Services

If you need to restart:
```bash
docker-compose down
docker-compose up ic-replica -d
```

### Complete Reset

To start completely fresh:
```bash
docker-compose down -v
docker-compose build --no-cache
docker-compose up ic-replica -d
```

### Container Networking

If services can't communicate:
```bash
docker-compose run dfx-shell
ping ic-replica  # Should respond if networking is working
```

## Developing Your Project

### Making Changes to Motoko Code

1. Edit your Motoko files in the `src/` directory
2. Use the dfx-shell to rebuild and deploy:
   ```bash
   docker-compose run dfx-shell
   dfx deploy
   ```

### Deploying to Mainnet

From the dfx-shell:
```bash
docker-compose run dfx-shell
dfx deploy --network ic
```

## License

This project is licensed under the Apache License 2.0.