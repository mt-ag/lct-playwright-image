# LCT Playwright Image

## What we need

- Node installed
- Playwright installed
- A directory which is mounted to the host

## Building the Image

`docker build . --file Dockerfile -t lct-playwright-image`

## Testing the container

`docker run --rm --ipc=host -v $(pwd)/test/local:/app/workdir lct-playwright-image "--project=chromium"`
