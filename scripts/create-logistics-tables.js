require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  console.log("Connected to database...");

  const sql = `
    -- 1. Pastoral Broadcasts & Flash Announcements
    CREATE TABLE IF NOT EXISTS event_announcements (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      title text NOT NULL,
      message text NOT NULL,
      type text NOT NULL DEFAULT 'announcement', -- 'urgent', 'announcement', 'meal', 'shuttle', 'spiritual'
      is_pinned boolean NOT NULL DEFAULT true,
      is_active boolean NOT NULL DEFAULT true,
      author_name text NOT NULL DEFAULT 'Pastoral Secretariat',
      action_url text,
      action_label text,
      created_at timestamp with time zone NOT NULL DEFAULT now()
    );

    -- 2. Camp Accommodations & Hostels
    CREATE TABLE IF NOT EXISTS event_accommodations (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      name text NOT NULL,
      category text NOT NULL DEFAULT 'general', -- 'male', 'female', 'couples', 'ministers', 'general'
      location text NOT NULL DEFAULT '',
      total_beds integer NOT NULL DEFAULT 50,
      allocated_beds integer NOT NULL DEFAULT 0,
      check_in_instructions text NOT NULL DEFAULT 'Present your digital camp pass at the Accommodation Secretariat.',
      is_active boolean NOT NULL DEFAULT true,
      created_at timestamp with time zone NOT NULL DEFAULT now()
    );

    -- 3. Attendee Room & Bed Space Allocations
    CREATE TABLE IF NOT EXISTS attendee_accommodations (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      accommodation_id uuid NOT NULL REFERENCES event_accommodations(id) ON DELETE CASCADE,
      attendee_email text NOT NULL,
      attendee_name text NOT NULL,
      room_number text NOT NULL,
      pass_code text NOT NULL UNIQUE,
      checked_in boolean NOT NULL DEFAULT false,
      checked_in_at timestamp with time zone,
      created_at timestamp with time zone NOT NULL DEFAULT now()
    );

    -- 4. Event Bus Shuttles & Pickup Points
    CREATE TABLE IF NOT EXISTS event_shuttles (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      route_title text NOT NULL,
      pickup_location text NOT NULL,
      departure_time text NOT NULL,
      return_time text NOT NULL DEFAULT '',
      bus_captain_name text NOT NULL DEFAULT 'Transport Coordinator',
      bus_captain_phone text NOT NULL DEFAULT '',
      total_seats integer NOT NULL DEFAULT 50,
      booked_seats integer NOT NULL DEFAULT 0,
      fare integer NOT NULL DEFAULT 0, -- 0 for Free Church Shuttles
      instructions text NOT NULL DEFAULT 'Please arrive 15 minutes before departure.',
      is_active boolean NOT NULL DEFAULT true,
      created_at timestamp with time zone NOT NULL DEFAULT now()
    );

    -- 5. Shuttle Seat Bookings
    CREATE TABLE IF NOT EXISTS attendee_shuttle_bookings (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      shuttle_id uuid NOT NULL REFERENCES event_shuttles(id) ON DELETE CASCADE,
      attendee_name text NOT NULL,
      attendee_email text NOT NULL,
      attendee_phone text NOT NULL DEFAULT '',
      seat_count integer NOT NULL DEFAULT 1,
      booking_code text NOT NULL UNIQUE,
      boarding_status text NOT NULL DEFAULT 'confirmed', -- 'confirmed', 'boarded'
      boarded_at timestamp with time zone,
      created_at timestamp with time zone NOT NULL DEFAULT now()
    );

    -- 6. Dining Hall Meal Passes
    CREATE TABLE IF NOT EXISTS event_meal_passes (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      attendee_email text NOT NULL,
      attendee_name text NOT NULL,
      meal_type text NOT NULL, -- 'breakfast', 'lunch', 'dinner'
      meal_day text NOT NULL DEFAULT 'Day 1',
      voucher_code text NOT NULL UNIQUE,
      is_claimed boolean NOT NULL DEFAULT false,
      claimed_at timestamp with time zone,
      claimed_by_staff text,
      created_at timestamp with time zone NOT NULL DEFAULT now()
    );

    -- Create Indexes
    CREATE INDEX IF NOT EXISTS event_announcements_event_idx ON event_announcements(event_id);
    CREATE INDEX IF NOT EXISTS event_accommodations_event_idx ON event_accommodations(event_id);
    CREATE INDEX IF NOT EXISTS attendee_accommodations_event_idx ON attendee_accommodations(event_id);
    CREATE INDEX IF NOT EXISTS attendee_accommodations_email_idx ON attendee_accommodations(attendee_email);
    CREATE INDEX IF NOT EXISTS attendee_accommodations_pass_idx ON attendee_accommodations(pass_code);
    CREATE INDEX IF NOT EXISTS event_shuttles_event_idx ON event_shuttles(event_id);
    CREATE INDEX IF NOT EXISTS attendee_shuttle_bookings_event_idx ON attendee_shuttle_bookings(event_id);
    CREATE INDEX IF NOT EXISTS attendee_shuttle_bookings_email_idx ON attendee_shuttle_bookings(attendee_email);
    CREATE INDEX IF NOT EXISTS event_meal_passes_event_idx ON event_meal_passes(event_id);
    CREATE INDEX IF NOT EXISTS event_meal_passes_email_idx ON event_meal_passes(attendee_email);
    CREATE INDEX IF NOT EXISTS event_meal_passes_voucher_idx ON event_meal_passes(voucher_code);
  `;

  await client.query(sql);
  console.log("All logistics and broadcast tables created successfully!");

  // Seed sample announcements and logistics for Come Alive Youth Programme if empty
  const comeAlive = await client.query("SELECT id, title FROM events WHERE title ILIKE '%Come Alive%' LIMIT 1");
  if (comeAlive.rows.length > 0) {
    const eventId = comeAlive.rows[0].id;
    console.log(`Seeding logistics and broadcasts for ${comeAlive.rows[0].title} (${eventId})...`);

    // Announcements
    const annCount = await client.query('SELECT count(*)::int as count FROM event_announcements WHERE event_id = $1', [eventId]);
    if (annCount.rows[0].count === 0) {
      await client.query(`
        INSERT INTO event_announcements (event_id, title, message, type, is_pinned, is_active, author_name)
        VALUES 
        (
          $1,
          '🚨 General Assembly Schedule Notice',
          'Due to the prophetic impartation service, the General Youth Revival session will begin promptly at 5:30 PM in the Main Auditorium. Please be seated early.',
          'urgent',
          true,
          true,
          'Youth Pastorate & Protocol'
        ),
        (
          $1,
          '🍽️ Fellowship Dinner is Now Served',
          'Dining Hall A & B are officially open for evening dinner until 8:45 PM. Please show your digital meal voucher at the entry turnstile.',
          'meal',
          false,
          true,
          'Hospitality & Welfare Desk'
        ),
        (
          $1,
          '🚌 Late-Night Bus Shuttles Boarding Time',
          'Free convention shuttles returning to Berger, Ojota, and Abeokuta will begin boarding immediately following the closing benediction at Parking Gate 2.',
          'shuttle',
          false,
          true,
          'Transport Coordination Unit'
        )
      `, [eventId]);
      console.log("Seeded sample announcements!");
    }

    // Accommodations
    const accCount = await client.query('SELECT count(*)::int as count FROM event_accommodations WHERE event_id = $1', [eventId]);
    if (accCount.rows[0].count === 0) {
      const dormRes = await client.query(`
        INSERT INTO event_accommodations (event_id, name, category, location, total_beds, allocated_beds, check_in_instructions)
        VALUES 
        ($1, 'Esther Hall (Female Youths)', 'female', 'Zone 3, Near Chapel of Grace', 200, 48, 'Collect your room key tag at the Esther Hall Porter Desk with your Camp Pass QR code.'),
        ($1, 'Daniel Hall (Male Youths)', 'male', 'Zone 4, Adjacent Sports Complex', 250, 62, 'Report to Daniel Hall Ground Floor Secretariat for bed allocation tag.'),
        ($1, 'Pastoral & Workers Chalet', 'ministers', 'Zone 1, Executive Lodges', 60, 24, 'Direct key collection at the Ministerial Hospitality Desk.')
        RETURNING id, name
      `, [eventId]);
      console.log("Seeded sample accommodations!");

      // Sample attendee allocation for learnyorubaeasily@gmail.com
      const danDorm = dormRes.rows.find(d => d.name.includes('Daniel'));
      if (danDorm) {
        await client.query(`
          INSERT INTO attendee_accommodations (event_id, accommodation_id, attendee_email, attendee_name, room_number, pass_code, checked_in)
          VALUES ($1, $2, 'learnyorubaeasily@gmail.com', 'Learn Yoruba Easily', 'Room B-12, Bed 03', 'CAMP-DAN-B12', false)
          ON CONFLICT (pass_code) DO NOTHING
        `, [eventId, danDorm.id]);
      }
    }

    // Shuttles
    const shutCount = await client.query('SELECT count(*)::int as count FROM event_shuttles WHERE event_id = $1', [eventId]);
    if (shutCount.rows[0].count === 0) {
      const sRes = await client.query(`
        INSERT INTO event_shuttles (event_id, route_title, pickup_location, departure_time, return_time, bus_captain_name, bus_captain_phone, total_seats, booked_seats, fare, instructions)
        VALUES 
        (
          $1,
          'Berger Bus Stop ⇄ Camp Auditorium',
          'Under the Pedestrian Bridge, Berger Bus Stop, Lagos',
          'Day 1: 1:00 PM & 4:00 PM',
          'Sunday Post-Vigil: 6:00 AM',
          'Bro. Samuel Adeleke',
          '+234 803 234 5678',
          60,
          28,
          0,
          'Look for the white Coaster bus with the Selah / Come Alive banner in front.'
        ),
        (
          $1,
          'Ojota / Maryland ⇄ Camp Auditorium',
          'BRT Bus Terminal, Ojota Under-Bridge',
          'Day 1: 1:30 PM & 4:30 PM',
          'Sunday Post-Vigil: 6:00 AM',
          'Sis. Deborah Okon',
          '+234 814 876 5432',
          60,
          35,
          0,
          'Boarding is on a first-come, first-served basis with your digital reservation.'
        ),
        (
          $1,
          'Abeokuta City Gate ⇄ Camp Auditorium',
          'Abeokuta Central Park (Kuto Motor Park)',
          'Day 1: 2:00 PM Prompt',
          'Sunday Post-Vigil: 6:30 AM',
          'Bro. Femi Balogun',
          '+234 802 998 8776',
          50,
          19,
          0,
          'Free regional shuttle for Ogun State youth delegates.'
        )
        RETURNING id, route_title
      `, [eventId]);
      console.log("Seeded sample bus shuttles!");

      // Sample booking for learnyorubaeasily@gmail.com
      if (sRes.rows.length > 0) {
        await client.query(`
          INSERT INTO attendee_shuttle_bookings (event_id, shuttle_id, attendee_name, attendee_email, attendee_phone, seat_count, booking_code, boarding_status)
          VALUES ($1, $2, 'Learn Yoruba Easily', 'learnyorubaeasily@gmail.com', '+234 801 234 5678', 1, 'BUS-BER-0482', 'confirmed')
          ON CONFLICT (booking_code) DO NOTHING
        `, [eventId, sRes.rows[0].id]);
      }
    }

    // Meal Passes for learnyorubaeasily@gmail.com
    const mealCount = await client.query('SELECT count(*)::int as count FROM event_meal_passes WHERE event_id = $1', [eventId]);
    if (mealCount.rows[0].count === 0) {
      await client.query(`
        INSERT INTO event_meal_passes (event_id, attendee_email, attendee_name, meal_type, meal_day, voucher_code, is_claimed)
        VALUES 
        ($1, 'learnyorubaeasily@gmail.com', 'Learn Yoruba Easily', 'breakfast', 'Day 1 - Friday', 'MEAL-BRK-9901', true),
        ($1, 'learnyorubaeasily@gmail.com', 'Learn Yoruba Easily', 'lunch', 'Day 1 - Friday', 'MEAL-LUN-9902', false),
        ($1, 'learnyorubaeasily@gmail.com', 'Learn Yoruba Easily', 'dinner', 'Day 1 - Friday', 'MEAL-DIN-9903', false)
        ON CONFLICT (voucher_code) DO NOTHING
      `, [eventId]);
      console.log("Seeded sample meal passes!");
    }
  }

  await client.end();
  console.log("Logistics migration completed successfully!");
}

main().catch(console.error);
