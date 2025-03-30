#!/usr/bin/env python3
import os
import time
import subprocess

# Character definitions for escaping
slach = chr(92)  # \
quote = chr(34)  # "
quote_one = chr(39)  # '
slach_quote = chr(92) + chr(34)  # \"

# Use the full path to dfx binary
DFX_PATH = "/usr/local/bin/dfx"
DFX_NETWORK = "local"

def run_command(command, check_output=False):
    """Run a shell command and optionally return its output"""
    # Replace 'dfx' with the full path
    if command.startswith("dfx "):
        command = command.replace("dfx ", f"{DFX_PATH} ", 1)
    
    # Add network flag for relevant commands
    if "canister" in command or "build" in command:
        if "--network" not in command:
            command = command + f" --network={DFX_NETWORK}"
    
    print(f"Running command: {command}")
    
    if check_output:
        try:
            result = subprocess.check_output(command, shell=True, stderr=subprocess.STDOUT, universal_newlines=True)
            return result.strip()
        except subprocess.CalledProcessError as e:
            print(f"Command failed with exit code {e.returncode}")
            print(f"Output: {e.output}")
            return None
    else:
        result = os.system(command)
        return result == 0  # Returns True if command succeeded (exit code 0)

# Skip network check and just proceed with canister creation
print("Skipping replica connection check and proceeding directly...")

# Create canisters
print("Creating canisters...")
run_command(f"{DFX_PATH} canister create Travel3Nft_frontend --network={DFX_NETWORK}")
run_command(f"{DFX_PATH} canister create Travel3Nft_backend --network={DFX_NETWORK}")
run_command(f"{DFX_PATH} build --network={DFX_NETWORK}")

# Get principal ID
print("Getting principal ID...")
principal_id = run_command(f"{DFX_PATH} identity get-principal", check_output=True)
if not principal_id:
    print("Failed to get principal ID. Exiting.")
    exit(1)

print(f"Principal ID: {principal_id}")

# Format the arguments with the actual principal ID
logo_url = "https://travel3.io/logo.png"
name = "Travel3"
symbol = "TRAVEL3"
description = "Historic Places NFT Collection on ICP"

# Build the command with the principal ID directly in the string
install = f'''{DFX_PATH} canister install Travel3Nft_backend --network={DFX_NETWORK} --argument='("{logo_url}", "{name}", "{symbol}", "{description}", principal "{principal_id}", null)';'''

print(install)
run_command(install)

# Sample historical place NFTs data
historical_places = [
    {
        "name": "Colosseum",
        "location": "Rome, Italy",
        "year": "70-80 AD",
        "description": "An oval amphitheatre in the centre of Rome, the largest ancient amphitheatre ever built.",
        "imageUrl": "https://travel3.io/images/colosseum.jpg",
        "documentUrl": "https://travel3.io/docs/colosseum.pdf"
    },
    {
        "name": "Machu Picchu",
        "location": "Cusco Region, Peru",
        "year": "1450 AD",
        "description": "A 15th-century Inca citadel situated on a mountain ridge above the Sacred Valley.",
        "imageUrl": "https://travel3.io/images/machu_picchu.jpg",
        "documentUrl": "https://travel3.io/docs/machu_picchu.pdf"
    },
    {
        "name": "Pyramids of Giza",
        "location": "Giza, Egypt",
        "year": "2560 BC",
        "description": "The oldest and largest of the three pyramids in the Giza pyramid complex.",
        "imageUrl": "https://travel3.io/images/pyramids.jpg",
        "documentUrl": "https://travel3.io/docs/pyramids.pdf"
    }
]

MINT_NUMBER = len(historical_places)

for i in range(0, MINT_NUMBER):
    admin_principal = f"principal {slach_quote}{principal_id}{slach_quote}"
    place = historical_places[i]
    
    # Create token identifier
    tokenIdentifier = f"place_{i}"
    
    # Create main image location
    mainImageType = "image/jpeg"
    imageLocation_icp = f"icp = {slach_quote}{place['imageUrl']}{slach_quote}"
    imageLocation_ipfs = f"ipfs = {slach_quote}{slach_quote}"
    mainImageLocation = f"mainImageLocation = record {{ {imageLocation_icp}; {imageLocation_ipfs}; }}"
    
    # Create document location
    documentType = "application/pdf"
    documentLocation_icp = f"icp = {slach_quote}{place['documentUrl']}{slach_quote}"
    documentLocation_ipfs = f"ipfs = {slach_quote}{slach_quote}"
    documentLocation = f"documentLocation = record {{ {documentLocation_icp}; {documentLocation_ipfs}; }}"
    
    # Create thumbnail location (using the same as main image for simplicity)
    thumbnailType = "image/jpeg"
    thumbnailLocation = f"thumbnailLocation = record {{ {imageLocation_icp}; {imageLocation_ipfs}; }}"
    
    # Create additional images location (empty for this example)
    additionalImagesType = "image/jpeg"
    additionalImagesLocation = "additionalImagesLocation = vec {}"
    
    # Create attributes - properly handling the coordinates string
    attributes_name = f"{slach_quote}{place['name']}{slach_quote}"
    attributes_location = f"{slach_quote}{place['location']}{slach_quote}"
    attributes_year = f"{slach_quote}{place['year']}{slach_quote}"
    attributes_description = f"{slach_quote}{place['description']}{slach_quote}"
    attributes_collection = f"{slach_quote}Historic Places{slach_quote}"
    attributes_category = f"{slach_quote}Landmark{slach_quote}"
    attributes_historical_period = f"{slach_quote}Ancient{slach_quote}"
    attributes_cultural_significance = f"{slach_quote}High{slach_quote}"
    
    # Fixed the attributes format with proper coordinates field
    attributes = f"""attributes = record{{
        name = {attributes_name};
        location = {attributes_location};
        coordinates = {slach_quote}{slach_quote};
        collection = {attributes_collection};
        year = {attributes_year};
        category = {attributes_category};
        historicalPeriod = {attributes_historical_period};
        culturalSignificance = {attributes_cultural_significance};
        architecturalStyle = null
    }}"""
    
    # Create token metadata with proper escaping
    TokenMetadata = f"""opt record {{
        tokenIdentifier = {slach_quote}{tokenIdentifier}{slach_quote};
        mainImageType = {slach_quote}{mainImageType}{slach_quote};
        {mainImageLocation};
        documentType = {slach_quote}{documentType}{slach_quote};
        {documentLocation};
        thumbnailType = {slach_quote}{thumbnailType}{slach_quote};
        {thumbnailLocation};
        additionalImagesType = {slach_quote}{additionalImagesType}{slach_quote};
        {additionalImagesLocation};
        {attributes};
    }}"""
    
    # Mint the NFT with properly formatted command
    mint_cmd = f'{DFX_PATH} canister call Travel3Nft_backend mint "({admin_principal}, {TokenMetadata})" --network={DFX_NETWORK}'
    print(f"Minting Historical Place NFT... idx: {i}")
    print(mint_cmd)
    run_command(mint_cmd)
    
    # Add a delay to ensure transactions are processed
    time.sleep(2)

    # Fix the image location command with proper string handling
    setImageLocation = f'{DFX_PATH} canister call Travel3Nft_backend setImageLocation "({i}:nat, record {{ icp = {slach_quote}{place["imageUrl"]}{slach_quote}; ipfs = {slach_quote}{slach_quote} }})" --network={DFX_NETWORK}'
    print(f"Setting Image Location... idx: {i}")
    run_command(setImageLocation)
    
    # Fix the document location command with proper string handling
    setDocumentLocation = f'{DFX_PATH} canister call Travel3Nft_backend setDocumentLocation "({i}:nat, record {{ icp = {slach_quote}{place["documentUrl"]}{slach_quote}; ipfs = {slach_quote}{slach_quote} }})" --network={DFX_NETWORK}'
    print(f"Setting Document Location... idx: {i}")
    run_command(setDocumentLocation)
    
    print(f"Successfully minted Historical Place NFT: {place['name']}")
    print("-" * 50)

print("Minting complete.")