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
    sudo \
    libunwind8 \
    && rm -rf /var/lib/apt/lists/*
# Install Node.js (required for dfx)
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*
# Create the non-root user with sudo privileges
RUN useradd -m -s /bin/bash ic-user && \
    echo "ic-user ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/ic-user && \
    chmod 0440 /etc/sudoers.d/ic-user
# Install DFINITY SDK (dfx) using the default installer
ENV DFXVM_INIT_YES=true
RUN curl -fsSL https://internetcomputer.org/install.sh | sh
# Make dfx available to all users by adding it to path
ENV PATH="/root/.local/share/dfx/bin:${PATH}"
RUN echo 'export PATH="/root/.local/share/dfx/bin:$PATH"' >> /etc/profile && \
    echo 'export PATH="/usr/local/bin:$PATH"' >> /etc/profile && \
    ln -sf /root/.local/share/dfx/bin/dfx /usr/local/bin/dfx
# Create directories and set permissions
RUN mkdir -p /home/ic-user/project && \
    chown -R ic-user:ic-user /home/ic-user/project && \
    mkdir -p /home/ic-user/.cache/dfx && \
    chown -R ic-user:ic-user /home/ic-user/.cache && \
    mkdir -p /home/ic-user/.config/dfx/identity && \
    chown -R ic-user:ic-user /home/ic-user/.config
# Set environment variables that will be useful when running as root
ENV USER=ic-user
ENV HOME=/home/ic-user
# Set the working directory
WORKDIR /home/ic-user/project
# Expose DFX ports
EXPOSE 8000 8080