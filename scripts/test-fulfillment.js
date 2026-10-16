require("dotenv").config({ path: ".env.local" });
const { Client } = require("pg");

async function run() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  const paymentId = '9f6faea3-697c-47fa-ade2-54114b33e875';

  const linkedOrderItems = await client.query(
    "SELECT * FROM order_items WHERE payment_id = $1",
    [paymentId]
  );
  console.log("Found linked items:", linkedOrderItems.rows.length);

  for (const item of linkedOrderItems.rows) {
    console.log("Item status:", item.status, "Product ID:", item.product_id);
    if (item.status !== "paid") {
      await client.query("UPDATE order_items SET status = 'paid' WHERE id = $1", [item.id]);
      console.log("Updated order_item to paid");

      if (item.product_id) {
        const updateRes = await client.query(`
          UPDATE event_products
          SET sold_count = sold_count + $1,
              stock_quantity = CASE WHEN stock_quantity >= 0 THEN GREATEST(0, stock_quantity - $1) ELSE stock_quantity END
          WHERE id = $2
          RETURNING id, name, sold_count, stock_quantity
        `, [item.quantity, item.product_id]);
        console.log("Updated product:", updateRes.rows[0]);
      }
    }
  }

  await client.end();
}
run();
