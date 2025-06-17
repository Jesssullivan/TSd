#!/usr/bin/env node

import { spawn } from 'child_process';
import { readFile, access, mkdir } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url)).slice(0, -1);
const projectRoot = join(__dirname, '..');

// Colors for console output
export const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

// Wait utility
export const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Execute command utility
export async function exec(command, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, [], {
      shell: true,
      stdio: options.silent ? 'pipe' : 'inherit',
      ...options
    });

    let stdout = '';
    let stderr = '';

    if (options.silent) {
      child.stdout?.on('data', (data) => stdout += data.toString());
      child.stderr?.on('data', (data) => stderr += data.toString());
    }

    child.on('error', (err) => {
      reject(new Error(`Command failed to start: ${command}\n${err.message}`));
    });

    child.on('exit', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        const errorMsg = stderr || `Command exited with code ${code}`;
        reject(new Error(`Command failed: ${command}\n${errorMsg}`));
      }
    });
  });
}

// HTTP request utility
export async function httpRequest(url, options = {}) {
  const { method = 'GET', body, headers = {} } = options;
  
  try {
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: body ? JSON.stringify(body) : undefined
    });

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }

    return {
      ok: response.ok,
      status: response.status,
      data
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      error: error.message
    };
  }
}

// Check if cache file exists and contains translations
export async function checkCache(locale, expectedKeys = []) {
  const cacheDir = join(projectRoot, '.tsd-cache');
  const cacheFile = join(cacheDir, `${locale}.json`);
  
  try {
    await access(cacheFile);
    const content = await readFile(cacheFile, 'utf8');
    const cache = JSON.parse(content);
    
    const missing = expectedKeys.filter(key => !cache[key]);
    return {
      exists: true,
      entries: Object.keys(cache).length,
      missing,
      cache
    };
  } catch (error) {
    return {
      exists: false,
      entries: 0,
      missing: expectedKeys,
      error: error.message
    };
  }
}

// Test translation endpoint
export async function testTranslation(baseUrl, text, fromLocale, toLocale) {
  const start = Date.now();
  const response = await httpRequest(`${baseUrl}/api/translate`, {
    method: 'POST',
    body: {
      text,
      native_locale: fromLocale,
      target_locale: toLocale
    }
  });
  const duration = Date.now() - start;

  // Ensure we return a proper error message format
  if (!response.ok && response.data && typeof response.data === 'object') {
    response.data = JSON.stringify(response.data);
  }

  return {
    ...response,
    duration
  };
}

// Test page translation
export async function testPageTranslation(baseUrl, locale, expectedTexts = []) {
  const response = await httpRequest(`${baseUrl}/${locale}/tsd-demo`);
  
  if (!response.ok) {
    return { ok: false, error: 'Failed to load page' };
  }

  const foundTexts = expectedTexts.filter(text => 
    response.data.includes(text)
  );

  return {
    ok: true,
    found: foundTexts,
    missing: expectedTexts.filter(text => !foundTexts.includes(text))
  };
}

// Wait for service to be ready
export async function waitForService(url, maxAttempts = 30, interval = 1000) {
  console.log(`${colors.blue}Waiting for service at ${url}...${colors.reset}`);
  
  for (let i = 0; i < maxAttempts; i++) {
    const response = await httpRequest(url);
    if (response.ok) {
      console.log(`${colors.green}✓ Service ready${colors.reset}`);
      return true;
    }
    await wait(interval);
  }
  
  console.log(`${colors.red}✗ Service not ready after ${maxAttempts} attempts${colors.reset}`);
  return false;
}

// Run test suite
export async function runTestSuite(name, tests) {
  console.log(`\n${colors.blue}=== ${name} ===${colors.reset}\n`);
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      await test.fn();
      console.log(`${colors.green}✓ ${test.name}${colors.reset}`);
      passed++;
    } catch (error) {
      console.log(`${colors.red}✗ ${test.name}${colors.reset}`);
      console.log(`  ${colors.red}${error.message}${colors.reset}`);
      failed++;
      
      // Stop on first failure for faster debugging
      console.log(`\n${colors.red}Test suite halted due to failure${colors.reset}`);
      break;
    }
  }
  
  console.log(`\n${colors.blue}Results: ${colors.green}${passed} passed${colors.reset}, ${colors.red}${failed} failed${colors.reset}\n`);
  
  return failed === 0;
}

// Assert utility
export function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

// Create cache directory
export async function ensureCacheDir() {
  const cacheDir = join(projectRoot, '.tsd-cache');
  try {
    await mkdir(cacheDir, { recursive: true });
  } catch (error) {
    // Directory might already exist
  }
}