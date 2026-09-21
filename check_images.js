require('dotenv').config();
const { Pool } = require('pg');

const p = new Pool({ connectionString: process.env.DATABASE_URL });

p.query('SELECT id, title, cover_image FROM events ORDER BY created_at DESC LIMIT 5')
  .then(r => {
    console.log(JSON.stringify(r.rows, null, 2));
    p.end();
  })
  .catch(e => {
    console.error(e.message);
    p.end();
  });
