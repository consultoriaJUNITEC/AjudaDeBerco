import { Pool } from 'pg';

let db: Pool | null = null;

export function getDB(): Pool {
  if (!db) {
    db = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });
  }
  return db;
}

export async function initDB(): Promise<Pool> {
  const pool = getDB();
  
  // Test connection
  try {
    await pool.query('SELECT NOW()');
    console.log('Database connected successfully');
    
    // Create tables
    await createTables(pool);
    
    return pool;
  } catch (error) {
    console.error('Database connection failed:', error);
    throw error;
  }
}

async function createTables(pool: Pool): Promise<void> {
  const query = `
    CREATE TABLE IF NOT EXISTS products (
      id_product TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      normalized_name TEXT NOT NULL,
      unit TEXT NOT NULL,
      pos_x INTEGER DEFAULT 0, 
      pos_y INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE TABLE IF NOT EXISTS donors (
      id_donor TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      normalized_name TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS cars (
      id_car TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      date_export TEXT DEFAULT '0' 
    );

    CREATE TABLE IF NOT EXISTS products_car (
      id SERIAL PRIMARY KEY,
      id_car TEXT NOT NULL,
      id_product TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      expiration_date TIMESTAMP NOT NULL,
      FOREIGN KEY (id_car) REFERENCES cars(id_car) ON DELETE CASCADE,
      FOREIGN KEY (id_product) REFERENCES products(id_product) ON DELETE CASCADE
    );
  `;

  try {
    await pool.query(query);
    console.log('Tables created successfully');
  } catch (error) {
    console.error('Error creating tables:', error);
    throw error;
  }
}
