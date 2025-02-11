IMAGE_NAME="lct-playwright-image:latest"

function prepare_test() {

  rm -rf ./test/live || true
  mkdir -p ./test/live/tests

  cp ./test/static/lctReporter.js ./test/live
  cp ./test/static/playwright.config.js ./test/live
  cp ./test/static/test.spec.js ./test/live/tests
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

function check_result_and_cleanup() {
  single_file_exists "./test/live/results.xml"
  rm ./test/live/results.xml || true
  single_file_exists "./test/live/example.png"
  rm ./test/live/example.png || true
  rm -rf ./test/live/output || true
}

function run_container() {
  BROWSER=$1
  docker run --rm --ipc=host -v $(pwd)/test/live:/app/workdir $IMAGE_NAME "--project=$BROWSER"
}

echo "Launching Test Suite..."

prepare_test

echo "Starting chromium test..."
run_container "chromium"
echo "Verifying chromium test results..."
check_result_and_cleanup

echo "Starting firefox test..."
run_container "firefox"
echo "Verifying firefox test results..."
check_result_and_cleanup

echo "Starting webkit test..."
run_container "webkit"
echo "Verifying webkit test results..."
check_result_and_cleanup
