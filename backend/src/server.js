require('dotenv').config();
const app = require('./app');
const db = require('./config/db');

const PORT = process.env.PORT || 5000;

(async () => {
  try {
    await db.query('SELECT 1'); // fail early if the DB is unreachable
    console.log('Connected to MySQL');
  } catch (err) {
    console.error('Could not connect to MySQL:', err.message);
    process.exit(1);
  }
  app.listen(PORT, () => console.log(`TaskFlow API running on http://localhost:${PORT}`));
})();
