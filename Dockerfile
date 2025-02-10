FROM node:22-alpine

LABEL org.opencontainers.image.source https://github.com/mt-ag/lct-playwright-image

RUN npm install @playwright/test && npx -y playwright@1.50.1 install --with-deps

RUN groupadd pwuser && adduser pwuser -G pwuser

RUN mkdir -p /app/workdir && chown pwuser:pwuser /app/workdir

WORKDIR /app/workdir

ENTRYPOINT ["npx", "playwright", "test", "test.spec.js"]
