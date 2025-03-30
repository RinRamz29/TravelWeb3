#!/bin/bash
# Filename: crypto-fix.sh
set -e

echo "Starting with debug info:"
echo "Current user: $(whoami)"
echo "Current directory: $(pwd)"

# Setup directory structure
cd /home/ic-user/project
echo "Setting up IC replica..."

# Create all parent directories first
echo "Creating directory structure..."
mkdir -p .dfx/network/local/state/replicated_state/node-100

# The mount point for the crypto volume will be created by Docker
# Ensure the parent directories have the right permissions
chmod 755 .dfx
chmod 755 .dfx/network
chmod 755 .dfx/network/local
chmod 755 .dfx/network/local/state
chmod 755 .dfx/network/local/state/replicated_state
chmod 755 .dfx/network/local/state/replicated_state/node-100

# Now set permissions for the crypto directory (mounted as a volume)
echo "Setting crypto directory permissions..."
mkdir -p .dfx/network/local/state/replicated_state/node-100/crypto
chmod 700 .dfx/network/local/state/replicated_state/node-100/crypto

# Fix ownership
if [ "$(whoami)" = "root" ]; then
    echo "Setting ownership to ic-user..."
    chown -R ic-user:ic-user .dfx
fi

# Verify crypto directory permissions
echo "Verifying crypto directory permissions:"
ls -la .dfx/network/local/state/replicated_state/node-100/crypto

# Install standalone dfx
echo "Installing standalone dfx..."
DFX_VERSION=0.25.1
curl -fsSL "https://github.com/dfinity/sdk/releases/download/${DFX_VERSION}/dfx-${DFX_VERSION}-x86_64-linux.tar.gz" | tar -xz -C /usr/local/bin
chmod +x /usr/local/bin/dfx

# Verify installation
echo "Verifying dfx installation..."
/usr/local/bin/dfx --version

# Start dfx as ic-user (since we're running as root)
echo "Starting IC replica as ic-user..."
su - ic-user -c "cd /home/ic-user/project && /usr/local/bin/dfx start --clean --host 0.0.0.0:8000" &

# Wait and check
sleep 10
if su - ic-user -c "cd /home/ic-user/project && /usr/local/bin/dfx ping"; then
    echo "IC replica started successfully."
else
    echo "Warning: Could not ping the replica. Checking status..."
    su - ic-user -c "cd /home/ic-user/project && /usr/local/bin/dfx info"
fi

# Keep container running
echo "Container will remain running..."
tail -f /dev/null