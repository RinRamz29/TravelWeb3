# Travel3 NFT Docker Setup Guide

This guide explains how to set up and run your Internet Computer NFT minting project using Docker containers. This approach resolves permission issues on WSL and provides a consistent environment for development.

## Prerequisites

- Docker: [Install Docker](https://docs.docker.com/get-docker/)
- Docker Compose: [Install Docker Compose](https://docs.docker.com/compose/install/)

## Project Files

Ensure you have the following files in your project directory:

1. `Dockerfile`: Defines the container environment
2. `docker-entrypoint.sh`: Script for container startup 
3. `mint_nfts.py`: Python script for NFT minting
4. `docker-compose.yml`: Defines the multi-container setup
5. Your Motoko code files (main.mo, types.mo, etc.)
6. Your project configuration (dfx.json)

## Project Structure

Your directory should look like this:

```
travel3Motoko/
├── Dockerfile
├── docker-compose.yml
├── docker-entrypoint.sh
├── mint_nfts.py
├── dfx.json
├── src/
│   ├── Travel3Nft_backend/
│   │   ├── main.mo
│   │   └── types.mo
│   └── Travel3Nft_frontend/
│       └── ...
└── README.md
```

## Setting Up

1. Make sure all the files are in the correct location
2. Make the entrypoint script executable:

```bash
chmod +x docker-entrypoint.sh
```

## Running the Docker Environment

### Starting the IC Replica

Start the IC replica in a container:

```bash
docker-compose up ic-replica -d
```

This will:
- Build the Docker image
- Start the IC replica in the background
- Make it accessible on port 8000

### Minting NFTs

Once the replica is running, you can mint your NFTs:

```bash
docker-compose up mint-nfts
```

This will:
- Connect to the running replica
- Run the minting script
- Exit when complete

### Working with the Shell

For interactive work with the dfx tools:

```bash
docker-compose run dfx-shell
```

This gives you a bash shell inside the container with all the tools installed.

## Common Tasks

### View Container Logs

```bash
docker-compose logs ic-replica
```

### Stopping All Containers

```bash
docker-compose down
```

### Full Reset

To completely restart with a clean state:

```bash
docker-compose down -v
docker-compose up ic-replica -d
```

The `-v` flag removes the associated volumes, ensuring a fresh start.

## Troubleshooting

### Replica Not Starting

If the replica isn't starting properly, check the logs:

```bash
docker-compose logs ic-replica
```

### Permission Issues

If you encounter any permission issues with the files:

```bash
sudo chown -R $(id -u):$(id -g) .
```

### Network Connectivity

If containers can't communicate:

```bash
docker network inspect travel3motoko_default
```

## Additional Configuration

### Modifying DFX Version

To use a specific version of dfx, edit the Dockerfile:

```dockerfile
RUN DFX_VERSION=0.15.0 sh -ci "$(curl -fsSL https://internetcomputer.org/install.sh)"
```

### Persistent Identity

Your dfx identity is stored in a volume, so it persists between container restarts.

## Deploying to Mainnet

To deploy to the IC mainnet, you can use the dfx-shell:

```bash
docker-compose run dfx-shell
dfx deploy --network ic
```

Remember to configure your mainnet credentials first.