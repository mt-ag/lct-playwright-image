FROM ubuntu:noble

ARG DEBIAN_FRONTEND=noninteractive
ARG TZ=Europe/Berlin

ENV LANG=C.UTF-8
ENV LC_ALL=C.UTF-8

ENV PLAYWRIGHT_BROWSERS_PATH=/pw-browsers

LABEL org.opencontainers.image.source https://github.com/mt-ag/lct-playwright-image

# General System Setup
RUN apt-get update && \
    apt-get install -y curl wget gpg ca-certificates && \
    mkdir -p /etc/apt/keyrings && \
    curl -sL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg && \
    echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_22.x nodistro main" >> /etc/apt/sources.list.d/nodesource.list && \
    apt-get update && \
    apt-get install -y nodejs && \
    npm config set --global update-notifier false && \
    rm -rf /var/lib/apt/lists/*

ARG PW_USER=lct
ARG PW_GROUP=lct
    
# Directory and User Preparation
RUN groupadd $PW_GROUP && \
    useradd -g $PW_GROUP $PW_USER && \
    mkdir -p /app/workdir && \
    mkdir /pw-browsers

# Playwright Installation
RUN cd /app && \
    npm install -y @playwright/test && \
    npx -y playwright@1.50.1 install --with-deps && \
    chown $PW_USER:$PW_GROUP /app && \
    chmod -R 777 /app && \
    chmod -R 777 /pw-browsers

WORKDIR /app/workdir

ENTRYPOINT ["npx", "playwright", "test", "test.spec.js"]
