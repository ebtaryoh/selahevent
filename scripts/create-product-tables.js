require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  console.log("Connected to database...");

  const sql = `
    CREATE TABLE IF NOT EXISTS event_products (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      name text NOT NULL,
      description text NOT NULL DEFAULT '',
      price integer NOT NULL DEFAULT 0,
      currency text NOT NULL DEFAULT 'NGN',
      type text NOT NULL DEFAULT 'physical',
      category text NOT NULL DEFAULT 'Merchandise',
      image_url text,
      stock_quantity integer NOT NULL DEFAULT -1,
      sold_count integer NOT NULL DEFAULT 0,
      download_url text,
      variants jsonb DEFAULT '[]'::jsonb,
      requires_pickup boolean NOT NULL DEFAULT true,
      allow_addon_at_checkout boolean NOT NULL DEFAULT true,
      is_active boolean NOT NULL DEFAULT true,
      sort_order integer NOT NULL DEFAULT 0,
      created_at timestamp with time zone NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      product_id uuid REFERENCES event_products(id) ON DELETE SET NULL,
      registration_id uuid REFERENCES registrations(id) ON DELETE SET NULL,
      payment_id uuid REFERENCES payments(id) ON DELETE SET NULL,
      order_code text NOT NULL,
      customer_name text NOT NULL,
      customer_email text NOT NULL,
      customer_phone text NOT NULL DEFAULT '',
      product_name text NOT NULL,
      product_type text NOT NULL DEFAULT 'physical',
      variant text,
      unit_price integer NOT NULL,
      quantity integer NOT NULL DEFAULT 1,
      total_price integer NOT NULL,
      status text NOT NULL DEFAULT 'pending',
      fulfillment_status text NOT NULL DEFAULT 'unfulfilled',
      pickup_voucher_code text NOT NULL UNIQUE,
      collected_at timestamp with time zone,
      collected_by_staff_name text,
      created_at timestamp with time zone NOT NULL DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS event_products_event_idx ON event_products(event_id);
    CREATE INDEX IF NOT EXISTS order_items_event_idx ON order_items(event_id);
    CREATE INDEX IF NOT EXISTS order_items_registration_idx ON order_items(registration_id);
    CREATE INDEX IF NOT EXISTS order_items_payment_idx ON order_items(payment_id);
    CREATE INDEX IF NOT EXISTS order_items_voucher_idx ON order_items(pickup_voucher_code);
  `;

  await client.query(sql);
  console.log("event_products and order_items tables & indexes verified/created!");

  // Seed sample products for the first 3 events if empty
  const countRes = await client.query('SELECT COUNT(*)::int as count FROM event_products');
  if (countRes.rows[0].count === 0) {
    const eventsRes = await client.query('SELECT id, title, currency FROM events LIMIT 3');
    for (const evt of eventsRes.rows) {
      console.log(`Seeding sample products for event: ${evt.title} (${evt.id})`);
      await client.query(`
        INSERT INTO event_products (
          event_id, name, description, price, currency, type, category, 
          image_url, stock_quantity, sold_count, download_url, variants, 
          requires_pickup, allow_addon_at_checkout, is_active, sort_order
        ) VALUES 
        (
          $1,
          'Official Conference Commemorative T-Shirt',
          'Premium heavyweight cotton tee with embroidered conference logo and scripture motif. Collect at the on-site Resource Desk.',
          12000,
          $2,
          'physical',
          'Apparel',
          'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80',
          150,
          18,
          NULL,
          '["Small", "Medium", "Large", "XL", "2XL"]'::jsonb,
          true,
          true,
          true,
          1
        ),
        (
          $1,
          'Conference Study Guide & Devotional Journal',
          'Hardcover linen-bound workbook with speaker sermon notes, daily reflections, and prayer prompts for the season.',
          6500,
          $2,
          'physical',
          'Books',
          'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80',
          200,
          34,
          NULL,
          '[]'::jsonb,
          true,
          true,
          true,
          2
        ),
        (
          $1,
          'Complete Soaking Audio & Live Worship Album',
          'High-fidelity lossless MP3/WAV download of all ministry soaking sessions, prophetic prayers, and live worship recordings from this event.',
          4500,
          $2,
          'digital',
          'Audio & Media',
          'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80',
          -1,
          52,
          'https://selahevent.org/downloads/soaking-sessions.zip',
          '[]'::jsonb,
          false,
          true,
          true,
          3
        )
      `, [evt.id, evt.currency || 'NGN']);
    }
    console.log("Seeded sample products successfully!");
  }

  await client.end();
  process.exit(0);
}

main().catch(err => {
  console.error("Migration error:", err);
  process.exit(1);
});
