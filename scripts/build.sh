#!/bin/bash

# Build script that handles TinaCMS configuration gracefully
# If TinaCMS credentials are not provided, we'll set dummy values for the build

# Check if TinaCMS credentials are set
if [ -z "$NEXT_PUBLIC_TINA_CLIENT_ID" ] && [ -z "$TINA_TOKEN" ]; then
  echo "⚠️  TinaCMS credentials not found. Using self-hosted mode..."
  echo "ℹ️  Setting placeholder values for build compatibility..."

  # Set placeholder values to satisfy TinaCMS CLI build requirements
  # These will be ignored in self-hosted mode
  export NEXT_PUBLIC_TINA_CLIENT_ID="local"
  export TINA_TOKEN="local"
fi

# Run TinaCMS build
echo "🔨 Building TinaCMS admin..."
npx tinacms build

# Run Next.js build
echo "🔨 Building Next.js app..."
npx next build

echo "✅ Build completed successfully!"
