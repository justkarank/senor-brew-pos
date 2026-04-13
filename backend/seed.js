require('dotenv').config();
const mongoose = require('mongoose');
const { ensureDemoData } = require('./services/demoDataService');

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

    console.log('\nDatabase seeded successfully!');
    console.log(`   Mode: ${reset ? 'reset + rebuild' : 'preserve existing + fill missing demo data'}`);
    console.log(`   Demo date key: ${summary.orderDateKey}`);
    console.log(`   ${summary.ordersCreated} demo orders added for today`);
    console.log('\nLogin credentials:');
    console.log('  Admin:   admin@senorbrew.com   / admin123');
    console.log('  Counter: counter@senorbrew.com / counter123');
    console.log('  Kitchen: kitchen@senorbrew.com / kitchen123');

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
