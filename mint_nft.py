import os
import json

# \
slach = chr(92)
# "
quote = chr(34)
# '
quote_one = chr(39)
# \"
slach_quote = chr(92)+chr(34)

# Clean restart of dfx
os.system("killall dfx;")
os.system("rm -rf .dfx;")
os.system("dfx start --clean --background;")
os.system("dfx canister create NFTProject_backend;")
os.system("dfx canister create NFTProject_frontend;")
os.system("dfx build")

# Install the canister with initial parameters
install = "dfx canister install NFTProject_backend --argument={}($(cat ./metadata/collection/logo.json | jq {}.text{}), {}Historical Places{}, {}HP{}, {}Historical Places NFT Collection on the Internet Computer{}, principal {}$(dfx identity get-principal){}, null){};".format(
    quote, quote_one, quote_one, slach_quote, slach_quote, slach_quote, slach_quote, slach_quote, slach_quote, slach_quote, slach_quote, quote
)
print(install)
os.system(install)

# Load metadata for tokens
f = open('./metadata/token/metadata.json')
data = json.load(f)
MINT_NUMBER = 2  # Number of NFTs to mint

for i in range(0, MINT_NUMBER):
    admin_principal = "principal {}$(dfx identity get-principal){}".format(slach_quote, slach_quote)
    token_data = data["metadata"][str(int(i))]
    
    # Extract decryption keys
    iv = token_data['iv']
    privateKey = token_data['privateKey']

    # Extract content sources
    photoSrc = token_data['photoSrc']
    thumbnailSrc = token_data['thumbnailSrc']
    documentSrc = token_data['documentSrc']

    # Extract token metadata
    tokenIdentifier = token_data['tokenIdentifier']
    photoType = token_data['photoType']
    photoLocation = token_data['photoLocation']
    photoLocation_icp = photoLocation['icp']
    photoLocation_ipfs = photoLocation['ipfs']

    thumbnailType = token_data["thumbnailType"]
    thumbnailLocation = token_data['thumbnailLocation']
    thumbnailLocation_icp = thumbnailLocation['icp']
    thumbnailLocation_ipfs = thumbnailLocation['ipfs']

    documentType = token_data["documentType"]
    documentLocation = token_data['documentLocation']
    documentLocation_icp = documentLocation['icp']
    documentLocation_ipfs = documentLocation['ipfs']

    # Extract attributes
    attributes = token_data['attributes']
    attributes_name = attributes['name']
    attributes_year = attributes['year']
    attributes_location = attributes['location']
    attributes_coordinates = attributes.get('coordinates', None)
    attributes_category = attributes['category']
    attributes_significance = attributes['significance']

    # Format for Candid
    tokenIdentifier = "tokenIdentifier = {}{}{}".format(slach_quote, tokenIdentifier, slach_quote)

    photoType = "photoType = {}{}{}".format(slach_quote, photoType, slach_quote)
    photoLocation_icp = "icp = " + "{}{}{}".format(slach_quote, photoLocation_icp, slach_quote)
    photoLocation_ipfs = "ipfs = " + "{}{}{}".format(slach_quote, photoLocation_ipfs, slach_quote)
    photoLocation = "photoLocation = record { " + "{};{};".format(photoLocation_icp, photoLocation_ipfs) + "}"
    
    thumbnailType = "thumbnailType = {}{}{}".format(slach_quote, thumbnailType, slach_quote)
    thumbnailLocation_icp = "icp = " + "{}{}{}".format(slach_quote, thumbnailLocation_icp, slach_quote)
    thumbnailLocation_ipfs = "ipfs = " + "{}{}{}".format(slach_quote, thumbnailLocation_ipfs, slach_quote)
    thumbnailLocation = "thumbnailLocation = record { " + "{};{};".format(thumbnailLocation_icp, thumbnailLocation_ipfs) + "}"

    documentType = "documentType = {}{}{}".format(slach_quote, documentType, slach_quote)
    documentLocation_icp = "icp = " + "{}{}{}".format(slach_quote, documentLocation_icp, slach_quote)
    documentLocation_ipfs = "ipfs = " + "{}{}{}".format(slach_quote, documentLocation_ipfs, slach_quote)
    documentLocation = "documentLocation = record { " + "{};{};".format(documentLocation_icp, documentLocation_ipfs) + "}"

    # Format category array
    temp = "vec {"
    for category in attributes_category:
        temp = temp + "{}{}{};".format(slach_quote, category, slach_quote)
    temp = temp + " }"
    attributes_category = temp
    
    # Format coordinates (optional field)
    if attributes_coordinates:
        coordinates_option = "opt {}{}{};".format(slach_quote, attributes_coordinates, slach_quote)
    else:
        coordinates_option = "null;"
    
    # Format attributes
    attributes_name = "{}{}{}".format(slach_quote, attributes_name, slach_quote)
    attributes = "attributes = record{" + "name = {};".format(attributes_name) + \
                "year = {};".format(attributes_year) + \
                "location = {}{}{};".format(slach_quote, attributes_location, slach_quote) + \
                "coordinates = {};".format(coordinates_option) + \
                "category = {};".format(attributes_category) + \
                "significance = {}{}{};".format(slach_quote, attributes_significance, slach_quote) + "}"

    # Create the TokenMetadata record
    TokenMetadata = "opt record {" + tokenIdentifier + ";" + photoType + ";" + photoLocation + ";" + \
                    thumbnailType + ";" + thumbnailLocation + ";" + \
                    documentType + ";" + documentLocation + ";" + \
                    attributes + ";" + "}"
    
    # Mint the NFT
    mint = "dfx canister call NFTProject_backend mint {}({},{}){}".format(quote, admin_principal, TokenMetadata, quote)
    print("Minting NFT #{} - {}".format(i, attributes_name))
    os.system(mint)

    # Set content sources
    setThumbnailSrc = "dfx canister call NFTProject_backend setThumbnailSrc {}({}:nat,{}{}{}){}".format(
        quote, i, slach_quote, thumbnailSrc, slach_quote, quote
    )
    print("Setting thumbnail source for NFT #{}".format(i))
    os.system(setThumbnailSrc)

    setPhotoSrc = "dfx canister call NFTProject_backend setPhotoSrc {}({}:nat,{}{}{}){}".format(
        quote, i, slach_quote, photoSrc, slach_quote, quote
    )
    print("Setting photo source for NFT #{}".format(i))
    os.system(setPhotoSrc)

    setDocumentSrc = "dfx canister call NFTProject_backend setDocumentSrc {}({}:nat,{}{}{}){}".format(
        quote, i, slach_quote, documentSrc, slach_quote, quote
    )
    print("Setting document source for NFT #{}".format(i))
    os.system(setDocumentSrc)

    # Set decryption key
    setDecryptionKey = "dfx canister call NFTProject_backend setDecryptionKey {}({}:nat,{}{}{},{}{}{}){}".format(
        quote, i, slach_quote, iv, slach_quote, slach_quote, privateKey, slach_quote, quote
    )
    print("Setting decryption key for NFT #{}".format(i))
    os.system(setDecryptionKey)

print("Deployment completed successfully!")