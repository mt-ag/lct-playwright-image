FROM ubuntu:noble

ARG DEBIAN_FRONTEND=noninteractive
ARG TZ=Europe/Berlin

ENV LANG=C.UTF-8
ENV LC_ALL=C.UTF-8

ENV NODE_PATH=/app/workdir/node_modules

LABEL org.opencontainers.image.source https://github.com/mt-ag/lct-playwright-image

RUN apt-get update && \
    # Install Node.js
    apt-get install -y curl wget gpg ca-certificates && \
    mkdir -p /etc/apt/keyrings && \
    curl -sL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg && \
    echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_22.x nodistro main" >> /etc/apt/sources.list.d/nodesource.list && \
    apt-get update && \
    apt-get install -y nodejs && \
    rm -rf /var/lib/apt/lists/* && \
    groupadd pwuser && \
    useradd -g pwuser pwuser && \
    mkdir -p /app/workdir && \
    mkdir -p /app/volume

RUN cd /app && \
    npm install -y @playwright/test && \
    npx -y playwright@1.50.1 install --with-deps && \
    chown pwuser:pwuser /app && \
    chmod -R 777 /app

WORKDIR /app/workdir

ENTRYPOINT ["npx", "playwright", "test", "test.spec.js"]
