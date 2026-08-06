import pg from 'pg';

const { Pool } = pg;

// Singleton database connection pool
let pool;

if (!pool) {
  const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/postgres';
  
  // Enable SSL only for production cloud databases (non-localhost)
  const isCloudDb = process.env.NODE_ENV === 'production' || (!connectionString.includes('localhost') && !connectionString.includes('127.0.0.1'));

  pool = new Pool({
    connectionString,
    ssl: isCloudDb ? { rejectUnauthorized: false } : false,
    max: 20,              // Maximum number of clients in pool
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 4000
  });

  pool.on('error', (err) => {
    console.error('Unexpected database error on idle client:', err);
  });
}

export default pool;
