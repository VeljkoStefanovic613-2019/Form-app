import pkg from 'pg';
const { Pool } = pkg;

console.log("Connecting to DB:", process.env.DB_NAME || "formapp");

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'formapp',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'apsolvent',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test database connection
pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Database connection error:', err);
});

export default pool;