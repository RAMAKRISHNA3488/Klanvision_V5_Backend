/**
 * src/db.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Returns a mysql2 promise connection.
 *
 * In production (Cloudflare Workers + Hyperdrive):
 *   env.HYPERDRIVE.connectionString  → mysql://user:pass@host:port/db
 *   Hyperdrive handles connection pooling, TLS, and keeps connections warm.
 *
 * In local dev (`wrangler dev`):
 *   Hyperdrive binding is unavailable, so we fall back to the individual
 *   DB_* variables defined in .dev.vars and build a connection string manually.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { createConnection } from 'mysql2/promise';

/**
 * Opens and returns a single mysql2 connection.
 * Always call conn.end() after your queries to release it back.
 *
 * @param {object} env  – The Cloudflare Workers `env` object
 * @returns {Promise<import('mysql2/promise').Connection>}
 */
export async function getDb(env) {
  // Production path: Hyperdrive provides a ready-to-use connection string
  if (env.HYPERDRIVE) {
    return createConnection(env.HYPERDRIVE.connectionString);
  }

  // Local dev path: build the connection from individual .dev.vars keys
  return createConnection({
    host:     env.DB_HOST     || 'localhost',
    port:     parseInt(env.DB_PORT || '3305'),
    database: env.DB_NAME     || 'klanvision_db',
    user:     env.DB_USER     || 'root',
    password: env.DB_PASS     || 'system',
    // Cloudflare Workers enforce TLS; keep off for local convenience
    ssl: false,
  });
}
