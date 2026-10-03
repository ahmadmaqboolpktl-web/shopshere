import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { initDb, getDb } from './db';
import multer from 'multer';
const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPG, PNG, and WEBP are allowed.'));
    }
  }
});

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error('FATAL ERROR: JWT_SECRET is not defined in environment variables.');
  process.exit(1);
}

app.use(cors({
  origin: 'http://localhost:5173'
}));
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Initialize DB
initDb().then(() => console.log('Database initialized'));

// --- Customer Routes ---

app.get('/', (req: Request, res: Response) => {
  res.json({ message: "ShopSphere backend is running" });
});

app.get('/api', (req: Request, res: Response) => {
  res.json({ message: 'Welcome to ShopSphere API' });
});



app.get('/api/products', async (req: Request, res: Response) => {
  const db = getDb();
  const products = await db.all('SELECT * FROM products');
  res.json(products);
});

app.get('/api/products/:id', async (req: Request, res: Response) => {
  const db = getDb();
  const product = await db.get('SELECT * FROM products WHERE id = ?', [req.params.id]);
  if (product) {
    res.json(product);
  } else {
    res.status(404).json({ message: 'Product not found' });
  }
});

// --- Admin Auth ---

app.post('/api/admin/login', async (req: Request, res: Response): Promise<void> => {
  const { username, password } = req.body;
  const db = getDb();
  
  const user = await db.get('SELECT * FROM users WHERE username = ?', [username]);
  if (!user) {
    res.status(401).json({ message: 'Invalid credentials' });
    return;
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    res.status(401).json({ message: 'Invalid credentials' });
    return;
  }

  const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '1d' });
  res.json({ token });
});

// Auth Middleware
const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    if (!payload.username) {
      res.status(403).json({ message: 'Forbidden: Admin access required' });
      return;
    }
    (req as any).user = payload;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Customer Auth Middleware
const requireCustomerAuth = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }
  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    if (!payload.email) {
      res.status(403).json({ message: 'Forbidden: Customer access required' });
      return;
    }
    (req as any).customer = payload;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// --- Customer Auth Routes ---

app.post('/api/auth/register', async (req: Request, res: Response): Promise<void> => {
  const { name, email, password } = req.body;
  if (!name || !email || !password || typeof email !== 'string' || !email.includes('@')) {
    res.status(400).json({ message: 'Valid name, email, and password are required' });
    return;
  }
  const db = getDb();
  
  const existing = await db.get('SELECT * FROM customers WHERE email = ?', [email]);
  if (existing) {
    res.status(400).json({ message: 'Email already in use' });
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const createdAt = new Date().toISOString();
  
  const result = await db.run(
    'INSERT INTO customers (name, email, password, createdAt) VALUES (?, ?, ?, ?)',
    [name, email, hashedPassword, createdAt]
  );
  
  const token = jwt.sign({ id: result.lastID, email, name }, JWT_SECRET, { expiresIn: '7d' });
  res.status(201).json({ token, customer: { id: result.lastID, name, email } });
});

app.post('/api/auth/login', async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;
  const db = getDb();
  
  const customer = await db.get('SELECT * FROM customers WHERE email = ?', [email]);
  if (!customer) {
    res.status(401).json({ message: 'Invalid credentials' });
    return;
  }

  const valid = await bcrypt.compare(password, customer.password);
  if (!valid) {
    res.status(401).json({ message: 'Invalid credentials' });
    return;
  }

  const token = jwt.sign({ id: customer.id, email: customer.email, name: customer.name }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, customer: { id: customer.id, name: customer.name, email: customer.email } });
});

app.post('/api/auth/logout', (req: Request, res: Response) => {
  res.json({ message: 'Logged out successfully' });
});

app.get('/api/auth/me', requireCustomerAuth, async (req: Request, res: Response) => {
  const customerId = (req as any).customer.id;
  const db = getDb();
  const customer = await db.get('SELECT id, name, email, createdAt FROM customers WHERE id = ?', [customerId]);
  if (!customer) {
    return res.status(404).json({ message: 'Customer not found' });
  }
  res.json(customer);
});
// --- Customer Cart Routes ---

app.get('/api/cart', requireCustomerAuth, async (req: Request, res: Response) => {
  const customerId = (req as any).customer.id;
  const db = getDb();
  // We use INNER JOIN to auto-drop items whose products were deleted
  const cartItems = await db.all(`
    SELECT c.id as cartItemId, c.quantity, p.* 
    FROM cart_items c 
    INNER JOIN products p ON c.productId = p.id 
    WHERE c.customerId = ?
  `, [customerId]);
  res.json(cartItems);
});

app.post('/api/cart', requireCustomerAuth, async (req: Request, res: Response): Promise<void> => {
  const customerId = (req as any).customer.id;
  const { productId, quantity } = req.body;
  const db = getDb();
  
  const product = await db.get('SELECT stock FROM products WHERE id = ?', [productId]);
  if (!product) {
    res.status(404).json({ message: 'Product not found' });
    return;
  }

  const existing = await db.get('SELECT id, quantity FROM cart_items WHERE customerId = ? AND productId = ?', [customerId, productId]);
  
  if (existing) {
    const newQty = Math.min(existing.quantity + quantity, product.stock);
    await db.run('UPDATE cart_items SET quantity = ? WHERE id = ?', [newQty, existing.id]);
  } else {
    const newQty = Math.min(quantity, product.stock);
    if (newQty > 0) {
      await db.run('INSERT INTO cart_items (customerId, productId, quantity) VALUES (?, ?, ?)', [customerId, productId, newQty]);
    }
  }
  res.json({ message: 'Cart updated' });
});

app.put('/api/cart/:id', requireCustomerAuth, async (req: Request, res: Response): Promise<void> => {
  const customerId = (req as any).customer.id;
  const { quantity } = req.body;
  const db = getDb();
  
  const item = await db.get(`
    SELECT c.id, p.stock 
    FROM cart_items c 
    JOIN products p ON c.productId = p.id 
    WHERE c.id = ? AND c.customerId = ?
  `, [req.params.id, customerId]);

  if (!item) {
    res.status(404).json({ message: 'Cart item not found' });
    return;
  }

  const newQty = Math.min(Math.max(1, quantity), item.stock);
  await db.run('UPDATE cart_items SET quantity = ? WHERE id = ?', [newQty, req.params.id]);
  res.json({ message: 'Quantity updated' });
});

app.delete('/api/cart/:id', requireCustomerAuth, async (req: Request, res: Response) => {
  const customerId = (req as any).customer.id;
  const db = getDb();
  await db.run('DELETE FROM cart_items WHERE id = ? AND customerId = ?', [req.params.id, customerId]);
  res.json({ message: 'Item removed' });
});

app.delete('/api/cart', requireCustomerAuth, async (req: Request, res: Response) => {
  const customerId = (req as any).customer.id;
  const db = getDb();
  await db.run('DELETE FROM cart_items WHERE customerId = ?', [customerId]);
  res.json({ message: 'Cart cleared' });
});

// --- Customer Wishlist Routes ---
app.get('/api/wishlist', requireCustomerAuth, async (req: Request, res: Response) => {
  const customerId = (req as any).customer.id;
  const db = getDb();
  // INNER JOIN automatically hides wishlist items where the product was deleted
  const wishlistItems = await db.all(`
    SELECT w.id as wishlistId, p.* 
    FROM wishlist_items w 
    INNER JOIN products p ON w.productId = p.id 
    WHERE w.customerId = ?
  `, [customerId]);
  res.json(wishlistItems);
});

app.post('/api/wishlist', requireCustomerAuth, async (req: Request, res: Response) => {
  const customerId = (req as any).customer.id;
  const { productId } = req.body;
  const db = getDb();
  const createdAt = new Date().toISOString();
  // INSERT OR IGNORE cleanly handles duplicates
  await db.run(
    'INSERT OR IGNORE INTO wishlist_items (customerId, productId, createdAt) VALUES (?, ?, ?)',
    [customerId, productId, createdAt]
  );
  res.json({ message: 'Added to wishlist' });
});

app.delete('/api/wishlist/:productId', requireCustomerAuth, async (req: Request, res: Response) => {
  const customerId = (req as any).customer.id;
  const { productId } = req.params;
  const db = getDb();
  await db.run('DELETE FROM wishlist_items WHERE customerId = ? AND productId = ?', [customerId, productId]);
  res.json({ message: 'Removed from wishlist' });
});
// --- Customer Order Routes ---

app.post('/api/orders/checkout', requireCustomerAuth, async (req: Request, res: Response): Promise<void> => {
  const customer = (req as any).customer;
  const { address, phone } = req.body;
  const db = getDb();
  
  if (!address || !phone) {
    res.status(400).json({ message: 'Address and phone are required' });
    return;
  }

  const cartItems = await db.all(`
    SELECT c.quantity, p.id, p.price, p.stock
    FROM cart_items c 
    JOIN products p ON c.productId = p.id 
    WHERE c.customerId = ?
  `, [customer.id]);

  if (cartItems.length === 0) {
    res.status(400).json({ message: 'Cart is empty' });
    return;
  }

  let totalAmount = 0;
  for (const item of cartItems) {
    if (item.quantity > item.stock) {
      res.status(400).json({ message: `Insufficient stock for product ${item.id}` });
      return;
    }
    totalAmount += item.price * item.quantity;
  }

  const createdAt = new Date().toISOString();
  const result = await db.run(
    'INSERT INTO orders (customerId, customerName, customerEmail, address, phone, totalAmount, status, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [customer.id, customer.name, customer.email, address, phone, totalAmount, 'Pending', createdAt]
  );
  const orderId = result.lastID;

  for (const item of cartItems) {
    await db.run(
      'INSERT INTO order_items (orderId, productId, quantity, price) VALUES (?, ?, ?, ?)',
      [orderId, item.id, item.quantity, item.price]
    );
    // reduce stock
    await db.run('UPDATE products SET stock = stock - ? WHERE id = ?', [item.quantity, item.id]);
  }

  await db.run('DELETE FROM cart_items WHERE customerId = ?', [customer.id]);
  
  res.status(201).json({ message: 'Order created successfully', orderId });
});

app.get('/api/orders/my-orders', requireCustomerAuth, async (req: Request, res: Response) => {
  const customerId = (req as any).customer.id;
  const db = getDb();
  const orders = await db.all('SELECT * FROM orders WHERE customerId = ? ORDER BY createdAt DESC', [customerId]);
  res.json(orders);
});

app.get('/api/orders/my-orders/:id', requireCustomerAuth, async (req: Request, res: Response): Promise<void> => {
  const customerId = (req as any).customer.id;
  const db = getDb();
  
  const order = await db.get('SELECT * FROM orders WHERE id = ? AND customerId = ?', [req.params.id, customerId]);
  if (!order) {
    res.status(404).json({ message: 'Order not found' });
    return;
  }
  
  const items = await db.all(`
    SELECT o.quantity, o.price, p.name, p.image 
    FROM order_items o 
    LEFT JOIN products p ON o.productId = p.id 
    WHERE o.orderId = ?
  `, [order.id]);
  
  res.json({ order, items });
});
// --- Admin Protected Routes ---


app.post('/api/upload', requireAuth, upload.single('image'), (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }
  const imageUrl = `http://localhost:5000/uploads/${req.file.filename}`;
  res.json({ url: imageUrl });
});
app.get('/api/admin/customers', requireAuth, async (req: Request, res: Response) => {
  const db = getDb();
  // Select specific fields, explicitly EXCLUDING the password field
  const customers = await db.all('SELECT id, name, email, createdAt FROM customers ORDER BY createdAt DESC');
  res.json(customers);
});
app.get('/api/admin/stats', requireAuth, async (req: Request, res: Response) => {
  const db = getDb();
  const productsCount = await db.get('SELECT COUNT(*) as count FROM products');
  const usersCount = await db.get('SELECT COUNT(*) as count FROM users');
  const ordersCount = await db.get('SELECT COUNT(*) as count FROM orders');
  const sales = await db.get('SELECT SUM(totalAmount) as total FROM orders');

  res.json({
    totalProducts: productsCount.count,
    totalUsers: usersCount.count,
    totalOrders: ordersCount.count,
    totalSales: sales.total || 0
  });
});

app.post('/api/products', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const { id, name, description, price, category, image, stock } = req.body;
  if (!name || typeof price !== 'number' || price < 0 || typeof stock !== 'number' || stock < 0) {
    res.status(400).json({ message: 'Invalid product details. Price and stock must be zero or greater.' });
    return;
  }
  const db = getDb();
  const createdAt = new Date().toISOString();
  
  await db.run(
    'INSERT INTO products (id, name, description, price, category, image, stock, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [id || Date.now().toString(), name, description, price, category, image, stock, createdAt]
  );
  res.status(201).json({ message: 'Product created' });
});

app.put('/api/products/:id', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const { name, description, price, category, image, stock } = req.body;
  if (!name || typeof price !== 'number' || price < 0 || typeof stock !== 'number' || stock < 0) {
    res.status(400).json({ message: 'Invalid product details. Price and stock must be zero or greater.' });
    return;
  }
  const db = getDb();
  
  await db.run(
    'UPDATE products SET name = ?, description = ?, price = ?, category = ?, image = ?, stock = ? WHERE id = ?',
    [name, description, price, category, image, stock, req.params.id]
  );
  res.json({ message: 'Product updated' });
});

app.delete('/api/products/:id', requireAuth, async (req: Request, res: Response) => {
  const db = getDb();
  await db.run('DELETE FROM products WHERE id = ?', [req.params.id]);
  res.json({ message: 'Product deleted' });
});

app.get('/api/orders', requireAuth, async (req: Request, res: Response) => {
  const db = getDb();
  const orders = await db.all('SELECT * FROM orders ORDER BY createdAt DESC');
  res.json(orders);
});

app.get('/api/orders/:id', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const db = getDb();
  const order = await db.get('SELECT * FROM orders WHERE id = ?', [req.params.id]);
  if (!order) {
    res.status(404).json({ message: 'Order not found' });
    return;
  }
  
  const items = await db.all(`
    SELECT o.quantity, o.price, p.name, p.image 
    FROM order_items o 
    LEFT JOIN products p ON o.productId = p.id 
    WHERE o.orderId = ?
  `, [order.id]);
  
  res.json({ order, items });
});

app.put('/api/orders/:id/status', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const { status } = req.body;
  const allowedStatuses = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered'];
  
  if (!allowedStatuses.includes(status)) {
    res.status(400).json({ message: 'Invalid order status' });
    return;
  }
  
  const db = getDb();
  await db.run('UPDATE orders SET status = ? WHERE id = ?', [status, req.params.id]);
  res.json({ message: 'Order status updated' });
});

app.get('/api/admin/categories', requireAuth, async (req: Request, res: Response) => {
  const db = getDb();
  const categories = await db.all('SELECT * FROM categories ORDER BY id ASC');
  res.json(categories);
});

app.get('/api/categories', async (req: Request, res: Response) => {
  const db = getDb();
  const categories = await db.all('SELECT name FROM categories ORDER BY id ASC');
  res.json(categories.map((c: any) => c.name));
});

app.post('/api/admin/categories', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const { name } = req.body;
  if (!name || typeof name !== 'string' || name.trim() === '') {
    res.status(400).json({ message: 'Valid category name is required' });
    return;
  }
  const db = getDb();
  try {
    const result = await db.run('INSERT INTO categories (name) VALUES (?)', [name.trim()]);
    res.status(201).json({ id: result.lastID, name: name.trim() });
  } catch (err: any) {
    if (err.message && err.message.includes('UNIQUE constraint failed')) {
      res.status(400).json({ message: 'Category already exists' });
    } else {
      res.status(500).json({ message: 'Server error' });
    }
  }
});

app.put('/api/admin/categories/:id', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const { name } = req.body;
  const db = getDb();
  
  const category = await db.get('SELECT name FROM categories WHERE id = ?', [req.params.id]);
  if (!category) {
    res.status(404).json({ message: 'Category not found' });
    return;
  }
  
  try {
    await db.run('UPDATE categories SET name = ? WHERE id = ?', [name, req.params.id]);
    await db.run('UPDATE products SET category = ? WHERE category = ?', [name, category.name]);
    res.json({ message: 'Category updated' });
  } catch (err: any) {
    if (err.message && err.message.includes('UNIQUE constraint failed')) {
      res.status(400).json({ message: 'Category already exists' });
    } else {
      res.status(500).json({ message: 'Server error' });
    }
  }
});

app.delete('/api/admin/categories/:id', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const db = getDb();
  const category = await db.get('SELECT name FROM categories WHERE id = ?', [req.params.id]);
  if (!category) {
    res.status(404).json({ message: 'Category not found' });
    return;
  }
  
  const usage = await db.get('SELECT COUNT(*) as count FROM products WHERE category = ?', [category.name]);
  if (usage.count > 0) {
    res.status(400).json({ message: `Cannot delete category used by ${usage.count} product(s)` });
    return;
  }
  
  await db.run('DELETE FROM categories WHERE id = ?', [req.params.id]);
  res.json({ message: 'Category deleted' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
