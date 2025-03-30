#!/bin/bash
set -e

# Start dfx in the background if requested
if [ "$1" = "dfx-start" ]; then
    echo "Starting dfx in background mode..."
    dfx start --clean --background
    # Keep container running
    tail -f /dev/null
elif [ "$1" = "mint" ]; then
    echo "Running NFT minting script..."
    cd /home/ic-user/app
    python3 mint_nfts.py
elif [ "$1" = "bash" ] || [ "$1" = "shell" ]; then
    exec bash
else
    # Execute the command passed to docker run
    exec "$@"
fi