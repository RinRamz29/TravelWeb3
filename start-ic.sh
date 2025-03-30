#!/bin/bash
# Filename: start-ic.sh
set -e

echo "Starting IC replica setup..."
echo "Current user: $(whoami)"
cd /home/ic-user/project

# Install required libraries
echo "Installing required libraries..."
apt-get update
apt-get install -y libunwind8

# Create .dfx directory with proper permissions
mkdir -p .dfx
chmod 755 .dfx

# Create the crypto directory path with proper permissions
mkdir -p .dfx/network/local/state/replicated_state/node-100/crypto
chmod 700 .dfx/network/local/state/replicated_state/node-100/crypto

# Fix ownership
chown -R ic-user:ic-user .dfx

# Verify permissions
echo "Crypto directory permissions:"
ls -la .dfx/network/local/state/replicated_state/node-100/crypto

# Install standalone dfx directly to avoid dfxvm issues
echo "Installing standalone dfx..."
DFX_VERSION=0.25.1
curl -fsSL "https://github.com/dfinity/sdk/releases/download/${DFX_VERSION}/dfx-${DFX_VERSION}-x86_64-linux.tar.gz" | tar -xz -C /usr/local/bin
chmod +x /usr/local/bin/dfx

# Verify installation
echo "Verifying dfx installation:"
/usr/local/bin/dfx --version

# First, modify dfx.json to set replica type to emulator
echo "Configuring dfx.json for emulator replica..."
cp dfx.json dfx.json.bak
sed -i 's/"type": "persistent"/"type": "ephemeral"/' dfx.json || echo "Failed to modify dfx.json, continuing anyway"

# Start dfx without trying to clean directories
echo "Starting IC replica as ic-user..."
su - ic-user -c "cd /home/ic-user/project && /usr/local/bin/dfx start --host 0.0.0.0:8000" &

# Wait for startup
sleep 10

# Check if running
if su - ic-user -c "cd /home/ic-user/project && /usr/local/bin/dfx ping"; then
    echo "IC replica started successfully."
else
    echo "Trying again with different approach..."
    # If the first attempt fails, try starting with different flags
    killall dfx 2>/dev/null || true
    
    # Try with a fresh start and force flag
    echo "Trying with force flag..."
    su - ic-user -c "cd /home/ic-user/project && /usr/local/bin/dfx start --host 0.0.0.0:8000 --force" &
    
    sleep 10
    if su - ic-user -c "cd /home/ic-user/project && /usr/local/bin/dfx ping"; then
        echo "IC replica started successfully with force flag."
    else
        echo "Warning: Could not confirm if replica is running."
    fi
fi

# Keep container running
echo "Container will remain running..."
tail -f /dev/null