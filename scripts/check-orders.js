const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function check() {
  const o = await pool.query(`
    SELECT id, order_code, product_id, product_name, quantity, unit_price, status, fulfillment_status, payment_id, customer_email, variant, created_at 
    FROM order_items 
    ORDER BY created_at DESC 
    LIMIT 10
  `);
  console.log('Order Items:\n', JSON.stringify(o.rows, null, 2));

  const p = await pool.query(`
    SELECT id, status, verified, paid_at, gateway_reference, amount, event_id, created_at 
    FROM payments 
    ORDER BY created_at DESC 
    LIMIT 5
  `);
  console.log('Payments:\n', JSON.stringify(p.rows, null, 2));

  const pr = await pool.query(`
    SELECT id, event_id, name, sold_count, stock_quantity 
    FROM event_products 
    WHERE name ILIKE '%COME ALIVE%'
  `);
  console.log('Come Alive products:\n', JSON.stringify(pr.rows, null, 2));

  await pool.end();
}

check().catch(console.error);
