const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

const BACKEND_DIR = path.join(__dirname, 'backend');
const FRONTEND_DIR = path.join(__dirname, 'frontend');
const BACKEND_ENV_PATH = path.join(BACKEND_DIR, '.env');
const REQUIRED_BACKEND_ENV_VARS = ['MONGO_URI', 'JWT_SECRET'];

function run(label, cmd, cwd) {
  console.log(`\n${label}`);
  try {
    execSync(cmd, { cwd, stdio: 'inherit' });
  } catch (err) {
    console.error(`\nFailed: ${label}`);
    console.error(err.message);
    process.exit(1);
  }
}

function getInstallCommand(dir) {
  return fs.existsSync(path.join(dir, 'package-lock.json')) ? 'npm ci' : 'npm install';
}

function getDefinedEnvKeys(filePath) {
  return new Set(
    fs
      .readFileSync(filePath, 'utf8')
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#'))
      .map(line => line.split('=', 1)[0].trim())
      .filter(Boolean)
  );
}

function ensureBackendEnv() {
  if (!fs.existsSync(BACKEND_ENV_PATH)) {
    console.error('\nMissing backend/.env');
    console.error('Copy backend/.env.example to backend/.env, add your MongoDB URI and JWT secret, then rerun node setup.js.');
    process.exit(1);
  }

  const envKeys = getDefinedEnvKeys(BACKEND_ENV_PATH);
  const missingKeys = REQUIRED_BACKEND_ENV_VARS.filter(key => !envKeys.has(key));

  if (missingKeys.length > 0) {
    console.error(`\nbackend/.env is missing required keys: ${missingKeys.join(', ')}`);
    console.error('Update backend/.env and rerun node setup.js.');
    process.exit(1);
  }
}

console.log('========================================');
console.log('Senor Brew Club POS - Setup Script');
console.log('========================================');

ensureBackendEnv();

run('Installing backend dependencies...', getInstallCommand(BACKEND_DIR), BACKEND_DIR);
run('Installing frontend dependencies...', getInstallCommand(FRONTEND_DIR), FRONTEND_DIR);
run('Seeding database with demo users, menu items, and orders...', 'node seed.js', BACKEND_DIR);

console.log('\n========================================');
console.log('Setup complete');
console.log('========================================');
console.log('\nTo start the application, open TWO terminals:\n');
console.log('  Terminal 1 (Backend):');
console.log('    cd senorbrew/backend');
console.log('    npm run dev\n');
console.log('  Terminal 2 (Frontend):');
console.log('    cd senorbrew/frontend');
console.log('    npm run dev\n');
console.log('  Then open: http://localhost:5173\n');
console.log('Login Credentials:');
console.log('  Admin:   admin@senorbrew.com   / admin123');
console.log('  Counter: counter@senorbrew.com / counter123');
console.log('  Kitchen: kitchen@senorbrew.com / kitchen123\n');
