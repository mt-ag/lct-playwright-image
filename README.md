# LCT Playwright Image

## Working with the image

1. Building the image
    ```sh
    docker build . --file Dockerfile -t lct-playwright-image:local
    ```
1. Running the container in the same way LCT does
    ```sh
    docker run -u pwuser --rm --ipc=host -v ./test/:/app/workdir lct-playwright-image:local
    ```

## Testing the container locally

  ```sh
  # Run on top level directory of repo
  bash run_tests.sh local
  ```
This will:
1.  build the image locally
2.  delete result files of previous executions
3.  verify the folders are in the structure mentioned below, including that needed files are present
4.  execute small sample tests in every browser by running the container 
5.  verify that the result files needed in LCT are present in the correct directories

## Sample folder structure for mounted folder with files needed
- /mounted_folder
  - /upload_files
  - `lct.spec.js`
  - `pwUtils.js`
  - `lctReporter.js`
  - `var_utils.js`
  - `playwright.config.js`
  - `run.sh`
  
