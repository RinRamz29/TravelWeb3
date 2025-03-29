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
    tokenIdentifier = "place_{}".format(i)
    
    # Create image location
    imageType = "image/jpeg"
    imageLocation_icp = "icp = {}{}{}".format(slach_quote, place["imageUrl"], slach_quote)
    imageLocation_ipfs = "ipfs = {}{}{}".format(slach_quote, "", slach_quote)
    imageLocation = "imageLocation = record { " + "{};{};".format(imageLocation_icp, imageLocation_ipfs) + "}"
    
    # Create document location
    documentType = "application/pdf"
    documentLocation_icp = "icp = {}{}{}".format(slach_quote, place["documentUrl"], slach_quote)
    documentLocation_ipfs = "ipfs = {}{}{}".format(slach_quote, "", slach_quote)
    documentLocation = "documentLocation = record { " + "{};{};".format(documentLocation_icp, documentLocation_ipfs) + "}"
    
    # Create attributes
    attributes_name = "{}{}{}".format(slach_quote, place["name"], slach_quote)
    attributes_location = "{}{}{}".format(slach_quote, place["location"], slach_quote)
    attributes_year = "{}{}{}".format(slach_quote, place["year"], slach_quote)
    attributes_description = "{}{}{}".format(slach_quote, place["description"], slach_quote)
    
    attributes = "attributes = record{" + "name = {};".format(attributes_name) + "location = {};".format(attributes_location) + "year = {};".format(attributes_year) + "description = {};".format(attributes_description) + "}"
    
    # Create token metadata
    TokenMetadata = "opt record {" + "tokenIdentifier = {}{}{};".format(slach_quote, tokenIdentifier, slach_quote) + "imageType = {}{}{};".format(slach_quote, imageType, slach_quote) + imageLocation + ";" + "documentType = {}{}{};".format(slach_quote, documentType, slach_quote) + documentLocation + ";" + attributes + ";" + "}"
    
    # Mint the NFT
    mint = "dfx canister call Travel3Nft_backend mint {}({},{}){}".format(quote, admin_principal, TokenMetadata, quote)
    print("Minting Historical Place NFT... idx: {}".format(i))
    print(mint)
    os.system(mint)
    
    # Add a delay to ensure transactions are processed
    time.sleep(2)

    # Set image location if needed
    setImageLocation = "dfx canister call Travel3Nft_backend setImageLocation {}({}:nat,{}{}{}){}".format(quote, i, slach_quote, place["imageUrl"], slach_quote, quote)
    print("Setting Image Location... idx: {}".format(i))
    os.system(setImageLocation)
    
    # Set document location if needed
    setDocumentLocation = "dfx canister call Travel3Nft_backend setDocumentLocation {}({}:nat,{}{}{}){}".format(quote, i, slach_quote, place["documentUrl"], slach_quote, quote)
    print("Setting Document Location... idx: {}".format(i))
    os.system(setDocumentLocation)
    
    print("Successfully minted Historical Place NFT: {}".format(place["name"]))
    print("-" * 50)
