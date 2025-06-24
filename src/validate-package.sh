#!/bin/bash

set -e

echo "📦 TSd Package Validation"
echo "========================="

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

# Check if linting passes
echo "🧹 Running linter..."
if pnpm lint; then
    echo "✅ Linting passed"
else
    echo "❌ Linting failed"
    exit 1
fi

# Check TypeScript compilation
echo "📝 Checking TypeScript..."
if pnpm type-check; then
    echo "✅ TypeScript check passed"
else
    echo "❌ TypeScript check failed"
    exit 1
fi

echo ""
echo "🎉 Package Validation Complete!"
echo ""
echo "📋 TSd Package Ready for Publication:"
echo "  ✅ Build system working"
echo "  ✅ All exports available"
echo "  ✅ TypeScript definitions included"
echo "  ✅ gRPC server components"
echo "  ✅ Vite plugin integration"
echo "  ✅ Svelte components"
echo "  ✅ Protocol buffer definitions"
echo "  ✅ Code quality checks passed"
echo ""
echo "🚀 Ready to publish @tinyland/tsd!"