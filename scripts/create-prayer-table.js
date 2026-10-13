require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  console.log("Connected to database...");

  const sql = `
    CREATE TABLE IF NOT EXISTS prayer_requests (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      author_name text NOT NULL DEFAULT 'Anonymous Believer',
      author_city text DEFAULT 'Lagos',
      title text NOT NULL,
      content text NOT NULL,
      category text NOT NULL DEFAULT 'general',
      prayer_count integer NOT NULL DEFAULT 1,
      is_testimony boolean NOT NULL DEFAULT false,
      testimony_update text,
      is_approved boolean NOT NULL DEFAULT true,
      created_at timestamp with time zone NOT NULL DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS prayer_requests_created_idx ON prayer_requests(created_at DESC);
    CREATE INDEX IF NOT EXISTS prayer_requests_cat_idx ON prayer_requests(category);
  `;

  await client.query(sql);
  console.log("prayer_requests table and indexes created successfully!");

  // Insert 4 rich seed prayers / praise reports so the wall is inspiring right away
  const countRes = await client.query('SELECT COUNT(*)::int as count FROM prayer_requests');
  if (countRes.rows[0].count === 0) {
    await client.query(`
      INSERT INTO prayer_requests (author_name, author_city, title, content, category, prayer_count, is_testimony, testimony_update)
      VALUES 
      (
        'Sister Grace',
        'Abuja',
        'Praise Report: Total Recovery after 3 Weeks in ICU',
        'My mother was discharged yesterday completely healed! The doctors said it was nothing short of a miracle. Thank you to everyone who held hands with us in prayer during the convention.',
        'healing',
        42,
        true,
        'God turned what was meant for sorrow into overwhelming praise! Glory to Jesus.'
      ),
      (
        'Brother Emmanuel',
        'Lagos',
        'Intercession for Final Year Campus Exams & Project',
        'Praying for divine clarity, favor before the defense panel, and wisdom beyond my natural ability as I conclude my university degree this month.',
        'career',
        18,
        false,
        null
      ),
      (
        'Anonymous',
        'Port Harcourt',
        'Restoration of Peace in My Family & Marriage',
        'Believing God for emotional healing and genuine forgiveness in my home. Let the peace of God which surpasses human understanding reign over us.',
        'family',
        27,
        false,
        null
      ),
      (
        'Pastor David',
        'Ibadan',
        'Youth Revival & Souls for the Lord at Camp Meeting',
        'Praying for an undeniable outpouring of the Holy Spirit at our upcoming youth conference. May every hardened heart melt and find the love of Christ.',
        'ministry',
        35,
        false,
        null
      );
    `);
    console.log("Seeded initial prayer requests and praise reports!");
  }

  await client.end();
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
