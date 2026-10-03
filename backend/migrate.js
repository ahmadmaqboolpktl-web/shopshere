const { createClient } = require('@libsql/client');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

async function migrate() {
  const tursoUrl = process.env.TURSO_DATABASE_URL;
  const tursoAuth = process.env.TURSO_AUTH_TOKEN;

  if (!tursoUrl || !tursoAuth) {
    console.error('Please set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN in your environment or .env file before running migration.');
    process.exit(1);
  }

  console.log('Connecting to local SQLite...');
  const localDb = await open({
    filename: './database.sqlite',
    driver: sqlite3.Database
  });

  console.log('Connecting to remote Turso database...');
  const tursoClient = createClient({
    url: tursoUrl,
    authToken: tursoAuth
  });

  try {
    console.log('Migrating schema...');
    const schemaRows = await localDb.all(`SELECT sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'`);
    for (const row of schemaRows) {
      if (row.sql) {
        await tursoClient.execute(row.sql);
      }
    }

    const tables = ['users', 'customers', 'products', 'categories', 'cart_items', 'orders', 'order_items', 'wishlist_items'];

    for (const table of tables) {
      console.log(`Migrating data for table: ${table}...`);
      const rows = await localDb.all(`SELECT * FROM ${table}`);
      if (rows.length === 0) continue;

      // Batch insert logic
      const columns = Object.keys(rows[0]);
      const placeholders = columns.map(() => '?').join(', ');
      const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;
      
      const statements = rows.map(row => ({
        sql,
        args: columns.map(c => row[c])
      }));

      if (statements.length > 0) {
        // executeMultiple doesn't take args, so we use batch
        await tursoClient.batch(statements, 'write');
      }
      
      console.log(`Migrated ${rows.length} rows for ${table}.`);
    }

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

migrate();
