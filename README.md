# LCT Playwright Image

## What we need

- Node installed
- A prepared directory `/app` in the container with playwright installation
- A directory `/app/workdir` (must be subdir of above) which is mounted to the host to serve
  - configs, like `playwright.config.js`
  - the actual test specifications in subfolder `tests`
  - as output directory for all artifacts

## Sample folder structure for mounted folder

## Building the Image locally

`docker build . --file Dockerfile -t lct-playwright-image:local`

## Testing the container locally

```sh
# Run on Top Level directory of repo
rm -rf ./test/local/results.xml ./test/local/example.png ./test/local/output
docker run -u pwuser --rm --ipc=host -v ./test/local:/app/workdir lct-playwright-image:local "--project=chromium"
# Verify if files exist
ls -la ./test/local
```
