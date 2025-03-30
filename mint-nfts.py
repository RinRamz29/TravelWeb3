import os
import json
import time
import subprocess
import signal
import sys

# Character definitions for escaping
slach = chr(92)  # \
quote = chr(34)  # "
quote_one = chr(39)  # '
slach_quote = chr(92) + chr(34)  # \"

def run_command(command, check_output=False):
    """Run a shell command and optionally return its output"""
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
        return os.system(command)

def wait_for_network_ready(max_attempts=10, delay=5):
    """Wait for the local network to be ready"""
    for attempt in range(max_attempts):
        print(f"Checking if network is ready (attempt {attempt+1}/{max_attempts})...")
        result = run_command("dfx ping", check_output=True)
        if result and "The replica is running" in result:
            print("Local replica is running and ready!")
            return True
        print(f"Network not ready yet. Waiting {delay} seconds...")
        time.sleep(delay)
    
    print("Failed to start local network after maximum attempts.")
    return False

# Clean up any existing processes
print("Cleaning up environment...")
run_command("killall dfx 2>/dev/null || true")
run_command("rm -rf .dfx")

# Start the local replica
print("Starting local network...")
dfx_process = subprocess.Popen(
    "dfx start --clean",
    shell=True,
    stdout=subprocess.PIPE,
    stderr=subprocess.STDOUT,
    universal_newlines=True
)

# Register a signal handler to terminate the dfx process on script exit
def cleanup(signum=None, frame=None):
    if dfx_process:
        print("Terminating dfx process...")
        dfx_process.terminate()
        try:
            dfx_process.wait(timeout=5)  # Wait for process to terminate
        except:
            print("Failed to terminate dfx process cleanly")
    
    if signum is not None:  # Only exit if this was called as a signal handler
        sys.exit(0)

# Set up signal handlers
signal.signal(signal.SIGINT, cleanup)
signal.signal(signal.SIGTERM, cleanup)

# Give the network time to start
time.sleep(10)

# Wait for the network to be ready
if not wait_for_network_ready(max_attempts=15, delay=5):
    print("Could not start the local replica. Exiting.")
    cleanup()
    sys.exit(1)

# Create canisters
print("Creating canisters...")
run_command("dfx canister create Travel3Nft_frontend")
run_command("dfx canister create Travel3Nft_backend")
run_command("dfx build")

# Get principal ID
print("Getting principal ID...")
principal_id = run_command("dfx identity get-principal", check_output=True)
if not principal_id:
    print("Failed to get principal ID. Exiting.")
    cleanup()
    sys.exit(1)

print(f"Principal ID: {principal_id}")

# Format the arguments with the actual principal ID
logo_url = "https://travel3.io/logo.png"
name = "Travel3"
symbol = "TRAVEL3"
description = "Historic Places NFT Collection on ICP"

# Build the command with the principal ID directly in the string
install = f'''dfx canister install Travel3Nft_backend --argument='("{logo_url}", "{name}", "{symbol}", "{description}", principal "{principal_id}", null)';'''

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
    mint_cmd = f'dfx canister call Travel3Nft_backend mint "({admin_principal}, {TokenMetadata})"'
    print(f"Minting Historical Place NFT... idx: {i}")
    print(mint_cmd)
    run_command(mint_cmd)
    
    # Add a delay to ensure transactions are processed
    time.sleep(2)

    # Fix the image location command with proper string handling
    setImageLocation = f'dfx canister call Travel3Nft_backend setImageLocation "({i}:nat, record {{ icp = {slach_quote}{place["imageUrl"]}{slach_quote}; ipfs = {slach_quote}{slach_quote} }})"'
    print(f"Setting Image Location... idx: {i}")
    run_command(setImageLocation)
    
    # Fix the document location command with proper string handling
    setDocumentLocation = f'dfx canister call Travel3Nft_backend setDocumentLocation "({i}:nat, record {{ icp = {slach_quote}{place["documentUrl"]}{slach_quote}; ipfs = {slach_quote}{slach_quote} }})"'
    print(f"Setting Document Location... idx: {i}")
    run_command(setDocumentLocation)
    
    print(f"Successfully minted Historical Place NFT: {place['name']}")
    print("-" * 50)

# Clean up at the end
print("Minting complete. Shutting down local replica...")
cleanup()
