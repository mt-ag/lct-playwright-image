# LCT Playwright Image

## What we need

- Node installed
- A prepared directory `/app` in the container with playwright installation
- A directory `/app/workdir` (must be subdir of above) which is mounted to the host to serve
  - configs, like `playwright.config.js`
  - the actual test specifications in subfolder `tests`
  - as output directory for all artifacts

## Sample folder structure for mounted folder



## Building the Image

`docker build . --file Dockerfile -t lct-playwright-image`

## Testing the container

`docker run --rm --ipc=host -v $(pwd)/test/local:/app/workdir lct-playwright-image "--project=chromium"`
