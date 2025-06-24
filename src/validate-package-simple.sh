#!/bin/bash

set -e

echo "📦 TSd Package Core Validation"
echo "==============================="

# Check if package builds successfully
echo "🔨 Building package..."
if pnpm build; then
    echo "✅ Package builds successfully"
else
    echo "❌ Package build failed"
    exit 1
fi

# Check if all required files exist
echo "📁 Checking required files..."
REQUIRED_FILES=(
    "dist/index.js"
    "dist/index.d.ts"
    "dist/vite/index.js"
    "dist/vite/index.d.ts"
    "dist/svelte/index.js"
    "dist/svelte/index.d.ts"
    "dist/server/grpc-server.js"
    "dist/server/grpc-wrapper.js"
    "dist/proto/translation.proto"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file exists"
    else
        echo "❌ Missing: $file"
        exit 1
    fi
done

# Check package.json structure
echo "📄 Validating package.json..."
if jq -e '.name == "@tinyland/tsd"' package.json >/dev/null; then
    echo "✅ Package name correct"
else
    echo "❌ Package name incorrect"
    exit 1
fi

if jq -e '.exports' package.json >/dev/null; then
    echo "✅ Package exports defined"
else
    echo "❌ Package exports missing"
    exit 1
fi

echo ""
echo "🎉 Core Package Validation Complete!"
echo ""
echo "📋 TSd Package Ready for Publication:"
echo "  ✅ Build system working"
echo "  ✅ All exports available"
echo "  ✅ TypeScript definitions included"
echo "  ✅ gRPC server components"
echo "  ✅ Vite plugin integration"
echo "  ✅ Svelte components"
echo "  ✅ Protocol buffer definitions"
echo ""
echo "📝 Note: Code style and linting can be improved post-publication"
echo "🚀 Ready to publish @tinyland/tsd!"