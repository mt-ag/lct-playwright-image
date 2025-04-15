EXECUTION_TYPE=$1
IMAGE_NAME="lct-playwright-image"
CURRENT_DIR=$(pwd)

if [ "$EXECUTION_TYPE" != "local" ] && [ "$EXECUTION_TYPE" != "latest" ]; then
  echo "argument must be either \"local\" or \"latest\"."
  exit 126
fi

function build_image_locally() {
  docker build . --file Dockerfile -t "${IMAGE_NAME}:${EXECUTION_TYPE}"
}

function prepare_test() {
  rm -f "$CURRENT_DIR/test/results.xml"
  rm -f "$CURRENT_DIR/test/screenshots/example.png"
}

function verify_initial_folderstructure_and_files() {
  single_directory_exists  "$CURRENT_DIR/test/output"
  single_directory_exists  "$CURRENT_DIR/test/screenshots"
  single_directory_exists  "$CURRENT_DIR/test/traces"
  single_directory_exists  "$CURRENT_DIR/test/tests"
  single_file_exists       "$CURRENT_DIR/test/tests/test.spec.js"
  single_file_exists       "$CURRENT_DIR/test/playwright.config.js"
  single_file_exists       "$CURRENT_DIR/test/lctReporter.js"
}

function single_file_exists() {
  FILE=$1

  if [ ! -L "$FILE" ] && [ ! -f "$FILE" ]; then
    echo "$FILE not found."
    exit 1
  else
    echo "$FILE found."
  fi
}

function single_directory_exists() {
  DIRECTORY=$1

  if [ ! -L "$DIRECTORY" ] && [ ! -d "$DIRECTORY" ]; then
    echo "$DIRECTORY not found."
    exit 1
  else
    echo "$DIRECTORY found."
  fi
}

function check_result() {
  single_file_exists "$CURRENT_DIR/test/results.xml"
  single_file_exists "$CURRENT_DIR/test/screenshots/example.png"
}

function run_container() {
  docker run -u pwuser --rm --ipc=host -v "$CURRENT_DIR/test:/app/workdir" "${IMAGE_NAME}:${EXECUTION_TYPE}"
}

if [ "$EXECUTION_TYPE" = "local" ]; then
  echo "Building Docker image locally..."
  build_image_locally
fi

echo "Preparing environment..."

prepare_test

echo "Verifying initial folderstructure and files..."

verify_initial_folderstructure_and_files

echo "Launching tests in Docker container..."

run_container

echo "Checking test results and output files..."

check_result