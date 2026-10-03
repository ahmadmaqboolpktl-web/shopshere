import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import { sampleProducts } from './data';
import bcrypt from 'bcrypt';

let db: Database | null = null;

export async function initDb() {
  db = await open({
    filename: './database.sqlite',
    driver: sqlite3.Database
  });

  // Create tables
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT
    );

    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      email TEXT UNIQUE,
      password TEXT,
      createdAt TEXT
    );

    CREATE TABLE IF NOT EXISTS cart_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customerId INTEGER,
      productId TEXT,
      quantity INTEGER,
      FOREIGN KEY (customerId) REFERENCES customers(id),
      FOREIGN KEY (productId) REFERENCES products(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT,
      description TEXT,
      price REAL,
      category TEXT,
      image TEXT,
      stock INTEGER,
      createdAt TEXT
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customerId INTEGER,
      customerName TEXT,
      customerEmail TEXT,
      address TEXT,
      phone TEXT,
      totalAmount REAL,
      status TEXT,
      createdAt TEXT,
      FOREIGN KEY (customerId) REFERENCES customers(id)
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      orderId INTEGER,
      productId TEXT,
      quantity INTEGER,
      price REAL,
      FOREIGN KEY (orderId) REFERENCES orders(id),
      FOREIGN KEY (productId) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS wishlist_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customerId INTEGER,
      productId TEXT,
      createdAt TEXT,
      FOREIGN KEY (customerId) REFERENCES customers(id),
      FOREIGN KEY (productId) REFERENCES products(id) ON DELETE CASCADE,
      UNIQUE(customerId, productId)
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL
    );
  `);

  // Seed admin user
  const adminExists = await db.get('SELECT * FROM users WHERE username = ?', ['admin']);
  if (!adminExists) {
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    await db.run('INSERT INTO users (username, password) VALUES (?, ?)', ['admin', hashedPassword]);
  }

  // Seed categories if empty
  const categoryCount = await db.get('SELECT COUNT(*) as count FROM categories');
  if (categoryCount.count === 0) {
    const initialCategories = ['Smartphones', 'Laptops', 'Tablets', 'Gaming', 'Accessories', 'Fashion', 'Books'];
    for (const cat of initialCategories) {
      await db.run('INSERT INTO categories (name) VALUES (?)', [cat]);
    }
  }

  // Seed products if empty
  const productCount = await db.get('SELECT COUNT(*) as count FROM products');
  if (productCount.count === 0) {
    for (const p of sampleProducts) {
      await db.run(
        'INSERT INTO products (id, name, description, price, category, image, stock, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [p.id, p.name, p.description, p.price, p.category, p.image, p.stock, p.createdAt]
      );
    }
  }

  // Seed sample orders if empty
  const orderCount = await db.get('SELECT COUNT(*) as count FROM orders');
  if (orderCount.count === 0) {
    const result = await db.run(
      'INSERT INTO orders (customerName, customerEmail, address, phone, totalAmount, status, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
      ['John Doe', 'john@example.com', '123 Test St', '555-0100', 999.00, 'Pending', new Date().toISOString()]
    );
    await db.run(
      'INSERT INTO order_items (orderId, productId, quantity, price) VALUES (?, ?, ?, ?)',
      [result.lastID, '1', 1, 999.00]
    );
  }

  return db;
}

export function getDb() {
  if (!db) throw new Error('Database not initialized');
  return db;
}
