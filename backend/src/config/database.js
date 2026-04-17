const mysql = require("mysql2/promise");
const { Pool } = require("pg");
require("dotenv").config();

const DB_DIALECT = process.env.DB_DIALECT || "postgres";

let pool;

if (DB_DIALECT === "mysql") {
  pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });
} else if (DB_DIALECT === "postgres") {
  pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
}

// Initialize database tables
async function initializeDatabase() {
  try {
    const query =
      DB_DIALECT === "postgres"
        ? `
      CREATE TABLE IF NOT EXISTS reports (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        location VARCHAR(500) NOT NULL,
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        image_url VARCHAR(500),
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
      `
        : `
      CREATE TABLE IF NOT EXISTS reports (
        id VARCHAR(36) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        location VARCHAR(500) NOT NULL,
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        image_url VARCHAR(500),
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
      `;

    if (DB_DIALECT === "postgres") {
      await pool.query(query);
    } else {
      const connection = await pool.getConnection();
      await connection.query(query);
      connection.release();
    }
    console.log("✓ Database tables initialized");
  } catch (error) {
    console.error("Database initialization error:", error.message);
  }
}

module.exports = {
  pool,
  initializeDatabase,
  DB_DIALECT,
};
