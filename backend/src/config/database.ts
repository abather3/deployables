import { Pool } from 'pg';
import { getSecureConfig } from './config';
import { setDefaultResultOrder, promises as dnsPromises } from 'dns';
import { isIP } from 'net';

// Prefer IPv4 DNS resolution to avoid IPv6 ENETUNREACH on some hosts
setDefaultResultOrder('ipv4first');

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/escashop';

// PostgreSQL configuration
console.log('Using PostgreSQL database');

// Pool instance (initialized in connectDatabase)
let pool!: Pool;

const connectDatabase = async (): Promise<void> => {
  try {
    // Parse DATABASE_URL and resolve IPv4 address for hostname
    const dbUrl = DATABASE_URL;
    const url = new URL(dbUrl);

    const username = decodeURIComponent(url.username || '');
    const password = decodeURIComponent(url.password || '');
    const database = (url.pathname || '/postgres').slice(1) || 'postgres';
    const port = url.port ? parseInt(url.port, 10) : 5432;
    const originalHost = url.hostname || 'localhost';
    let host = originalHost;

    const hasPgBouncer = url.searchParams.get('pgbouncer') === 'true';
    const sslMode = url.searchParams.get('sslmode') || 'none';
    const isPoolerHost = originalHost.includes('pooler.supabase.com');
    const isDirectHost = originalHost.endsWith('.supabase.co') && !isPoolerHost;

    console.log('[DB] Parsed DATABASE_URL (sanitized):', {
      host: originalHost,
      port,
      database,
      user: username,
      isPoolerHost,
      isDirectHost,
      hasPgBouncer,
      sslMode
    });

    // Resolve IPv4 if host is not an IP literal and not localhost
    if (host !== 'localhost' && isIP(host) === 0) {
      try {
        const { address } = await dnsPromises.lookup(host, { family: 4 });
        console.log('[DB] IPv4 DNS resolved:', { host: originalHost, resolvedIPv4: address });
        host = address;
      } catch (e) {
        console.warn('[DB] IPv4 DNS lookup failed, using original host:', originalHost, e);
      }
    }

    // Quick configuration sanity checks
    if (isPoolerHost && port !== 6543) {
      console.warn('[DB] Configuration issue: pooler host detected but port is not 6543.');
    }
    if (isDirectHost && port === 6543) {
      console.warn('[DB] Configuration issue: direct db host on port 6543 will refuse connections.');
    }
    if (isPoolerHost && !hasPgBouncer) {
      console.warn('[DB] Configuration issue: pooler host without pgbouncer=true parameter.');
    }

    // Create the pool using explicit fields (avoids internal IPv6 resolution)
    pool = new Pool({
      host,
      port,
      database,
      user: username,
      password,
      ssl: dbUrl.includes('localhost') ? false : { rejectUnauthorized: false },
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000, // Increased from 2000ms to 10000ms for Supabase
    });

    console.log('[DB] Creating pg Pool with:', { resolvedHost: host, port, database, user: username });

    const client = await pool.connect();
    console.log('Database connection established');
    client.release();
  } catch (error) {
    console.error('Database connection failed:', error);
    throw error;
  }
};

const initializeDatabase = async (): Promise<void> => {
  try {
    console.log('Checking database initialization status...');
    
    // Check if database is already initialized by looking for key tables
    try {
      const result = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name IN ('customers', 'system_settings', 'counters')
        );
      `);
      
      if (result.rows[0].exists) {
        console.log('Database already initialized, skipping initialization');
        return;
      }
    } catch (checkError) {
      console.log('Database check failed, proceeding with initialization...');
    }
    
    console.log('Running PostgreSQL database initialization...');
    const fs = require('fs');
    const path = require('path');
    
    // Read the complete migration SQL file
    const migrationPath = path.join(__dirname, '../database/complete-migration.sql');
    
    // Check if the migration file exists
    if (!fs.existsSync(migrationPath)) {
      console.log('No complete-migration.sql found, assuming migrations were run separately');
      return;
    }
    
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Parse SQL statements handling dollar-quoted strings
    const statements: string[] = [];
    let currentStatement = '';
    let inDollarQuote = false;
    let dollarQuoteTag = '';
    
    const lines = migrationSQL.split('\n');
    
    for (let line of lines) {
      // Skip comments and empty lines
      if (line.trim().startsWith('--') || line.trim() === '') {
        continue;
      }
      
      // Check for dollar quotes
      const dollarQuoteMatch = line.match(/\$([^$]*)\$/);
      if (dollarQuoteMatch) {
        if (!inDollarQuote) {
          inDollarQuote = true;
          dollarQuoteTag = dollarQuoteMatch[0];
        } else if (dollarQuoteMatch[0] === dollarQuoteTag) {
          inDollarQuote = false;
          dollarQuoteTag = '';
        }
      }
      
      currentStatement += line + '\n';
      
      // If we're not in a dollar quote and the line ends with semicolon, it's a statement end
      if (!inDollarQuote && line.trim().endsWith(';')) {
        statements.push(currentStatement.trim());
        currentStatement = '';
      }
    }
    
    // Add any remaining statement
    if (currentStatement.trim()) {
      statements.push(currentStatement.trim());
    }
    
    // Execute each statement
    for (const statement of statements) {
      if (statement.trim()) {
        await pool.query(statement);
      }
    }
    
    console.log('PostgreSQL database initialized successfully');
  } catch (error) {
    console.error('Error initializing PostgreSQL database:', error);
    throw error;
  }
};

export { pool, connectDatabase, initializeDatabase };

// Graceful shutdown - only handle explicit shutdown signals
let isShuttingDown = false;

const gracefulShutdown = () => {
  if (isShuttingDown) return;
  isShuttingDown = true;
  
  console.log('Closing database connection pool...');
  if (pool) {
    pool.end(() => {
      console.log('Database connection pool closed');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
};

// Only handle actual shutdown signals, not development reload signals
process.on('SIGTERM', gracefulShutdown);
process.on('SIGQUIT', gracefulShutdown);

// Handle Ctrl+C in production, but not in development with nodemon  
if (process.env.NODE_ENV === 'production') {
  process.on('SIGINT', gracefulShutdown);
}

export default pool;
