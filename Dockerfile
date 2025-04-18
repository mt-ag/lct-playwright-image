FROM mcr.microsoft.com/playwright:v1.50.1-noble

LABEL org.opencontainers.image.source https://github.com/mt-ag/lct-playwright-image

# Playwright Installation
RUN mkdir -p /app/workdir && \
    cd /app && \
    npm config set --global update-notifier false && \
    npm install -y -D @playwright/test@1.50.1 && \
    npx -y playwright install --with-deps && \
    chown pwuser:pwuser /app && \
    chmod -R 777 /app

WORKDIR /app/workdir

ENTRYPOINT ["npx", "playwright", "test", "test.spec.js"]
