const { execSync } = require('child_process');
const path = require('path');

const BACKEND_DIR = path.join(__dirname, 'backend');
const FRONTEND_DIR = path.join(__dirname, 'frontend');

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

console.log('╔════════════════════════════════════════╗');
console.log('║   Senor Brew Club POS — Setup Script   ║');
console.log('╚════════════════════════════════════════╝\n');

run('📦 Installing backend dependencies...', 'npm install', BACKEND_DIR);
run('📦 Installing frontend dependencies...', 'npm install', FRONTEND_DIR);
run('🌱 Seeding database with users & menu items...', 'node seed.js', BACKEND_DIR);

console.log('\n╔════════════════════════════════════════╗');
console.log('║          ✅  Setup Complete!           ║');
console.log('╚════════════════════════════════════════╝');
console.log('\nTo start the application, open TWO terminals:\n');
console.log('  Terminal 1 (Backend):');
console.log('    cd senorbrew/backend');
console.log('    npm start\n');
console.log('  Terminal 2 (Frontend):');
console.log('    cd senorbrew/frontend');
console.log('    npm run dev\n');
console.log('  Then open: http://localhost:5173\n');
console.log('Login Credentials:');
console.log('  Admin:   admin@senorbrew.com   / admin123');
console.log('  Counter: counter@senorbrew.com / counter123');
console.log('  Kitchen: kitchen@senorbrew.com / kitchen123\n');
