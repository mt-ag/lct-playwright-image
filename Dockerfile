FROM mcr.microsoft.com/playwright:v1.23.3-focal

LABEL org.opencontainers.image.source https://github.com/mt-ag/lct-playwright-image

RUN mkdir /app && \
  mkdir /app/workdir && \
  mkdir /app/volume

COPY ./files /app/workdir

RUN cd /app/workdir && \
  yarn install && \
  yarn playwright install && \
  chmod +x /app/workdir/entrypoint.sh

WORKDIR /app/workdir

# Run tests
CMD ["bash", "entrypoint.sh"]
