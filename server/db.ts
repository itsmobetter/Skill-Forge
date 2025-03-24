import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Configure connection pool with optimal settings
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
});

// Set up drizzle with schema
export const db = drizzle(pool, { schema });

// Helper function to execute optimized queries with error handling
export async function executeQuery<T>(
  queryFn: () => Promise<T>,
  errorMessage: string = "Database query failed"
): Promise<T> {
  try {
    // Start timer to measure query performance
    const startTime = performance.now();
    
    // Execute the query
    const result = await queryFn();
    
    // Calculate query execution time
    const executionTime = performance.now() - startTime;
    
    // Log slow queries (taking more than 200ms) for performance monitoring
    if (executionTime > 200) {
      console.warn(`Slow query detected (${Math.round(executionTime)}ms): ${queryFn.toString().slice(0, 150)}...`);
    }
    
    return result;
  } catch (error) {
    console.error(`${errorMessage}:`, error);
    throw new Error(errorMessage);
  }
}
