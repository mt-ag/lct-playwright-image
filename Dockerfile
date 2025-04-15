ARG PLAYWRIGHT_VERSION="1.51.1"
ARG OS_VERSION_NAME="noble"

FROM mcr.microsoft.com/playwright:v${PLAYWRIGHT_VERSION}-${OS_VERSION_NAME}

LABEL org.opencontainers.image.source=https://github.com/mt-ag/lct-playwright-image

# Playwright Installation
RUN mkdir -p /app/workdir && \
    cd /app && \
    npm config set --global update-notifier false && \
    npm install -y @playwright/test && \
    npx -y playwright@${PLAYWRIGHT_VERSION} install --with-deps && \
    chown pwuser:pwuser /app && \
    chmod -R 777 /app

WORKDIR /app/workdir

ENTRYPOINT ["bash", "run.sh"]
