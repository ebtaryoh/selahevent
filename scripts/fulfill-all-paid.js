const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function syncAllPaidOrders() {
  console.log("Checking for unfulfilled paid order items...");

  // Find all order_items whose payment is 'paid' but item status is not 'paid'
  const res = await pool.query(`
    SELECT oi.id, oi.product_id, oi.quantity, oi.status, oi.product_name, oi.customer_name, oi.customer_email, p.id as payment_id, p.status as payment_status
    FROM order_items oi
    JOIN payments p ON oi.payment_id = p.id
    WHERE p.status = 'paid' AND oi.status != 'paid'
  `);

  console.log(`Found ${res.rows.length} pending items linked to paid payments.`);

  for (const row of res.rows) {
    console.log(`Fulfilling item ${row.id} (${row.product_name}, qty: ${row.quantity}) for ${row.customer_name}`);
    
    // Mark order_item as paid
    await pool.query(`UPDATE order_items SET status = 'paid' WHERE id = $1`, [row.id]);

    // Update product stock and sold_count
    if (row.product_id) {
      const prodRes = await pool.query(`
        UPDATE event_products
        SET sold_count = sold_count + $1,
            stock_quantity = CASE WHEN stock_quantity >= 0 THEN GREATEST(0, stock_quantity - $1) ELSE stock_quantity END
        WHERE id = $2
        RETURNING id, name, sold_count, stock_quantity
      `, [row.quantity, row.product_id]);

      console.log(`Updated product:`, prodRes.rows[0]);
    }
  }

  // Print current status of Come Alive T-Shirt
  const pCheck = await pool.query(`
    SELECT id, name, sold_count, stock_quantity 
    FROM event_products 
    WHERE name ILIKE '%COME ALIVE%'
  `);
  console.log("Final Come Alive products state:\n", pCheck.rows);

  await pool.end();
}

syncAllPaidOrders().catch(console.error);
