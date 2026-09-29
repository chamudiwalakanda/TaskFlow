
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

(async () => {
  const dbName = process.env.DB_NAME || 'taskflow';
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '2003',
    multipleStatements: true,
  });
  let sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  sql = sql.replace(/taskflow/g, dbName); // honour DB_NAME
  await conn.query(sql);
  console.log(`Database "${dbName}" is ready.`);
  await conn.end();
})().catch((err) => {
  console.error('DB init failed:', err.message);
  process.exit(1);
});
