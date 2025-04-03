#!/bin/bash

# Update system and install dependencies
echo "Updating system and installing dependencies..."
sudo apt-get update
sudo apt-get install -y npm
sudo npm install n -g
sudo n lts
sudo npm install yarn -g
npm install

# Move to parent directory
cd ../

# Install DFINITY SDK
echo "Installing DFINITY Internet Computer SDK..."
ENV DFXVM_INIT_YES=true
RUN curl -fsSL https://internetcomputer.org/install.sh | sh
echo 'export PATH="$PATH:$HOME/bin"' >> "$HOME/.bashrc"
source "$HOME/.bashrc"

# Install Rust for potential Rust canisters or optimization
echo "Installing Rust and related tools..."
sudo curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
source $HOME/.cargo/env
rustup target add wasm32-unknown-unknown

# Install build essentials and SSL for cmake
sudo apt-get install -y build-essential libssl-dev

# Install CMake from source
echo "Installing CMake..."
cd /tmp
wget https://github.com/Kitware/CMake/releases/download/v3.20.0/cmake-3.20.0.tar.gz
tar -zxvf cmake-3.20.0.tar.gz
cd cmake-3.20.0
./bootstrap
make
sudo make install
cmake --version

# Return to home directory
cd

# Clone and deploy Internet Identity for authentication
echo "Deploying Internet Identity (local)..."
git clone https://github.com/dfinity/internet-identity.git
cd internet-identity
npm ci
cargo install ic-cdk-optimizer --version 0.3.1
dfx start --background
II_FETCH_ROOT_KEY=1 II_DUMMY_CAPTCHA=1 dfx deploy --no-wallet --argument '(null)'

# Get the Internet Identity canister ID
II_CANISTER_ID=$(dfx canister id internet_identity)
echo "Internet Identity canister deployed with ID: $II_CANISTER_ID"

# Return to our project directory
cd ../NFTProject

# Setup project structure
echo "Setting up Historical Places NFT project structure..."
mkdir -p metadata/collection
mkdir -p metadata/token
mkdir -p src/components
mkdir -p public

# Create sample logo.json for collection
echo "Creating sample collection metadata..."
echo '{
  "text": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiB2aWV3Qm94PSIwIDAgMjAwIDIwMCI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiMxODY3OWUiLz48cGF0aCBkPSJNODAgMTUwTDUwIDEwMEwxMTAgMTAwTDgwIDE1MFoiIGZpbGw9IndoaXRlIi8+PHBhdGggZD0iTTEzMCAxNTBMMTAwIDEwMEwxNjAgMTAwTDEzMCAxNTBaIiBmaWxsPSJ3aGl0ZSIvPjxjaXJjbGUgY3g9IjE0MCIgY3k9IjUwIiByPSIyMCIgZmlsbD0iI2YwYjgzYiIvPjwvc3ZnPg=="
}' > metadata/collection/logo.json

# Create sample metadata.json for tokens
echo "Creating sample token metadata..."
echo '{
  "metadata": {
    "0": {
      "iv": "sample_iv_value_1",
      "privateKey": "sample_private_key_1",
      "photoSrc": "https://example.com/path/to/photo1.jpg",
      "thumbnailSrc": "https://example.com/path/to/thumbnail1.jpg",
      "documentSrc": "https://example.com/path/to/document1.pdf",
      "tokenIdentifier": "HP001",
      "photoType": ".jpg",
      "photoLocation": {
        "icp": "https://example.com/path/to/photo1.jpg",
        "ipfs": "ipfs://example-hash-1/photo1.jpg"
      },
      "thumbnailType": ".jpg",
      "thumbnailLocation": {
        "icp": "https://example.com/path/to/thumbnail1.jpg",
        "ipfs": "ipfs://example-hash-1/thumbnail1.jpg"
      },
      "documentType": ".pdf",
      "documentLocation": {
        "icp": "https://example.com/path/to/document1.pdf",
        "ipfs": "ipfs://example-hash-1/document1.pdf"
      },
      "attributes": {
        "name": "The Colosseum",
        "year": 80,
        "location": "Rome, Italy",
        "coordinates": "41.8902°N, 12.4922°E",
        "category": ["Monument", "Ancient", "Roman"],
        "significance": "The Colosseum is an oval amphitheatre in the center of Rome and is considered one of the greatest works of architecture and engineering."
      }
    },
    "1": {
      "iv": "sample_iv_value_2",
      "privateKey": "sample_private_key_2",
      "photoSrc": "https://example.com/path/to/photo2.jpg",
      "thumbnailSrc": "https://example.com/path/to/thumbnail2.jpg",
      "documentSrc": "https://example.com/path/to/document2.pdf",
      "tokenIdentifier": "HP002",
      "photoType": ".jpg",
      "photoLocation": {
        "icp": "https://example.com/path/to/photo2.jpg",
        "ipfs": "ipfs://example-hash-2/photo2.jpg"
      },
      "thumbnailType": ".jpg",
      "thumbnailLocation": {
        "icp": "https://example.com/path/to/thumbnail2.jpg",
        "ipfs": "ipfs://example-hash-2/thumbnail2.jpg"
      },
      "documentType": ".pdf",
      "documentLocation": {
        "icp": "https://example.com/path/to/document2.pdf",
        "ipfs": "ipfs://example-hash-2/document2.pdf"
      },
      "attributes": {
        "name": "Machu Picchu",
        "year": 1450,
        "location": "Cusco Region, Peru",
        "coordinates": "13.1631°S, 72.5450°W",
        "category": ["Archaeological Site", "Inca", "Ancient"],
        "significance": "Machu Picchu is an Incan citadel set high in the Andes Mountains in Peru, built in the 15th century and later abandoned."
      }
    }
  }
}' > metadata/token/metadata.json

echo "Setup completed! Your project is ready for development."
echo "Run the deployment script with 'python3 deploy_nfts.py' to deploy your NFTs"