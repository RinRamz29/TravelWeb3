#!/bin/bash

echo "Checking Internet Identity canister status..."

# Get the canister ID from dfx.json
II_CANISTER_ID=$(dfx canister id internet_identity 2>/dev/null)

if [ -z "$II_CANISTER_ID" ]; then
  echo "Internet Identity canister is not deployed."
  echo "Attempting to deploy..."
  
  dfx deploy internet_identity
  
  if [ $? -eq 0 ]; then
    echo "Internet Identity canister deployed successfully!"
    II_CANISTER_ID=$(dfx canister id internet_identity)
    echo "Canister ID: $II_CANISTER_ID"
  else
    echo "Failed to deploy Internet Identity canister."
    exit 1
  fi
else
  echo "Internet Identity canister is already deployed."
  echo "Canister ID: $II_CANISTER_ID"
  
  # Check if the canister is running
  STATUS=$(dfx canister status internet_identity 2>&1)
  
  if [[ $STATUS == *"Running"* ]]; then
    echo "Internet Identity canister is running."
  else
    echo "Internet Identity canister is not running. Starting it..."
    dfx canister start internet_identity
    
    if [ $? -eq 0 ]; then
      echo "Internet Identity canister started successfully!"
    else
      echo "Failed to start Internet Identity canister."
      exit 1
    fi
  fi
fi

echo "Internet Identity canister check completed."
