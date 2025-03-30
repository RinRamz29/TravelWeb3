import os
import json, time

# \
slach = chr(92)
# "
quote = chr(34)
# '
quote_one = chr(39)
# \"
slach_quote = chr(92) + chr(34)


os.system("killall dfx;")
os.system("rm -rf .dfx;")
os.system("dfx start --clean --background;")
os.system("dfx canister create Travel3Nft_frontend;")
os.system("dfx canister create Travel3Nft_backend;")
os.system("dfx build")

# First get the principal ID and store it in a variable
print("Getting principal ID...")
principal_id = os.popen("dfx identity get-principal").read().strip()
print(f"Principal ID: {principal_id}")

# Format the arguments with the actual principal ID
logo_url = "https://travel3.io/logo.png"
name = "Travel3"
symbol = "TRAVEL3"
description = "Historic Places NFT Collection on ICP"

# Build the command with the principal ID directly in the string
# This avoids the shell command substitution issue
install = f'''dfx canister install Travel3Nft_backend --argument='("{logo_url}", "{name}", "{symbol}", "{description}", principal "{principal_id}", null)';'''

# Alternative approach using format if f-strings aren't available in your Python version
# install = 'dfx canister install Travel3Nft_backend --argument=\'("{}","{}","{}","{}",principal "$(dfx identity get-principal)",null)\';'.format(
#    logo_url, name, symbol, description
#)
print(install)
os.system(install)

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
    
    # Create attributes - FIXED BY PROPERLY HANDLING THE COORDINATES STRING
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
    os.system(mint_cmd)
    
    # Add a delay to ensure transactions are processed
    time.sleep(2)

    # Fix the image location command with proper string handling
    setImageLocation = f'dfx canister call Travel3Nft_backend setImageLocation "({i}:nat, record {{ icp = {slach_quote}{place["imageUrl"]}{slach_quote}; ipfs = {slach_quote}{slach_quote} }})"'
    print(f"Setting Image Location... idx: {i}")
    os.system(setImageLocation)
    
    # Fix the document location command with proper string handling
    setDocumentLocation = f'dfx canister call Travel3Nft_backend setDocumentLocation "({i}:nat, record {{ icp = {slach_quote}{place["documentUrl"]}{slach_quote}; ipfs = {slach_quote}{slach_quote} }})"'
    print(f"Setting Document Location... idx: {i}")
    os.system(setDocumentLocation)
    
    print(f"Successfully minted Historical Place NFT: {place['name']}")
    print("-" * 50)
