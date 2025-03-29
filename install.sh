sudo apt-get update;
sudo apt-get install npm;
sudo npm install n -g;
sudo n lts;
sudo npm install yarn -g;
npm install;

# Install the Internet Computer SDK (dfx)
sh -ci "$(curl -fsSL https://smartcontracts.org/install.sh)";
echo 'export PATH="$PATH:$HOME/bin"' >> "$HOME/.bashrc";
. "$HOME/.bashrc";

# Install Rust and related tools
sudo curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh;
source $HOME/.cargo/env;
rustup target add wasm32-unknown-unknown;

# Install build dependencies
sudo apt-get install build-essential libssl-dev;

# Install the CDK optimizer for Motoko
cargo install ic-cdk-optimizer --version 0.3.1;

# Set up the Travel3Nft project
echo "Setup complete for Travel3Nft project!"
echo "You can now run the following commands to start your project:"
echo "dfx start --clean --background"
echo "dfx deploy"
