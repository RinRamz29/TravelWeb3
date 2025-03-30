#!/bin/bash
set -e

# Print debug info
echo "Checking environment:"
echo "Current user: $(whoami)"
echo "HOME: $HOME"
echo "PATH: $PATH"
echo "Working directory: $(pwd)"
echo "Command arguments: $@"

# Set HOME explicitly when running as root
if [ "$(whoami)" = "root" ]; then
    export HOME="/home/ic-user"
    echo "Running as root, setting HOME to $HOME"
fi

# Set up DFXVM and select a default version
echo "Setting up DFXVM..."

# Check if dfxvm is installed and in path
if which dfxvm > /dev/null 2>&1; then
    echo "DFXVM is installed, setting a default version..."
    
    # Explicitly install version 0.25.1
    echo "Installing DFX version 0.25.1..."
    dfxvm install 0.25.1 || echo "Failed to install version 0.25.1, continuing anyway..."
    
    # Set as default
    echo "Setting 0.25.1 as default version..."
    dfxvm default 0.25.1
    
    # Make sure dfx is now accessible
    if ! which dfx > /dev/null 2>&1; then
        echo "Setting up dfx in path..."
        export PATH="/root/.local/share/dfx/bin:$PATH"
    fi
else
    echo "DFXVM not found, checking for standalone dfx..."
    
    # Common locations for dfx binary
    DFX_LOCATIONS=(
        "/root/.local/share/dfx/bin/dfx"
        "/root/.local/share/dfx/versions/0.25.1/dfx"
        "/home/ic-user/.local/share/dfx/bin/dfx"
        "/home/ic-user/.local/share/dfx/versions/0.25.1/dfx"
        "/usr/local/bin/dfx"
    )
    
    for LOCATION in "${DFX_LOCATIONS[@]}"; do
        if [ -f "$LOCATION" ] && [ -x "$LOCATION" ]; then
            echo "Found dfx at $LOCATION"
            export PATH="$(dirname "$LOCATION"):$PATH"
            ln -sf "$LOCATION" /usr/local/bin/dfx
            break
        fi
    done
    
    # If dfx is still not found, try to install it
    if ! which dfx > /dev/null 2>&1; then
        echo "DFX not found, installing via DFXVM..."
        export DFXVM_INIT_YES=true
        curl -fsSL https://internetcomputer.org/install.sh | sh
        export PATH="/root/.local/share/dfx/bin:$PATH"
        dfxvm install 0.25.1 || echo "Failed to install version 0.25.1, continuing anyway..."
        dfxvm default 0.25.1
    fi
fi

# Final check for dfx in PATH
if ! which dfx > /dev/null 2>&1; then
    echo "ERROR: Could not find or install dfx."
    echo "Attempting manual installation of standalone dfx..."
    
    # Install standalone dfx as a fallback
    DFX_VERSION=0.25.1
    echo "Installing standalone dfx version ${DFX_VERSION}..."
    
    # Download and install dfx directly
    mkdir -p /usr/local/bin
    curl -fsSL "https://github.com/dfinity/sdk/releases/download/${DFX_VERSION}/dfx-${DFX_VERSION}-x86_64-linux.tar.gz" | tar -xz -C /usr/local/bin
    
    if ! which dfx > /dev/null 2>&1; then
        echo "Critical error: All attempts to install dfx have failed."
        exit 1
    fi
fi

echo "DFX executable path: $(which dfx)"
echo "DFX version: $(dfx --version 2>&1 || echo "Could not determine dfx version")"

# Set environment variables for dfx
# Note: We're not using --disable-crypto-key-verification flag as it may not be supported
export DFX_NOT_REMOTE=true 
export DFX_DISABLE_AUTH_FETCH=true

# Function to fix crypto directory permissions
fix_dfx_permissions() {
    echo "Fixing DFX crypto directory permissions..."
    # Clean any existing .dfx directory
    if [ -d ".dfx" ]; then
        echo "Removing existing .dfx directory..."
        rm -rf .dfx
    fi
    
    # Create the directory structure with correct permissions
    mkdir -p .dfx/network/local/state/replicated_state/node-100/crypto
    
    # Set very strict permissions on the crypto directory
    chmod 700 .dfx/network/local/state/replicated_state/node-100/crypto
    
    # Make sure parent directories don't have world-writable permissions
    chmod 755 .dfx
    chmod 755 .dfx/network
    chmod 755 .dfx/network/local
    chmod 755 .dfx/network/local/state
    chmod 755 .dfx/network/local/state/replicated_state
    chmod 755 .dfx/network/local/state/replicated_state/node-100
    
    # Fix ownership if running as root
    if [ "$(whoami)" = "root" ]; then
        echo "Setting correct ownership for .dfx directory..."
        chown -R ic-user:ic-user .dfx
        # Ensure the crypto directory still has correct permissions
        chmod 700 .dfx/network/local/state/replicated_state/node-100/crypto
    fi
}

# Start dfx in the background if requested
if [ "$1" = "dfx-start" ]; then
    echo "Starting dfx in background mode..."
    cd /home/ic-user/project || exit 1
    
    # Fix permissions before starting
    fix_dfx_permissions
    
    # Deploy Internet Identity canister
    echo "Deploying Internet Identity canister..."
    cd /home/ic-user/project
    
    # Deploy the Internet Identity canister
    echo "Deploying Internet Identity canister..."
    dfx deploy internet_identity || echo "Warning: Failed to deploy Internet Identity canister, but continuing..."
    echo "Internet Identity canister deployment completed"
    
    # Make sure the network directory exists with proper permissions
    mkdir -p .dfx/network
    chmod -R 755 .dfx
    
    echo "Starting local IC replica with disabled crypto key verification..."
    
    # Run dfx command with more verbose output and error handling
    set +e
    # Try first without the --disable-crypto-key-verification flag
    echo "Attempting to start dfx without --disable-crypto-key-verification flag..."
    # Check crypto directory permissions one more time before starting
    ls -la .dfx/network/local/state/replicated_state/node-100
    chmod 700 .dfx/network/local/state/replicated_state/node-100/crypto
    ls -la .dfx/network/local/state/replicated_state/node-100/crypto
    
    dfx start --clean --background --host 0.0.0.0:8000
    DFX_START_RESULT=$?
    
    if [ $DFX_START_RESULT -ne 0 ]; then
        echo "ERROR: dfx start command failed with exit code $DFX_START_RESULT"
        echo "Attempting to run with different arguments..."
        # Try with network flag as a fallback
        dfx start --clean --background --host 0.0.0.0:8000 --network=local
        DFX_START_RESULT=$?
        
        if [ $DFX_START_RESULT -ne 0 ]; then
            echo "ERROR: All attempts to start dfx have failed."
            echo "Checking dfx status..." 
            dfx info
            dfx status --network=local
            exit 1
        fi
    fi
    set -e
    
    echo "IC replica started. Running ping check to verify..."
    # Try to ping the replica to make sure it's really running
    sleep 5
    dfx ping || echo "Warning: Initial ping failed, but container will remain running"
    
    # Keep container running
    echo "Container will now remain running. Use docker logs to view output."
    exec tail -f /dev/null
    
elif [ "$1" = "mint" ]; then
    echo "Running NFT minting script..."
    cd /home/ic-user/project
    
    # Check if ic-replica is running
    echo "Waiting for IC replica to be ready..."
    MAX_ATTEMPTS=30
    ATTEMPT=1
    
    while [ $ATTEMPT -le $MAX_ATTEMPTS ]; do
        echo "Attempt $ATTEMPT/$MAX_ATTEMPTS: Checking if IC replica is running..."
        if dfx ping --network ic-replica 2>/dev/null; then
            echo "IC replica is ready! Proceeding with minting."
            break
        fi
        
        if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
            echo "Failed to connect to IC replica after $MAX_ATTEMPTS attempts. Exiting."
            exit 1
        fi
        
        echo "IC replica not ready yet. Waiting 5 seconds..."
        sleep 5
        ATTEMPT=$((ATTEMPT + 1))
    done
    
    # Execute the mint_nfts.py script
    python3 /home/ic-user/project/mint_nfts.py
else
    # Default behavior if no specific command is given
    echo "No specific command provided. Starting an interactive shell."
    cd /home/ic-user/project
    exec bash
fi
