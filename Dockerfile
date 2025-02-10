FROM node:22-alpine

LABEL org.opencontainers.image.source https://github.com/mt-ag/lct-playwright-image

RUN npx -y playwright@1.50.1 install --with-deps

CMD ["bash", "entrypoint.sh"]
