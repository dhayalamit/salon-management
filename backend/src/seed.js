require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('./db');

async function seed() {
  console.log('Seeding database...');

  const passwordHash = await bcrypt.hash('admin123', 10);
  await db.query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ('Salon Admin', 'admin@salon.com', $1, 'admin')
     ON CONFLICT (email) DO NOTHING`,
    [passwordHash]
  );

  const services = [
    ['Hair Cut', 300, 30, 20],
    ['Beard', 150, 15, 20],
    ['Facial', 800, 45, 15],
    ['Hair Spa', 900, 60, 15],
    ['Hair Color', 1200, 60, 10],
    ['Smoothening', 2500, 120, 10],
    ['Keratin', 3000, 150, 10],
    ['Cleanup', 500, 30, 15],
  ];
  for (const [name, price, duration, commission] of services) {
    await db.query(
      `INSERT INTO services (name, price, duration_minutes, commission_percent)
       VALUES ($1,$2,$3,$4) ON CONFLICT DO NOTHING`,
      [name, price, duration, commission]
    );
  }

  const products = [
    ['Shampoo', 'Hair Care', 150, 300, 40],
    ['Serum', 'Hair Care', 200, 450, 25],
    ['Wax', 'Styling', 100, 250, 30],
    ['Hair Gel', 'Styling', 80, 200, 35],
    ['Hair Color', 'Color', 300, 600, 20],
    ['Conditioner', 'Hair Care', 150, 320, 30],
    ['Face Wash', 'Skin Care', 120, 280, 20],
    ['Beard Oil', 'Grooming', 180, 400, 15],
  ];
  for (const [name, category, purchase, selling, stock] of products) {
    await db.query(
      `INSERT INTO products (name, category, purchase_price, selling_price, stock_quantity, low_stock_threshold)
       VALUES ($1,$2,$3,$4,$5,5) ON CONFLICT DO NOTHING`,
      [name, category, purchase, selling, stock]
    );
  }

  const staffMembers = [
    ['Aarav Sharma', '9876543210', 25000, 15],
    ['Priya Patel', '9876543211', 22000, 15],
    ['Rohan Mehta', '9876543212', 20000, 12],
  ];
  for (const [name, phone, salary, commission] of staffMembers) {
    await db.query(
      `INSERT INTO staff (name, phone, salary, commission_percent) VALUES ($1,$2,$3,$4) ON CONFLICT DO NOTHING`,
      [name, phone, salary, commission]
    );
  }

  console.log('Seed complete.');
  console.log('Login with: admin@salon.com / admin123');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
