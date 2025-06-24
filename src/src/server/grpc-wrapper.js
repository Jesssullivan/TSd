#!/usr/bin/env node

// Simple wrapper to ensure gRPC server starts correctly in container
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set up environment
process.env.HEALTH_PORT = process.env.HEALTH_PORT || '50052';

// Start the gRPC server
const serverPath = path.join(__dirname, 'grpc-server.js');
const server = spawn('node', [serverPath], {
  stdio: 'inherit',
  env: process.env
});

// Handle signals
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully');
  server.kill('SIGTERM');
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully');
  server.kill('SIGINT');
});

server.on('exit', (code) => {
  process.exit(code);
});