require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

async function seed() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  console.log("Connected to database...");

  const eventsRes = await client.query("SELECT id, slug, title, currency FROM events");
  const events = eventsRes.rows;

  const christianCatalog = [
    {
      name: "Conference Commemorative T-Shirt (2026/2027 Edition)",
      description: "Heavyweight 240gsm combed cotton with puff-printed conference scripture emblem. Breathable, durable, and pre-shrunk.",
      price: 12000,
      currency: "NGN",
      type: "physical",
      category: "Apparel",
      imageUrl: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80",
      stockQuantity: 500,
      variants: [
        "Midnight Black / S", "Midnight Black / M", "Midnight Black / L", "Midnight Black / XL", "Midnight Black / 2XL",
        "Cypress Green / S", "Cypress Green / M", "Cypress Green / L", "Cypress Green / XL",
        "Desert Sand / S", "Desert Sand / M", "Desert Sand / L", "Desert Sand / XL",
        "Off-White / S", "Off-White / M", "Off-White / L", "Off-White / XL"
      ],
      requiresPickup: true,
      allowAddonAtCheckout: true,
      isActive: true,
    },
    {
      name: "Selah 'Be Still & Know' Fleece Hoodie",
      description: "Luxury fleece hoodie with embroidered Selah typography across the chest and Psalm 46:10 along the sleeve. Double-lined hood and brass eyelets.",
      price: 24000,
      currency: "NGN",
      type: "physical",
      category: "Apparel",
      imageUrl: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80",
      stockQuantity: 250,
      variants: [
        "Midnight Black / M", "Midnight Black / L", "Midnight Black / XL", "Midnight Black / 2XL",
        "Cypress Green / M", "Cypress Green / L", "Cypress Green / XL",
        "Desert Sand / M", "Desert Sand / L", "Desert Sand / XL"
      ],
      requiresPickup: true,
      allowAddonAtCheckout: true,
      isActive: true,
    },
    {
      name: "Deluxe Leather Spiritual Warfare & Fasting Journal",
      description: "Full-grain bonded leather journal with gold foil embossed cover, gilded page edges, double silk ribbon markers, and 40-day daily scripture prayer prompts.",
      price: 8500,
      currency: "NGN",
      type: "physical",
      category: "Devotional",
      imageUrl: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80",
      stockQuantity: 300,
      variants: ["Mahogany Brown", "Midnight Black", "Emerald Olive"],
      requiresPickup: true,
      allowAddonAtCheckout: true,
      isActive: true,
    },
    {
      name: "Consecrated Anointing Oil of Frankincense & Myrrh",
      description: "Cold-pressed extra virgin olive oil from Galilee infused with frankincense, myrrh, and spikenard. Blessed and bottled in a protective amber glass vial with velvet carrying pouch.",
      price: 4500,
      currency: "NGN",
      type: "physical",
      category: "Sacraments",
      imageUrl: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=800&auto=format&fit=crop&q=80",
      stockQuantity: 400,
      variants: ["15ml Roll-on Vial", "50ml Dropper Bottle"],
      requiresPickup: true,
      allowAddonAtCheckout: true,
      isActive: true,
    },
    {
      name: "Messianic Prayer Shawl (Tallit) & Velvet Case",
      description: "Authentic woven acrylic and wool tallit with kosher Tzitzit fringes, Hebrew blessing embroidered across the Atarah, and matching zippered velvet case.",
      price: 28000,
      currency: "NGN",
      type: "physical",
      category: "Sacraments",
      imageUrl: "https://images.unsplash.com/photo-1543857778-c4a1a3e0b2eb?w=800&auto=format&fit=crop&q=80",
      stockQuantity: 120,
      variants: ["Royal Blue & Gold", "Purple & Silver", "Black & Gold"],
      requiresPickup: true,
      allowAddonAtCheckout: true,
      isActive: true,
    },
    {
      name: "Handcrafted Bethlehem Olive Wood Pocket Cross",
      description: "Hand-carved by Christian artisans in Bethlehem from pruned olive tree branches. Ergonomically shaped to fit comfortably in the palm during prayer.",
      price: 3500,
      currency: "NGN",
      type: "physical",
      category: "Sacraments",
      imageUrl: "https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&auto=format&fit=crop&q=80",
      stockQuantity: 500,
      variants: ["Smooth Comfort Cross", "Cross with Scripture Card"],
      requiresPickup: true,
      allowAddonAtCheckout: true,
      isActive: true,
    },
    {
      name: "Heavy Canvas Scripture Tote & Bible Carrier",
      description: "16oz reinforced heavy organic cotton canvas with zip top closure, interior padded Bible divider, two pen loops, and embroidered scripture verse.",
      price: 7500,
      currency: "NGN",
      type: "physical",
      category: "Accessories",
      imageUrl: "https://images.unsplash.com/photo-1597484662317-9bd7bdda2907?w=800&auto=format&fit=crop&q=80",
      stockQuantity: 350,
      variants: ["Natural Canvas", "Midnight Black"],
      requiresPickup: true,
      allowAddonAtCheckout: true,
      isActive: true,
    },
    {
      name: "Complete Soaking Audio & Live Prophetic Worship Album",
      description: "Instant high-definition download (MP3 320kbps + Lossless WAV) containing 12 live conference worship sessions, soaking prayer instrumentals, and minister declarations.",
      price: 4500,
      currency: "NGN",
      type: "digital",
      category: "Audio & Media",
      imageUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80",
      stockQuantity: -1, // Unlimited
      downloadUrl: "https://selah-assets.storage.googleapis.com/audio/soaking-worship-album.zip",
      variants: [],
      requiresPickup: false,
      allowAddonAtCheckout: true,
      isActive: true,
    },
    {
      name: "Keynote Speaker Masterclasses & Syllabi PDF Bundle",
      description: "Instant all-access digital bundle: Full 1080p HD video sessions of all morning and evening keynotes, plus the comprehensive 85-page speaker study syllabus.",
      price: 15000,
      currency: "NGN",
      type: "digital",
      category: "Resources",
      imageUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80",
      stockQuantity: -1, // Unlimited
      downloadUrl: "https://selah-assets.storage.googleapis.com/resources/masterclasses-syllabi.pdf",
      variants: [],
      requiresPickup: false,
      allowAddonAtCheckout: true,
      isActive: true,
    },
    {
      name: "Selah Silicone Scripture Wristband Trio Pack",
      description: "Set of three debossed silicone wristbands with scripture reminders: 'Grace Upon Grace' (Olive), 'Rooted & Grounded' (Sand), 'Selah' (Black).",
      price: 2500,
      currency: "NGN",
      type: "physical",
      category: "Accessories",
      imageUrl: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&auto=format&fit=crop&q=80",
      stockQuantity: 600,
      variants: ["Adult Trio Pack", "Youth/Teen Trio Pack"],
      requiresPickup: true,
      allowAddonAtCheckout: true,
      isActive: true,
    }
  ];

  for (const event of events) {
    console.log(`Processing event: ${event.title} (${event.slug})...`);

    // Check existing products count
    const existing = await client.query(
      "SELECT count(*) FROM event_products WHERE event_id = $1",
      [event.id]
    );

    const count = parseInt(existing.rows[0].count, 10);
    // If it has fewer than 5 products, add the full catalog
    if (count < 5) {
      console.log(`Adding ${christianCatalog.length} products to event ${event.slug}...`);
      for (const item of christianCatalog) {
        // Adjust price if currency is GBP or USD
        let price = item.price;
        if (event.currency === "GBP") {
          price = Math.round(item.price / 1600) || 5;
        } else if (event.currency === "USD") {
          price = Math.round(item.price / 1500) || 6;
        }

        await client.query(
          `INSERT INTO event_products (
            event_id, name, description, price, currency, type, category,
            image_url, stock_quantity, sold_count, download_url, variants,
            requires_pickup, allow_addon_at_checkout, is_active
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
          [
            event.id,
            item.name,
            item.description,
            price,
            event.currency || "NGN",
            item.type,
            item.category,
            item.imageUrl,
            item.stockQuantity,
            0,
            item.downloadUrl || null,
            JSON.stringify(item.variants),
            item.requiresPickup,
            item.allowAddonAtCheckout,
            item.isActive
          ]
        );
      }
      console.log(`Successfully seeded ${event.slug}!`);
    } else {
      console.log(`Event ${event.slug} already has ${count} products.`);
    }
  }

  await client.end();
  console.log("Seeding complete!");
}

seed().catch(err => {
  console.error("Seed error:", err);
  process.exit(1);
});
