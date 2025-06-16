import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const PROTO_PATH = path.join(process.cwd(), 'src/proto');
const OUT_DIR = path.join(process.cwd(), 'src/proto');

// Check if protoc is installed
try {
  execSync('protoc --version', { stdio: 'ignore' });
} catch {
  console.error('protoc is not installed. Please install protobuf compiler.');
  process.exit(1);
}

// Generate TypeScript definitions
console.log('Generating TypeScript definitions from proto files...');

try {
  // Generate JS files
  execSync(
    `npx protoc \\
    --plugin=protoc-gen-ts=./node_modules/.bin/protoc-gen-ts \\
    --js_out=import_style=commonjs,binary:${OUT_DIR} \\
    --ts_out=${OUT_DIR} \\
    -I ${PROTO_PATH} \\
    ${PROTO_PATH}/translation.proto
  `,
    { stdio: 'inherit' }
  );

  console.log('Proto files compiled successfully!');
} catch (error) {
  console.error('Failed to compile proto files:', error);
  process.exit(1);
}
