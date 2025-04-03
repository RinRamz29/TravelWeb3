#!/bin/bash

# First, install jq if it's missing
if ! command -v jq &> /dev/null
then
    echo "Installing jq..."
    sudo apt-get update
    sudo apt-get install -y jq
fi

# Make sure dfx is running
dfx start --background --clean

# Create the dfx.json file with proper metadata configuration
cat > dfx.json << EOF
{
  "canisters": {
    "NFTProject_backend": {
      "main": "src/NFTProject_backend/main.mo",
      "type": "motoko"
    },
    "NFTProject_frontend": {
      "dependencies": [
        "NFTProject_backend"
      ],
      "source": [
        "src/NFTProject_frontend/dist"
      ],
      "type": "assets",
      "workspace": "NFTProject_frontend"
    }
  },
  "defaults": {
    "build": {
      "args": "",
      "packtool": ""
    }
  },
  "output_env_file": ".env",
  "version": 1
}
EOF

# Create logo.json if it doesn't exist
mkdir -p ./metadata/collection
cat > ./metadata/collection/logo.json << EOF
{
  "text": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiB2aWV3Qm94PSIwIDAgMjAwIDIwMCI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiMxODY3OWUiLz48cGF0aCBkPSJNODAgMTUwTDUwIDEwMEwxMTAgMTAwTDgwIDE1MFoiIGZpbGw9IndoaXRlIi8+PHBhdGggZD0iTTEzMCAxNTBMMTAwIDEwMEwxNjAgMTAwTDEzMCAxNTBaIiBmaWxsPSJ3aGl0ZSIvPjxjaXJjbGUgY3g9IjE0MCIgY3k9IjUwIiByPSIyMCIgZmlsbD0iI2YwYjgzYiIvPjwvc3ZnPg=="
}
EOF

# Build the canister
echo "Building the canister..."
dfx build NFTProject_backend

# Install the canister with the initial arguments
echo "Installing the canister..."
LOGO=$(cat ./metadata/collection/logo.json | jq -r '.text')
PRINCIPAL=$(dfx identity get-principal)

dfx canister install NFTProject_backend --argument="(\"$LOGO\", \"Historical Places\", \"HP\", \"Historical Places NFT Collection on the Internet Computer\", principal \"$PRINCIPAL\", null)"

# Function to mint an NFT
mint_nft() {
    local index=$1
    local name=$2
    local year=$3
    local location=$4
    local coordinates=$5
    local category1=$6
    local category2=$7
    local category3=$8
    local significance=$9
    local token_id=${10}
    
    echo "Minting NFT #$index - $name"
    
    dfx canister call NFTProject_backend mint "(
        principal \"$PRINCIPAL\",
        opt record {
            tokenIdentifier = \"$token_id\";
            photoType = \".jpg\";
            photoLocation = record { 
                icp = \"https://example.com/path/to/photo$index.jpg\";
                ipfs = \"ipfs://example-hash-$index/photo$index.jpg\";
            };
            thumbnailType = \".jpg\";
            thumbnailLocation = record { 
                icp = \"https://example.com/path/to/thumbnail$index.jpg\";
                ipfs = \"ipfs://example-hash-$index/thumbnail$index.jpg\";
            };
            documentType = \".pdf\";
            documentLocation = record { 
                icp = \"https://example.com/path/to/document$index.jpg\";
                ipfs = \"ipfs://example-hash-$index/document$index.jpg\";
            };
            attributes = record {
                name = \"$name\";
                year = $year;
                location = \"$location\";
                coordinates = opt \"$coordinates\";
                category = vec {\"$category1\"; \"$category2\"; \"$category3\"};
                significance = \"$significance\";
            };
        }
    )"
    
    # Set content sources
    echo "Setting thumbnail source for NFT #$index"
    dfx canister call NFTProject_backend setThumbnailSrc "($index : nat, \"https://example.com/path/to/thumbnail$index.jpg\")"
    
    echo "Setting photo source for NFT #$index"
    dfx canister call NFTProject_backend setPhotoSrc "($index : nat, \"https://example.com/path/to/photo$index.jpg\")"
    
    echo "Setting document source for NFT #$index"
    dfx canister call NFTProject_backend setDocumentSrc "($index : nat, \"https://example.com/path/to/document$index.pdf\")"
    
    echo "Setting decryption key for NFT #$index"
    dfx canister call NFTProject_backend setDecryptionKey "($index : nat, \"sample_iv_value_$index\", \"sample_private_key_$index\")"
}

# Mint NFTs
mint_nft 0 "The Colosseum" 80 "Rome, Italy" "41.8902°N, 12.4922°E" "Monument" "Ancient" "Roman" "The Colosseum is an oval amphitheatre in the center of Rome and is considered one of the greatest works of architecture and engineering." "HP001"

mint_nft 1 "Machu Picchu" 1450 "Cusco Region, Peru" "13.1631°S, 72.5450°W" "Archaeological Site" "Inca" "Ancient" "Machu Picchu is an Incan citadel set high in the Andes Mountains in Peru, built in the 15th century and later abandoned." "HP002"

echo "Deployment completed successfully!"