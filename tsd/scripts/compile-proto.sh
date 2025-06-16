#!/bin/bash

# Compile protobuf files for gRPC-Web
PROTO_PATH="src/proto"
OUT_DIR="src/proto"

# Install protoc-gen-grpc-web if not available
if ! command -v protoc-gen-grpc-web &> /dev/null; then
  echo "Installing protoc-gen-grpc-web..."
  curl -L https://github.com/grpc/grpc-web/releases/download/1.5.0/protoc-gen-grpc-web-1.5.0-darwin-aarch64 -o /usr/local/bin/protoc-gen-grpc-web
  chmod +x /usr/local/bin/protoc-gen-grpc-web
fi

# Generate JavaScript files
protoc -I=$PROTO_PATH \
  --js_out=import_style=commonjs:$OUT_DIR \
  --grpc-web_out=import_style=commonjs,mode=grpcwebtext:$OUT_DIR \
  $PROTO_PATH/translation.proto

echo "Proto files compiled successfully!"