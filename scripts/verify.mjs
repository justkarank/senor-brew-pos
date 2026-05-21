import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as sleep } from 'node:timers/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const backendDir = path.join(rootDir, 'backend');
const npmCommand = 'npm';
const baseUrl = 'http://127.0.0.1:5000';
const backendLogLines = [];
const verifiedChecks = [];

process.env.NODE_ENV = 'test';
process.env.ENABLE_DEMO_BOOTSTRAP = 'true';
process.env.DEMO_ACCESS_ENABLED = 'true';
process.env.DEMO_WRITE_ACCESS = 'true';
process.env.DEMO_PASSWORD_LOGIN_ENABLED = 'false';

const addBackendLog = (chunk) => {
  const lines = chunk
    .toString()
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter(Boolean);

  backendLogLines.push(...lines);

  if (backendLogLines.length > 80) {
    backendLogLines.splice(0, backendLogLines.length - 80);
  }
};

const runCommand = (command, args, cwd) =>
  new Promise((resolve, reject) => {
    const executable = process.platform === 'win32' ? 'cmd.exe' : command;
    const commandArgs = process.platform === 'win32'
      ? ['/d', '/s', '/c', command, ...args]
      : args;

    const child = spawn(executable, commandArgs, {
      cwd,
      stdio: 'inherit',
      shell: false
    });

    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${command} ${args.join(' ')} exited with code ${code}`));
    });
  });

const request = async (
  pathname,
  {
    method = 'GET',
    token,
    body,
    expectedStatus = 200
  } = {}
) => {
  const headers = {};

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${baseUrl}${pathname}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined
  });

  const text = await response.text();
  let data = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (response.status !== expectedStatus) {
    throw new Error(
      `${method} ${pathname} expected ${expectedStatus} but got ${response.status}: ${JSON.stringify(data)}`
    );
  }

  return { status: response.status, data };
};

const expect = (condition, message) => {
  if (!condition) {
    throw new Error(message);
  }
};

const waitForHealthyBackend = async () => {
  const deadline = Date.now() + 90000;
  let lastHealth = null;
  let lastNetworkError = null;

  while (Date.now() < deadline) {
    try {
      const health = await request('/api/health');
      lastHealth = health.data;

      if (health.data?.database === 'connected') {
        return health.data;
      }
    } catch (error) {
      lastNetworkError = error;
    }

    await sleep(2000);
  }

  if (lastHealth) {
    throw new Error(
      `Backend never reached a connected database state. Last health response: ${JSON.stringify(lastHealth)}`
    );
  }

  throw lastNetworkError || new Error('Backend never became reachable.');
};

const loginDemoRole = async (role) =>
  request('/api/auth/demo', {
    method: 'POST',
    body: { role }
  });

const runSmokeChecks = async () => {
  const health = await request('/api/health');
  expect(
    health.data?.database === 'connected',
    `Health endpoint did not report a connected database: ${JSON.stringify(health.data)}`
  );
  verifiedChecks.push('Health endpoint reports a connected database');

  await request('/api/auth/login', {
    method: 'POST',
    body: { email: 'admin@senorbrew.com', password: 'wrongpass' },
    expectedStatus: 401
  });
  verifiedChecks.push('Invalid login is rejected with 401');

  const adminLogin = await loginDemoRole('admin');
  const counterLogin = await loginDemoRole('counter');
  const kitchenLogin = await loginDemoRole('kitchen');

  expect(adminLogin.data?.user?.role === 'admin', 'Admin login returned the wrong role');
  expect(counterLogin.data?.user?.role === 'counter', 'Counter login returned the wrong role');
  expect(kitchenLogin.data?.user?.role === 'kitchen', 'Kitchen login returned the wrong role');
  expect(adminLogin.data?.user?.isDemo === true, 'Demo endpoint did not return a demo session');
  verifiedChecks.push('All three demo users can log in successfully through the demo endpoint when verification opts in');

  const adminToken = adminLogin.data.token;
  const counterToken = counterLogin.data.token;
  const kitchenToken = kitchenLogin.data.token;

  const adminSession = await request('/api/auth/me', { token: adminToken });
  expect(adminSession.data?.user?.role === 'admin', 'Session validation endpoint returned the wrong user');

  await request('/api/auth/me', {
    token: `${adminToken}broken`,
    expectedStatus: 401
  });
  verifiedChecks.push('Session validation endpoint accepts valid tokens and rejects invalid ones');

  const adminMenu = await request('/api/menu', { token: adminToken });
  expect(
    Array.isArray(adminMenu.data) && adminMenu.data.length >= 15,
    'Admin menu fetch failed or returned too few items'
  );
  verifiedChecks.push('Admin can load menu management data');

  const availableMenu = await request('/api/menu/available', { token: counterToken });
  expect(
    Array.isArray(availableMenu.data) && availableMenu.data.length > 0,
    'Counter menu fetch returned no available items'
  );
  verifiedChecks.push('Counter can load available billing items');

  await request('/api/dashboard/stats', { token: counterToken, expectedStatus: 403 });
  await request('/api/menu/available', { token: kitchenToken, expectedStatus: 403 });
  verifiedChecks.push('Role protections reject unauthorized access');

  const kitchenOrders = await request('/api/orders/today', { token: kitchenToken });
  expect(
    Array.isArray(kitchenOrders.data) && kitchenOrders.data.length >= 3,
    'Kitchen orders did not load as expected'
  );
  verifiedChecks.push('Kitchen can load today\'s orders');

  const dashboardBefore = await request('/api/dashboard/stats', { token: adminToken });
  expect(
    dashboardBefore.data?.totalOrders >= 30,
    'Dashboard totals are below the seeded demo baseline'
  );
  verifiedChecks.push('Dashboard stats load correctly');

  const tempItemName = `QA Demo Mocha ${Date.now()}`;
  const tempItem = await request('/api/menu', {
    method: 'POST',
    token: adminToken,
    body: {
      name: tempItemName,
      category: 'Coffee',
      price: 175,
      stockQuantity: 12,
      isAvailable: true
    },
    expectedStatus: 201
  });

  const updatedTempItem = await request(`/api/menu/${tempItem.data._id}`, {
    method: 'PUT',
    token: adminToken,
    body: {
      price: 185,
      stockQuantity: 18,
      isAvailable: true
    }
  });
  expect(updatedTempItem.data?.price === 185, 'Menu update did not persist');

  await request(`/api/menu/${tempItem.data._id}`, {
    method: 'DELETE',
    token: adminToken,
    expectedStatus: 200
  });
  verifiedChecks.push('Menu create, update, and delete all work');

  const lowStockItem = adminMenu.data.find((item) => item.stockQuantity < 10);
  expect(lowStockItem, 'No low stock item found for inventory verification');

  const restockedItem = await request(`/api/menu/${lowStockItem._id}`, {
    method: 'PUT',
    token: adminToken,
    body: { stockQuantity: 14 }
  });
  expect(restockedItem.data?.stockQuantity === 14, 'Inventory restock did not persist');
  verifiedChecks.push('Inventory stock updates work');

  const billableItem = availableMenu.data[0];
  const createdOrder = await request('/api/orders', {
    method: 'POST',
    token: counterToken,
    body: {
      items: [{ itemId: billableItem._id, quantity: 1 }],
      discountPercentage: 5
    },
    expectedStatus: 201
  });
  expect(createdOrder.data?.tokenNumber >= 31, 'Billing did not generate a new token');
  verifiedChecks.push('Counter can place a new bill successfully');

  const preparingOrder = await request(`/api/orders/${createdOrder.data._id}/status`, {
    method: 'PUT',
    token: kitchenToken,
    body: { status: 'preparing' }
  });
  expect(preparingOrder.data?.status === 'preparing', 'Kitchen status did not change to preparing');

  const readyOrder = await request(`/api/orders/${createdOrder.data._id}/status`, {
    method: 'PUT',
    token: kitchenToken,
    body: { status: 'ready' }
  });
  expect(readyOrder.data?.status === 'ready', 'Kitchen status did not change to ready');
  verifiedChecks.push('Kitchen can move orders from pending to ready');

  const dashboardAfter = await request('/api/dashboard/stats', { token: adminToken });
  expect(
    dashboardAfter.data?.totalOrders === dashboardBefore.data.totalOrders + 1,
    'Dashboard totals did not reflect a newly billed order'
  );
  verifiedChecks.push('Dashboard totals update after billing');
};

const printBackendLogs = () => {
  if (backendLogLines.length === 0) {
    return;
  }

  console.error('\nRecent backend output:');
  backendLogLines.forEach((line) => console.error(line));
};

const stopProcess = async (child) => {
  if (!child || child.exitCode !== null || child.killed) {
    return;
  }

  child.kill('SIGINT');

  const deadline = Date.now() + 10000;

  while (child.exitCode === null && Date.now() < deadline) {
    await sleep(250);
  }

  if (child.exitCode === null) {
    child.kill('SIGKILL');
  }
};

let backendServer = null;
let seededOnce = false;

try {
  console.log('Building frontend production bundle...');
  await runCommand(npmCommand, ['--prefix', 'frontend', 'run', 'build'], rootDir);

  console.log('Seeding fresh demo data...');
  await runCommand(npmCommand, ['--prefix', 'backend', 'run', 'seed', '--', '--reset'], rootDir);
  seededOnce = true;

  console.log('Starting backend for smoke checks...');
  backendServer = spawn(process.execPath, ['server.js'], {
    cwd: backendDir,
    stdio: ['ignore', 'pipe', 'pipe']
  });

  backendServer.stdout.on('data', addBackendLog);
  backendServer.stderr.on('data', addBackendLog);
  backendServer.on('error', (error) => addBackendLog(`Backend process error: ${error.message}`));

  await waitForHealthyBackend();
  await runSmokeChecks();

  console.log('\nVerification passed:');
  verifiedChecks.forEach((check) => console.log(`- ${check}`));
} catch (error) {
  console.error(`\nVerification failed: ${error.message}`);
  printBackendLogs();
  process.exitCode = 1;
} finally {
  await stopProcess(backendServer);

  if (seededOnce) {
    try {
      console.log('\nRestoring fresh demo data after verification...');
      await runCommand(npmCommand, ['--prefix', 'backend', 'run', 'seed', '--', '--reset'], rootDir);
    } catch (error) {
      console.error(`Failed to restore demo data: ${error.message}`);
      process.exitCode = 1;
    }
  }
}
