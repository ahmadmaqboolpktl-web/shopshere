import { createClient, Client } from '@libsql/client';
import { sampleProducts } from './data';
import bcrypt from 'bcrypt';
import fs from 'fs';
import path from 'path';

let client: Client | null = null;

export const dbWrapper = {
  all: async (sql: string, params: any[] = []) => {
    const rs = await client!.execute({ sql, args: params });
    return rs.rows as any[];
  },
  get: async (sql: string, params: any[] = []) => {
    const rs = await client!.execute({ sql, args: params });
    return rs.rows[0] as any | undefined;
  },
  run: async (sql: string, params: any[] = []) => {
    const rs = await client!.execute({ sql, args: params });
    return { lastID: Number(rs.lastInsertRowid), changes: rs.rowsAffected };
  },
  exec: async (sql: string) => {
    await client!.executeMultiple(sql);
  }
};

export async function initDb() {
  let dbUrl = process.env.TURSO_DATABASE_URL;
  let authToken = process.env.TURSO_AUTH_TOKEN;

  if (!dbUrl) {
    let localPath = 'database.sqlite';
    if (process.env.VERCEL) {
      localPath = '/tmp/database.sqlite';
      if (!fs.existsSync(localPath)) {
        const sourceDb = path.join(process.cwd(), 'database.sqlite');
        if (fs.existsSync(sourceDb)) {
          fs.copyFileSync(sourceDb, localPath);
        }
      }
    }
    dbUrl = `file:${localPath}`;
  }

  const config: any = { url: dbUrl };
  if (authToken) {
    config.authToken = authToken;
  }
  
  client = createClient(config);

  // Create tables
  await dbWrapper.exec(`
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

  const cols = await dbWrapper.all('PRAGMA table_info(categories)');
  if (!cols.find(c => c.name === 'parentId')) {
    await dbWrapper.run('ALTER TABLE categories ADD COLUMN parentId INTEGER REFERENCES categories(id)');
  }

  // Seed admin user
  const adminExists = await dbWrapper.get('SELECT * FROM users WHERE username = ?', ['admin']);
  if (!adminExists) {
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    await dbWrapper.run('INSERT INTO users (username, password) VALUES (?, ?)', ['admin', hashedPassword]);
  }

  // Seed categories if empty
  const categoryCount = await dbWrapper.get('SELECT COUNT(*) as count FROM categories');
  if (Number(categoryCount.count) === 0) {
    const initialCategories = ['Smartphones', 'Laptops', 'Tablets', 'Gaming', 'Accessories', 'Fashion', 'Books'];
    for (const cat of initialCategories) {
      await dbWrapper.run('INSERT INTO categories (name) VALUES (?)', [cat]);
    }
  }

  // Seed products if empty
  const productCount = await dbWrapper.get('SELECT COUNT(*) as count FROM products');
  if (Number(productCount.count) === 0) {
    for (const p of sampleProducts) {
      await dbWrapper.run(
        'INSERT INTO products (id, name, description, price, category, image, stock, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [p.id, p.name, p.description, p.price, p.category, p.image, p.stock, p.createdAt]
      );
    }
  }

  // Seed sample customers if empty (vital for Vercel ephemeral DBs to not look broken)
  const customerCount = await dbWrapper.get('SELECT COUNT(*) as count FROM customers');
  if (Number(customerCount.count) === 0) {
    const hashedCustPw = await bcrypt.hash('password123', 10);
    const demoCustId = (await dbWrapper.run(
      'INSERT INTO customers (name, email, password, createdAt) VALUES (?, ?, ?, ?)',
      ['Demo User', 'demo@example.com', hashedCustPw, new Date().toISOString()]
    )).lastID;
    
    // Seed sample wishlist & cart for this user
    await dbWrapper.run('INSERT INTO wishlist_items (customerId, productId, createdAt) VALUES (?, ?, ?)', [demoCustId, '1', new Date().toISOString()]);
    await dbWrapper.run('INSERT INTO cart_items (customerId, productId, quantity) VALUES (?, ?, ?)', [demoCustId, '2', 1]);
  }

  // Seed sample orders if empty
  const orderCount = await dbWrapper.get('SELECT COUNT(*) as count FROM orders');
  if (Number(orderCount.count) === 0) {
    const result = await dbWrapper.run(
      'INSERT INTO orders (customerName, customerEmail, address, phone, totalAmount, status, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
      ['John Doe', 'john@example.com', '123 Test St', '555-0100', 999.00, 'Pending', new Date().toISOString()]
    );
    await dbWrapper.run(
      'INSERT INTO order_items (orderId, productId, quantity, price) VALUES (?, ?, ?, ?)',
      [result.lastID, '1', 1, 999.00]
    );
  }

  return dbWrapper;
}

export function getDb() {
  if (!client) throw new Error('Database not initialized');
  return dbWrapper;
}
