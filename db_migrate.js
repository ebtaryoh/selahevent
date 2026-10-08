const { Client } = require('pg');

const client = new Client({ 
  connectionString: 'postgresql://postgres.jyjpytommpsmqfofbngd:vd99B5ux8t7SUUrP@aws-0-eu-west-1.pooler.supabase.com:5432/postgres' 
});

async function run() {
  await client.connect();
  try {
    await client.query(`ALTER TABLE events ADD COLUMN attendee_types jsonb DEFAULT '["Delegate", "Student", "Minister / clergy", "Volunteer", "Speaker", "Guest"]'`);
    console.log('Column attendee_types added to events table.');
  } catch (err) {
    console.error('Error adding column:', err.message);
  } finally {
    await client.end();
  }
}

run();
