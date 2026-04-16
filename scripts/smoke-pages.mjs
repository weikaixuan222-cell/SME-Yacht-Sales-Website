import { spawn } from 'child_process';
import http from 'http';

const PORT = 3001;
const URLS_TO_TEST = [
  '/',
  '/yachts',
  '/contact',
  '/admin/login',
  '/admin/yachts' // might redirect, which is fine, just seeing if it throws 500
];

console.log('Starting Next.js server for smoke test...');
const serverProcess = spawn('npm', ['run', 'start', '--', '-p', String(PORT)], {
  stdio: 'pipe',
  shell: true,
});

let serverReady = false;

serverProcess.stdout.on('data', (data) => {
  const output = data.toString();
  if (output.includes('Ready in') || output.includes(`http://localhost:${PORT}`)) {
    if (!serverReady) {
      serverReady = true;
      runTests();
    }
  }
});

serverProcess.stderr.on('data', (data) => {
  console.error(`Next.js stderr: ${data}`);
});

async function runTests() {
  console.log('Server is up! Running smoke tests...\n');
  let hasError = false;

  for (const path of URLS_TO_TEST) {
    try {
      const res = await new Promise((resolve, reject) => {
        http.get(`http://localhost:${PORT}${path}`, (res) => resolve(res)).on('error', reject);
      });
      console.log(`[GET] ${path} -> Status: ${res.statusCode}`);
      // 200 OK or 307/308 Redirect are acceptable
      if (res.statusCode >= 500) {
        console.error(`❌ Page ${path} returned 500 error!`);
        hasError = true;
      } else {
        console.log(`✅ Page ${path} is accessible.`);
      }
    } catch (err) {
      console.error(`❌ Failed to fetch ${path}:`, err.message);
      hasError = true;
    }
  }

  serverProcess.kill();
  if (hasError) {
    console.error('\n🔴 Smoke tests failed!');
    process.exit(1);
  } else {
    console.log('\n🟢 All smoke tests passed successfully!');
    process.exit(0);
  }
}

// Timeout after 30 seconds
setTimeout(() => {
  if (!serverReady) {
    console.error('❌ Server failed to start within 30 seconds.');
    serverProcess.kill();
    process.exit(1);
  }
}, 30000);
