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

### Build and Run the Docker Environment

First, make the entrypoint script executable:
```bash
chmod +x docker-entrypoint.sh
```

Then build and start the services:
```bash
# Build and start the IC replica
docker compose up -d

# Deploy the canisters
docker compose exec ic-replica bash -c "cd /home/ic-user/project && /usr/local/bin/dfx deploy"
```

## Using the Environment

### Minting NFTs

After deployment, you can interact with your NFT canister to mint NFTs through the frontend or using dfx commands.

### Container Logs

View logs for a specific service:
```bash
docker compose logs ic-replica
```

### Making Changes to Motoko Code

1. Edit your Motoko files in the `src/` directory
2. Redeploy your changes:
   ```bash
   docker compose exec ic-replica bash -c "cd /home/ic-user/project && /usr/local/bin/dfx deploy"
   ```



This project is licensed under the Apache License 2.0.