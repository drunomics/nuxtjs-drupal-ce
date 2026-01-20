#!/bin/bash
#
# Test script for prerendering (SSG) functionality.
# Verifies that each prerendered page has unique content (fixes #430).
#
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
FIXTURE_DIR="$PROJECT_DIR/test/fixtures/prerender"
BACKEND_PORT=3010
STATIC_PORT=3011

# Cleanup function
cleanup() {
  echo "Cleaning up..."
  if [ -n "$BACKEND_PID" ]; then
    kill $BACKEND_PID 2>/dev/null || true
  fi
  if [ -n "$STATIC_PID" ]; then
    kill $STATIC_PID 2>/dev/null || true
  fi
}
trap cleanup EXIT

cd "$PROJECT_DIR"

echo "=== Step 1: Starting mock API server on port $BACKEND_PORT ==="
# Start simple mock API server (more reliable than full nuxt dev server)
PORT=$BACKEND_PORT node "$SCRIPT_DIR/mock-api-server.mjs" &
BACKEND_PID=$!

# Wait for backend to be ready
echo "Waiting for mock API server to start..."
for i in {1..10}; do
  # Check if process is still running
  if ! kill -0 $BACKEND_PID 2>/dev/null; then
    echo "ERROR: Mock API server process died"
    exit 1
  fi
  # Try to reach the API endpoint
  if curl -sf "http://127.0.0.1:$BACKEND_PORT/ce-api/node/1" > /dev/null 2>&1; then
    echo "Mock API server is ready."
    break
  fi
  if [ $i -eq 10 ]; then
    echo "ERROR: Mock API server failed to start within 10 seconds"
    exit 1
  fi
  sleep 1
done

echo "=== Step 2: Running nuxt generate ==="
cd "$PROJECT_DIR"
NUXT_PUBLIC_DRUPAL_CE_DRUPAL_BASE_URL="http://127.0.0.1:$BACKEND_PORT" npx nuxi generate "$FIXTURE_DIR"

echo "=== Step 3: Stopping mock API server ==="
kill $BACKEND_PID 2>/dev/null || true
BACKEND_PID=""

echo "=== Step 4: Starting static file server on port $STATIC_PORT ==="
cd "$FIXTURE_DIR/.output/public"
npx serve -l $STATIC_PORT &
STATIC_PID=$!

# Wait for static server to be ready
echo "Waiting for static server to start..."
for i in {1..10}; do
  if curl -s "http://127.0.0.1:$STATIC_PORT/" > /dev/null 2>&1; then
    echo "Static server is ready."
    break
  fi
  if [ $i -eq 10 ]; then
    echo "ERROR: Static server failed to start within 10 seconds"
    exit 1
  fi
  sleep 1
done

echo "=== Step 5: Verifying prerendered pages ==="

# Test /node/1 - should have title "Test page" and NOT "Another page" in <title>
echo "Testing /node/1..."
NODE1_HTML=$(curl -s "http://127.0.0.1:$STATIC_PORT/node/1/")
if echo "$NODE1_HTML" | grep -q "<title>Test page</title>"; then
  echo "  ✓ /node/1 has <title>Test page</title>"
else
  echo "  ✗ ERROR: /node/1 does not have <title>Test page</title>"
  echo "  Actual title: $(echo "$NODE1_HTML" | grep -o '<title>[^<]*</title>')"
  exit 1
fi
if echo "$NODE1_HTML" | grep -q "<title>Another page</title>"; then
  echo "  ✗ ERROR: /node/1 incorrectly has <title>Another page</title> (cache leak!)"
  exit 1
else
  echo "  ✓ /node/1 does not have Another page title"
fi

# Test /node/3 - should have title "Another page" and NOT "Test page" in <title>
echo "Testing /node/3..."
NODE3_HTML=$(curl -s "http://127.0.0.1:$STATIC_PORT/node/3/")
if echo "$NODE3_HTML" | grep -q "<title>Another page</title>"; then
  echo "  ✓ /node/3 has <title>Another page</title>"
else
  echo "  ✗ ERROR: /node/3 does not have <title>Another page</title>"
  echo "  Actual title: $(echo "$NODE3_HTML" | grep -o '<title>[^<]*</title>')"
  exit 1
fi
if echo "$NODE3_HTML" | grep -q "<title>Test page</title>"; then
  echo "  ✗ ERROR: /node/3 incorrectly has <title>Test page</title> (cache leak!)"
  exit 1
else
  echo "  ✓ /node/3 does not have Test page title"
fi

echo ""
echo "=== All prerender tests passed! ==="
exit 0
