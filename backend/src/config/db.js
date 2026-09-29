const mysql = require('mysql2/promise');
require('dotenv').config();

// A "pool" keeps several connections open and reuses them.
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '2003',
  database: process.env.DB_NAME || 'taskflow',
  waitForConnections: true,
  connectionLimit: 10,
  dateStrings: true, // return DATE columns as 'YYYY-MM-DD' strings
});

module.exports = pool;
