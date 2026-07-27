import { Pool, PoolConfig } from "pg";

let pool: Pool | null = null;

export function getDbPool(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL environment variable is not defined");
    }

    const config: PoolConfig = {
      connectionString,
      max: 10, // Connection pool size limit
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    };

    // Render PostgreSQL requires SSL in production or staging remote connections
    if (
      connectionString.includes("render.com") || 
      process.env.NODE_ENV === "production" ||
      !connectionString.includes("localhost") && !connectionString.includes("127.0.0.1")
    ) {
      config.ssl = {
        rejectUnauthorized: false, // Allows self-signed certificates on Render
      };
    }

    pool = new Pool(config);

    pool.on("error", (err) => {
      console.error("Unexpected error on idle PostgreSQL client", err);
      // Nullify pool to recreate it upon next query on failure
      pool = null;
    });
  }
  return pool;
}

export async function query(text: string, params?: unknown[]) {
  const start = Date.now();
  const dbPool = getDbPool();
  let retries = 3;
  while (retries > 0) {
    try {
      const res = await dbPool.query(text, params);
      const duration = Date.now() - start;
      console.log("Executed query:", { text, duration, rows: res.rowCount });
      return res;
    } catch (err) {
      retries -= 1;
      console.error(`Database query failed (retries left: ${retries}):`, err);
      if (retries === 0) {
        throw err;
      }
      // Wait before retrying (automatic reconnection on transient failure)
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }
}
