require('dotenv').config();
const mongoose = require('mongoose');
const { ensureAdminUser, ensureDemoData } = require('./services/demoDataService');

async function seed() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('Missing MONGO_URI. Create backend/.env from backend/.env.example before seeding.');
    }

    await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 15000 });
    console.log('Connected to MongoDB Atlas');
    const reset = process.argv.includes('--reset');
    const summary = await ensureDemoData({
      reset,
      log: console.log
    });
    await ensureAdminUser({ log: console.log });

    console.log('\nDatabase seeded successfully!');
    console.log(`   Mode: ${reset ? 'reset + rebuild' : 'preserve existing + fill missing demo data'}`);
    console.log(`   Demo date key: ${summary.orderDateKey}`);
    console.log(`   ${summary.ordersCreated} demo orders added for today`);
    console.log('\nLogin setup:');
    console.log('  Private admin: set ADMIN_EMAIL and ADMIN_PASSWORD in backend/.env or Render.');
    console.log('  Public demo: use /api/auth/demo with DEMO_ACCESS_ENABLED=true; demo writes are blocked unless DEMO_WRITE_ACCESS=true.');

    process.exit(0);
  } catch (err) {
    if (/whitelist|network access/i.test(err.message)) {
      console.error('MongoDB Atlas rejected the connection. Add your current IP or 0.0.0.0/0 in Atlas Network Access.');
    }
    console.error('Seeding error:', err.message);
    process.exit(1);
  }
}

seed();
