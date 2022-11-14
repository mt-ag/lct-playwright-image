IMAGE_NAME="lct-playwright-image:latest"

function copy_test_files() {
  FOLDER=$1

  rm -rf /test/$FOLDER/output/ || true
  rm ./test/$FOLDER/lctReporter.js || true
  rm ./test/$FOLDER/playwright.config.js || true

  cp ./test/lctReporter.js ./test/$FOLDER
  cp ./test/playwright.config.js ./test/$FOLDER
}

function single_file_exists() {
  FILE=$1

  if [ ! -f "$FILE" ]; then
    echo "$FILE not found."
    exit 1
  else
    echo "$FILE found."
  fi
}

function test_result_files_exist() {
  FOLDER=$1

  single_file_exists "./test/$FOLDER/output/results.xml"
  single_file_exists "./test/$FOLDER/output/output.log"
}

echo "Launching Test Suite..."

echo "Giving access to all files..."
chmod -R 777 ./test/*

echo "Starting chromium test..."
copy_test_files "chromium"
docker run --rm --ipc=host -v $(pwd)/test/chromium:/app/volume $IMAGE_NAME
test_result_files_exist "chromium"

echo "Starting firefox test..."
copy_test_files "firefox"
docker run --rm --ipc=host -v $(pwd)/test/firefox:/app/volume $IMAGE_NAME
test_result_files_exist "firefox"

echo "Starting webkit test..."
copy_test_files "webkit"
docker run --rm --ipc=host -v $(pwd)/test/webkit:/app/volume $IMAGE_NAME
test_result_files_exist "webkit"
