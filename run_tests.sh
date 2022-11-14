IMAGE_NAME="lct-playwright-image:latest"

function copy_test_files() {
  rm -rf /test/$1/output/ || true
  rm ./test/$1/lctReporter.js || true
  rm ./test/$1/playwright.config.js || true

  cp ./test/lctReporter.js ./test/$1
  cp ./test/playwright.config.js ./test/$1
}

echo "Launching Test Suite..."

echo "Giving access to all files..."
chmod -R 777 ./test/*

echo "Starting chromium test..."
copy_test_files "chromium"
docker run --rm --ipc=host -v $(pwd)/test/chromium:/app/volume $IMAGE_NAME

echo "Starting firefox test..."
copy_test_files "firefox"
docker run --rm --ipc=host -v $(pwd)/test/firefox:/app/volume $IMAGE_NAME

echo "Starting webkit test..."
copy_test_files "webkit"
docker run --rm --ipc=host -v $(pwd)/test/webkit:/app/volume $IMAGE_NAME
