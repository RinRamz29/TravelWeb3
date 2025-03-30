FROM ubuntu:22.04

# Install essential packages
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    git \
    gnupg \
    build-essential \
    python3 \
    python3-pip \
    cmake \
    unzip \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js (required for dfx)
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Install Rust (required for some IC apps)
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
ENV PATH="/root/.cargo/bin:${PATH}"

# Install DFINITY SDK (dfx) - using non-interactive approach
ENV DFXVM_INIT_YES=true
RUN curl -fsSL https://internetcomputer.org/install.sh | sh

# Create a non-root user for running dfx
RUN useradd -m -s /bin/bash ic-user
USER ic-user
WORKDIR /home/ic-user

# Copy your project files
COPY --chown=ic-user:ic-user . /home/ic-user/app/
WORKDIR /home/ic-user/app

# Install Python dependencies
RUN pip3 install --user subprocess32

# Expose DFX ports
EXPOSE 8000 8080

# Entry point script
COPY --chown=ic-user:ic-user docker-entrypoint.sh /home/ic-user/
RUN chmod +x /home/ic-user/docker-entrypoint.sh

# Set the default command
ENTRYPOINT ["/home/ic-user/docker-entrypoint.sh"]
