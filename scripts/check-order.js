require("dotenv").config({ path: ".env.local" });
const { Client } = require("pg");

async function run() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  const payment = await client.query(`SELECT * FROM payments WHERE id = '9f6faea3-697c-47fa-ade2-54114b33e875'`);
  console.log("Payment:", JSON.stringify(payment.rows[0], null, 2));

  const items = await client.query(`SELECT * FROM order_items WHERE payment_id = '9f6faea3-697c-47fa-ade2-54114b33e875'`);
  console.log("Items:", JSON.stringify(items.rows, null, 2));

  const prod = await client.query(`SELECT id, name, sold_count, stock_quantity FROM event_products WHERE id = '2d5a8fe2-e686-45bf-8673-c9e7e91d0a7d'`);
  console.log("Product:", JSON.stringify(prod.rows[0], null, 2));

  await client.end();
}
run();
