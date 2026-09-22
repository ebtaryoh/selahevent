import { db } from "@/db";
import {
  auditLogs,
  blueprints,
  certificates,
  checkIns,
  events,
  organizations,
  payments,
  registrations,
  sessions,
  speakers,
  tasks,
  ticketTypes,
  volunteers,
} from "@/db/schema";

/**
 * Idempotent demo dataset for the "Grace Fellowship" tenant.
 * All names, organisations and figures are clearly fictional.
 */

const orgId = "55555555-5555-4555-8555-555555555555"; // Reassigned to MFM
const mfmOrgId = orgId;
const tcnOrgId = "66666666-6666-4666-8666-666666666666";
const hcOrgId = "77777777-7777-4777-8777-777777777777";

const summitId = "22222222-2222-4222-8222-222222222222";
const retreatId = "33333333-3333-4333-8333-333333333333";
const worshipId = "44444444-4444-4444-8444-444444444444";
const wofbecId = "88888888-8888-4888-8888-888888888888";
const soarId = "99999999-9999-4999-8999-999999999999";
const hcEventId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

let seedPromise: Promise<void> | null = null;

export function ensureSeed(): Promise<void> {
  return Promise.resolve();
}

async function runSeed() {
  try {
    const existing = await db
      .select({ id: events.id })
      .from(events)
      .limit(1);
    if (existing.length > 0) return;

    // Partial seeds are healed by clearing the demo tenant (cascades to all
    // child rows) and re-inserting the full dataset.
    await db.delete(organizations);
  } catch (err) {
    console.error("[selah] seed check failed:", err);
    return;
  }

  try {
    await db.insert(organizations).values([
      {
        id: mfmOrgId,
        name: "Mountain of Fire and Miracles Ministries",
        slug: "mfm",
        orgType: "church",
        country: "NG",
        currency: "NGN",
        timezone: "Africa/Lagos",
        plan: "enterprise",
        eventCadence: "weekly",
      },
      {
        id: tcnOrgId,
        name: "The Covenant Nation",
        slug: "the-covenant-nation",
        orgType: "church",
        country: "NG",
        currency: "NGN",
        timezone: "Africa/Lagos",
        plan: "enterprise",
        eventCadence: "monthly",
      },
      {
        id: hcOrgId,
        name: "Nathaniel Bassey Ministries",
        slug: "nathaniel-bassey",
        orgType: "ministry",
        country: "NG",
        currency: "NGN",
        timezone: "Africa/Lagos",
        plan: "growth",
        eventCadence: "yearly",
      }
    ]);

    await db.insert(events).values([
      {
        id: summitId,
        organizationId: orgId,
        slug: "kingdom-leadership-summit-2027",
        title: "Kingdom Leadership Summit 2027",
        theme: "Faithful Stewardship in a Changing City",
        tagline:
          "Four days of teaching, worship and practical workshops for leaders serving in business, ministry and public life.",
        description:
          "Now in its seventh year, the Kingdom Leadership Summit gathers pastors, ministry workers, entrepreneurs and young professionals for four days of teaching, worship and practical workshops. Delegates choose from three parallel tracks, join moderated roundtables, and leave with an operating plan for the year ahead.",
        eventType: "conference",
        status: "published",
        visibility: "public",
        startsAt: new Date("2027-03-18T08:00:00Z"),
        endsAt: new Date("2027-03-21T17:00:00Z"),
        timezone: "Africa/Lagos",
        venueName: "The Covenant Centre",
        venueAddress: "14 Kingsway Road, Ikoyi",
        city: "Lagos",
        country: "NG",
        capacity: 1500,
        coverImage: "/images/event-stage.jpg",
        currency: "NGN",
        registrationOpensAt: new Date("2026-10-01T00:00:00Z"),
        registrationClosesAt: new Date("2027-03-15T23:59:00Z"),
        readiness: 92,
        commsPlan: [
          {
            id: "comms-1",
            title: "Registration confirmation",
            audience: "All Attendees",
            status: "sent",
          },
          {
            id: "comms-2",
            title: "Preparation reminder",
            audience: "All Attendees",
            status: "scheduled",
          },
          {
            id: "comms-3",
            title: "Travel & accommodation details",
            audience: "Out of town delegates",
            status: "scheduled",
          },
          {
            id: "comms-4",
            title: "Tomorrow notification",
            audience: "All Attendees",
            status: "draft",
          },
          {
            id: "comms-5",
            title: "Thank you & feedback",
            audience: "All Attendees",
            status: "draft",
          },
        ],
      },
      {
        id: retreatId,
        organizationId: orgId,
        slug: "annual-youth-retreat-2027",
        title: "Annual Youth Retreat 2027",
        theme: "Rooted",
        tagline:
          "Three days away from the noise — worship, teaching, sport and rest for ages 16 to 26.",
        description:
          "The annual youth retreat returns to Green Pastures with a new teaching series, afternoon sport, an open-mic worship night and dedicated sessions for first-time attendees. Transport and accommodation are available for every registered delegate.",
        eventType: "retreat",
        status: "published",
        visibility: "public",
        startsAt: new Date("2027-08-05T14:00:00Z"),
        endsAt: new Date("2027-08-08T12:00:00Z"),
        timezone: "Africa/Lagos",
        venueName: "Green Pastures Retreat Centre",
        venueAddress: "Km 22 Lekki-Epe Expressway",
        city: "Lekki",
        country: "NG",
        capacity: 420,
        coverImage: "/images/retreat-landscape.jpg",
        currency: "NGN",
        registrationOpensAt: new Date("2027-03-01T00:00:00Z"),
        registrationClosesAt: new Date("2027-07-25T23:59:00Z"),
        readiness: 64,
        commsPlan: [
          {
            id: "comms-6",
            title: "Registration confirmation",
            audience: "All Attendees",
            status: "scheduled",
          },
          {
            id: "comms-7",
            title: "Packing list & travel",
            audience: "All Attendees",
            status: "draft",
          },
          {
            id: "comms-8",
            title: "Departure reminder",
            audience: "All Attendees",
            status: "draft",
          },
        ],
      },
      {
        id: worshipId,
        organizationId: orgId,
        slug: "night-of-worship-lagos",
        title: "Night of Worship — Lagos",
        theme: "Still",
        tagline: "An unhurried evening of song and prayer in the heart of the city.",
        description:
          "A free, open evening of worship hosted at the main auditorium. Doors open at 5pm.",
        eventType: "worship",
        status: "draft",
        visibility: "unlisted",
        startsAt: new Date("2027-05-14T17:00:00Z"),
        endsAt: new Date("2027-05-14T21:30:00Z"),
        timezone: "Africa/Lagos",
        venueName: "Main Auditorium",
        venueAddress: "Grace Fellowship HQ",
        city: "Lagos",
        country: "NG",
        capacity: 2000,
        coverImage: "/images/hero-auditorium.jpg",
        currency: "NGN",
        readiness: 38,
      },
      {
        id: wofbecId,
        organizationId: tcnOrgId,
        slug: "wofbec-2027",
        title: "WOFBEC 2027",
        theme: "The Believer's Authority",
        tagline: "The Word of Faith Bible Institute Conference",
        description: "Join us for 7 days of intensive teaching of the Word of God by seasoned ministers. Come ready to learn, unlearn and relearn.",
        eventType: "conference",
        status: "published",
        visibility: "public",
        startsAt: new Date("2027-01-02T08:00:00Z"),
        endsAt: new Date("2027-01-09T20:00:00Z"),
        timezone: "Africa/Lagos",
        venueName: "The Covenant Place",
        venueAddress: "Iganmu",
        city: "Lagos",
        country: "NG",
        capacity: 10000,
        coverImage: "/images/event-stage.jpg",
        currency: "NGN",
        registrationOpensAt: new Date("2026-11-01T00:00:00Z"),
        registrationClosesAt: new Date("2027-01-01T23:59:00Z"),
        readiness: 100,
      },
      {
        id: soarId,
        organizationId: mfmOrgId,
        slug: "mfm-soar-conference-2026",
        title: "MFM SOAR CONFERENCE 2026",
        theme: "Mounting up with Wings as Eagles",
        tagline: "An empowerment gathering for the youth to soar above limitations.",
        description: "The MFM Youth SOAR Conference is an annual gathering of youths from across the globe for a time of intense prayers, word explosion, and impartation.",
        eventType: "conference",
        status: "published",
        visibility: "public",
        startsAt: new Date("2026-04-10T09:00:00Z"),
        endsAt: new Date("2026-04-12T18:00:00Z"),
        timezone: "Africa/Lagos",
        venueName: "Prayer City",
        venueAddress: "Lagos-Ibadan Expressway",
        city: "Ogun",
        country: "NG",
        capacity: 20000,
        coverImage: "/images/retreat-landscape.jpg",
        currency: "NGN",
        registrationOpensAt: new Date("2026-01-01T00:00:00Z"),
        registrationClosesAt: new Date("2026-04-09T23:59:00Z"),
        readiness: 85,
      },
      {
        id: hcEventId,
        organizationId: hcOrgId,
        slug: "hallelujah-challenge-festival",
        title: "Hallelujah Challenge Festival",
        theme: "Sound of Jubilee",
        tagline: "30 days of midnight praise culminates in a massive gathering of worshippers.",
        description: "The Hallelujah Challenge Festival brings the online midnight praise offline for a grand finale of worship, praise, and prophetic declarations.",
        eventType: "worship",
        status: "published",
        visibility: "public",
        startsAt: new Date("2027-02-28T18:00:00Z"),
        endsAt: new Date("2027-02-28T23:59:00Z"),
        timezone: "Africa/Lagos",
        venueName: "Eko Hotel & Suites",
        venueAddress: "Victoria Island",
        city: "Lagos",
        country: "NG",
        capacity: 5000,
        coverImage: "/images/hero-auditorium.jpg",
        currency: "NGN",
        registrationOpensAt: new Date("2026-12-01T00:00:00Z"),
        registrationClosesAt: new Date("2027-02-27T23:59:00Z"),
        readiness: 90,
      }
    ]);

    const summitTickets = [
      {
        eventId: summitId,
        name: "General Admission",
        description:
          "Full four-day access to all main sessions, worship and the exhibition hall.",
        price: 25000,
        capacity: 900,
        sold: 612,
        badge: "Most popular",
        benefits: ["All main sessions", "Printed programme", "Lunch on days 2–4"],
        sortOrder: 1,
      },
      {
        eventId: summitId,
        name: "Premium Delegate",
        description:
          "Reserved seating, roundtable access and the delegates' dinner with speakers.",
        price: 60000,
        capacity: 300,
        sold: 188,
        badge: "Includes dinner",
        benefits: [
          "Reserved front seating",
          "Moderated roundtables",
          "Delegates' dinner",
          "Resource USB",
        ],
        sortOrder: 2,
      },
      {
        eventId: summitId,
        name: "Student & Youth",
        description:
          "Discounted full access for students and delegates under 25. Valid ID required.",
        price: 12000,
        capacity: 250,
        sold: 176,
        badge: "Under 25",
        benefits: ["All main sessions", "Youth lounge access"],
        sortOrder: 3,
      },
      {
        eventId: summitId,
        name: "Single Day Pass",
        description: "Access for one day of your choice. Non-transferable.",
        price: 15000,
        capacity: 200,
        sold: 64,
        benefits: ["One day of sessions", "Lunch on chosen day"],
        sortOrder: 4,
      },
    ];

    const retreatTickets = [
      {
        eventId: retreatId,
        name: "Residential Delegate",
        description:
          "Three nights accommodation, all meals and full programme access.",
        price: 45000,
        capacity: 300,
        sold: 218,
        badge: "Includes lodging",
        benefits: ["Shared room (4)", "All meals", "Full programme"],
        sortOrder: 1,
      },
      {
        eventId: retreatId,
        name: "Day Delegate",
        description: "Programme access without overnight accommodation.",
        price: 20000,
        capacity: 120,
        sold: 71,
        benefits: ["Full programme", "Lunch each day"],
        sortOrder: 2,
      },
    ];

    await db.insert(ticketTypes).values([
      ...summitTickets,
      ...retreatTickets,
      {
        eventId: worshipId,
        name: "Free Entry",
        description: "Registration required for capacity planning.",
        price: 0,
        capacity: 2000,
        sold: 0,
        benefits: ["General admission"],
        sortOrder: 1,
      },
      {
        eventId: wofbecId,
        name: "General Admission",
        description: "Free registration for all attendees.",
        price: 0,
        capacity: 10000,
        sold: 8400,
        benefits: ["All sessions"],
        sortOrder: 1,
      },
      {
        eventId: wofbecId,
        name: "Ministers VIP",
        description: "Reserved seating for ordained ministers.",
        price: 0,
        capacity: 500,
        sold: 500,
        benefits: ["Reserved seating", "Minister's lounge"],
        sortOrder: 2,
      },
      {
        eventId: hcEventId,
        name: "Worshipper Pass",
        description: "Free registration to attend the festival.",
        price: 0,
        capacity: 5000,
        sold: 4890,
        benefits: ["General admission"],
        sortOrder: 1,
      },
      {
        eventId: soarId,
        name: "Youth Delegate",
        description: "Registration for the SOAR conference.",
        price: 5000,
        capacity: 20000,
        sold: 12500,
        benefits: ["Conference materials", "Lunch"],
        sortOrder: 1,
      }
    ]);

    await db.insert(speakers).values([
      {
        organizationId: orgId,
        eventId: summitId,
        name: "Dr. Adaeze Nwosu",
        role: "Convener",
        organization: "Grace Fellowship",
        topic: "Stewardship When the Map Changes",
        bio: "Dr. Nwosu has led Grace Fellowship for eighteen years and teaches organisational leadership across West Africa.",
        accentHue: "#c08a2e",
      },
      {
        organizationId: orgId,
        eventId: summitId,
        name: "Pastor Samuel Adeyemi",
        role: "Keynote Speaker",
        organization: "Citywide Mission Network",
        topic: "Building Institutions That Outlive Their Founders",
        bio: "Samuel Adeyemi founded a network of 40 city congregations and consults on leadership development.",
        accentHue: "#2c4a40",
      },
      {
        organizationId: orgId,
        eventId: summitId,
        name: "Dr. Hannah Osei",
        role: "Plenary Speaker",
        organization: "Ashesi Institute",
        topic: "Ethics, Enterprise and the Common Good",
        bio: "An economist and lecturer focused on faith-informed business practice across the continent.",
        accentHue: "#9a6c1f",
      },
      {
        organizationId: orgId,
        eventId: summitId,
        name: "Rev. Michael Okoro",
        role: "Workshop Lead",
        organization: "Ministers' Fellowship",
        topic: "Pastoral Care in High-Growth Congregations",
        bio: "Rev. Okoro trains pastoral teams in governance, care structures and conflict resolution.",
        accentHue: "#2f6b4f",
      },
      {
        organizationId: orgId,
        eventId: summitId,
        name: "Ruth Bello",
        role: "Worship Leader",
        organization: "Selah Collective",
        topic: "Worship as a Corporate Discipline",
        bio: "Ruth leads a songwriter collective serving congregations across five countries.",
        accentHue: "#a4402f",
      },
      {
        organizationId: orgId,
        eventId: summitId,
        name: "Tunde & Bisi Fashola",
        role: "Family Seminar",
        organization: "Family Life Initiative",
        topic: "Leading a Household While Leading Others",
        bio: "The Fasholas have run marriage and family seminars for over a decade.",
        accentHue: "#163a30",
      },
      {
        organizationId: orgId,
        eventId: retreatId,
        name: "Pastor Grace Adeleke",
        role: "Retreat Director",
        organization: "Grace Fellowship Youth",
        topic: "Rooted — Session One",
        bio: "Pastor Grace has led the youth ministry for nine years.",
        accentHue: "#c08a2e",
      },
      {
        organizationId: orgId,
        eventId: retreatId,
        name: "David Umoh",
        role: "Speaker",
        organization: "Campus Reach",
        topic: "Faith on Campus",
        bio: "David mentors university students across six campuses.",
        accentHue: "#2c4a40",
      },
    ]);

    const sessionRows: Array<{
      eventId: string;
      title: string;
      track: string;
      day: number;
      start: string;
      end: string;
      venue: string;
      speakerName?: string;
      kind?: string;
      description?: string;
    }> = [
      {
        eventId: summitId,
        title: "Opening Night: Faithful Stewardship",
        track: "Main Hall",
        day: 1,
        start: "2027-03-18T17:00:00Z",
        end: "2027-03-18T19:30:00Z",
        venue: "Main Auditorium",
        speakerName: "Dr. Adaeze Nwosu",
        kind: "plenary",
      },
      {
        eventId: summitId,
        title: "Morning Worship & Devotion",
        track: "Main Hall",
        day: 2,
        start: "2027-03-19T07:30:00Z",
        end: "2027-03-19T08:30:00Z",
        venue: "Main Auditorium",
        speakerName: "Ruth Bello",
        kind: "worship",
      },
      {
        eventId: summitId,
        title: "Building Institutions That Outlive Their Founders",
        track: "Leadership",
        day: 2,
        start: "2027-03-19T09:00:00Z",
        end: "2027-03-19T10:30:00Z",
        venue: "Main Auditorium",
        speakerName: "Pastor Samuel Adeyemi",
      },
      {
        eventId: summitId,
        title: "Ethics, Enterprise and the Common Good",
        track: "Enterprise",
        day: 2,
        start: "2027-03-19T11:00:00Z",
        end: "2027-03-19T12:30:00Z",
        venue: "Hall B",
        speakerName: "Dr. Hannah Osei",
      },
      {
        eventId: summitId,
        title: "Pastoral Care in High-Growth Congregations",
        track: "Ministry",
        day: 2,
        start: "2027-03-19T14:00:00Z",
        end: "2027-03-19T15:30:00Z",
        venue: "Seminar Room 2",
        speakerName: "Rev. Michael Okoro",
      },
      {
        eventId: summitId,
        title: "Leading a Household While Leading Others",
        track: "Family",
        day: 3,
        start: "2027-03-20T09:30:00Z",
        end: "2027-03-20T11:00:00Z",
        venue: "Hall B",
        speakerName: "Tunde & Bisi Fashola",
      },
      {
        eventId: summitId,
        title: "Moderated Roundtable: Governance",
        track: "Leadership",
        day: 3,
        start: "2027-03-20T11:30:00Z",
        end: "2027-03-20T13:00:00Z",
        venue: "Board Room",
        speakerName: "Dr. Adaeze Nwosu",
        kind: "roundtable",
      },
      {
        eventId: summitId,
        title: "Commissioning & Closing Service",
        track: "Main Hall",
        day: 4,
        start: "2027-03-21T10:00:00Z",
        end: "2027-03-21T13:00:00Z",
        venue: "Main Auditorium",
        speakerName: "Dr. Adaeze Nwosu",
        kind: "service",
      },
      {
        eventId: retreatId,
        title: "Arrival, Check-in & Orientation",
        track: "Main",
        day: 1,
        start: "2027-08-05T13:00:00Z",
        end: "2027-08-05T16:00:00Z",
        venue: "Reception Lawn",
        kind: "logistics",
      },
      {
        eventId: retreatId,
        title: "Opening Session: Rooted",
        track: "Main",
        day: 1,
        start: "2027-08-05T19:00:00Z",
        end: "2027-08-05T21:00:00Z",
        venue: "Main Hall",
        speakerName: "Pastor Grace Adeleke",
      },
      {
        eventId: retreatId,
        title: "Faith on Campus",
        track: "Teaching",
        day: 2,
        start: "2027-08-06T10:00:00Z",
        end: "2027-08-06T11:30:00Z",
        venue: "Seminar Hall",
        speakerName: "David Umoh",
      },
      {
        eventId: retreatId,
        title: "Open-Mic Worship Night",
        track: "Worship",
        day: 2,
        start: "2027-08-06T20:00:00Z",
        end: "2027-08-06T22:30:00Z",
        venue: "Main Hall",
        kind: "worship",
      },
    ];

    await db.insert(sessions).values(
      sessionRows.map((s) => ({
        eventId: s.eventId,
        title: s.title,
        description: s.description ?? "",
        track: s.track,
        day: s.day,
        startsAt: new Date(s.start),
        endsAt: new Date(s.end),
        venue: s.venue,
        speakerName: s.speakerName ?? null,
        kind: s.kind ?? "session",
      }))
    );

    const delegateRows: Array<{
      first: string;
      last: string;
      email: string;
      phone: string;
      city: string;
      church: string;
      ticket: 0 | 1 | 2 | 3;
      accommodation: boolean;
      transport: boolean;
      status?: string;
    }> = [
      { first: "Amara", last: "Eze", email: "amara.eze@example.com", phone: "+234 802 000 0011", city: "Abuja", church: "Grace Fellowship", ticket: 1, accommodation: true, transport: true },
      { first: "Peter", last: "Adeleke", email: "p.adeleke@example.com", phone: "+234 802 000 0012", city: "Lagos", church: "Chapel of Light", ticket: 0, accommodation: false, transport: false },
      { first: "Lydia", last: "Okafor", email: "lydia.okafor@example.com", phone: "+234 802 000 0013", city: "Enugu", church: "City of God Assembly", ticket: 2, accommodation: true, transport: true },
      { first: "Emeka", last: "Nwachukwu", email: "emeka.n@example.com", phone: "+234 802 000 0014", city: "Port Harcourt", church: "Rivers Chapel", ticket: 0, accommodation: true, transport: true },
      { first: "Funmi", last: "Balogun", email: "funmi.balogun@example.com", phone: "+234 802 000 0015", city: "Lagos", church: "Grace Fellowship", ticket: 1, accommodation: false, transport: true },
      { first: "Joshua", last: "Danjuma", email: "j.danjuma@example.com", phone: "+234 802 000 0016", city: "Kaduna", church: "Faith Tabernacle", ticket: 2, accommodation: true, transport: true },
      { first: "Blessing", last: "Itua", email: "blessing.itua@example.com", phone: "+234 802 000 0017", city: "Benin City", church: "Word Assembly", ticket: 3, accommodation: false, transport: false },
      { first: "Samuel", last: "Ogundipe", email: "s.ogundipe@example.com", phone: "+234 802 000 0018", city: "Ibadan", church: "Christ Chapel", ticket: 0, accommodation: true, transport: true },
      { first: "Ngozi", last: "Uche", email: "ngozi.uche@example.com", phone: "+234 802 000 0019", city: "Aba", church: "Living Waters", ticket: 2, accommodation: true, transport: true, status: "pending" },
      { first: "Ibrahim", last: "Yusuf", email: "i.yusuf@example.com", phone: "+234 802 000 0020", city: "Abuja", church: "House on the Rock", ticket: 0, accommodation: true, transport: true },
      { first: "Chidinma", last: "Obi", email: "chidinma.obi@example.com", phone: "+234 802 000 0021", city: "Owerri", church: "Grace Fellowship", ticket: 1, accommodation: true, transport: true },
      { first: "Tobiloba", last: "Adeyanju", email: "t.adeyanju@example.com", phone: "+234 802 000 0022", city: "Lagos", church: "New Estate Church", ticket: 3, accommodation: false, transport: true },
      { first: "Grace", last: "Mensah", email: "grace.mensah@example.com", phone: "+233 240 000 0023", city: "Accra", church: "Accra Community Church", ticket: 1, accommodation: true, transport: true },
      { first: "Kelechi", last: "Anyanwu", email: "k.anyanwu@example.com", phone: "+234 802 000 0024", city: "Lagos", church: "Grace Fellowship", ticket: 0, accommodation: true, transport: true },
    ];

    const regValues = delegateRows.map((d, i) => {
      const ticketId = null;
      return {
        eventId: summitId,
        ticketTypeId: ticketId,
        code: `KLS27-${String(i + 1).padStart(4, "0")}`,
        ticketCode: `TKT-${(84210 + i * 37).toString(36).toUpperCase()}${i + 11}`,
        firstName: d.first,
        lastName: d.last,
        email: d.email,
        phone: d.phone,
        city: d.city,
        country: d.city === "Accra" ? "GH" : "NG",
        church: d.church,
        attendeeType: d.ticket === 2 ? "student" : "delegate",
        status: d.status ?? "confirmed",
        accommodation: d.accommodation,
        transport: d.transport,
        dietary: "",
        emergencyName: `${d.last} Family`,
        emergencyPhone: d.phone,
        amount: [25000, 60000, 12000, 15000][d.ticket],
        source: i % 4 === 0 ? "whatsapp" : "event_page",
      };
    });

    const insertedRegs = await db
      .insert(registrations)
      .values(regValues)
      .returning({
        id: registrations.id,
        eventId: registrations.eventId,
        amount: registrations.amount,
        status: registrations.status,
      });

    await db.insert(payments).values(
      insertedRegs.map((r, i) => ({
        registrationId: r.id,
        eventId: r.eventId,
        amount: r.amount,
        currency: "NGN",
        gateway: "paystack",
        gatewayReference: `PSK_${(910000 + i * 17).toString(36).toUpperCase()}${i}`,
        status: r.status === "pending" ? "pending" : "paid",
        verified: r.status !== "pending",
        paidAt: r.status === "pending" ? null : new Date("2027-01-12T10:00:00Z"),
      }))
    );

    await db.insert(checkIns).values(
      insertedRegs.slice(0, 9).map((r, i) => ({
        eventId: r.eventId,
        registrationId: r.id,
        method: i % 3 === 0 ? "manual" : "qr",
        staffName: ["N. Okafor", "T. Bello", "Command Center"][i % 3],
        gate: i % 2 === 0 ? "Main entrance" : "East wing",
        checkedInAt: new Date(Date.now() - (i + 1) * 11 * 60_000),
      }))
    );

    await db.insert(certificates).values(
      insertedRegs.slice(0, 6).map((r, i) => ({
        registrationId: r.id,
        eventId: r.eventId,
        verificationCode: `GF-KLS27-${(10432 + i * 41).toString().padStart(5, "0")}`,
        status: "issued",
        issuedAt: new Date("2026-03-22T12:00:00Z"),
      }))
    );

    await db.insert(volunteers).values([
      { eventId: summitId, name: "Grace Ihedi", department: "Ushering", role: "Team Lead", shift: "Morning (06:00–13:00)", phone: "+234 803 111 2233", status: "confirmed", isLeader: true },
      { eventId: summitId, name: "Samuel Etim", department: "Protocol", role: "Coordinator", shift: "Full day", phone: "+234 803 111 2234", status: "confirmed", isLeader: true },
      { eventId: summitId, name: "Joy Adebayo", department: "Registration", role: "Desk Lead", shift: "Morning (06:00–13:00)", phone: "+234 803 111 2235", status: "confirmed", isLeader: true },
      { eventId: summitId, name: "Daniel Ojo", department: "Media", role: "Camera", shift: "Afternoon (12:00–20:00)", phone: "+234 803 111 2236", status: "confirmed" },
      { eventId: summitId, name: "Esther Nnaji", department: "Welfare", role: "Member", shift: "Morning (06:00–13:00)", phone: "+234 803 111 2237", status: "confirmed" },
      { eventId: summitId, name: "Paul Okonkwo", department: "Security", role: "Shift Lead", shift: "Afternoon (12:00–20:00)", phone: "+234 803 111 2238", status: "confirmed", isLeader: true },
      { eventId: summitId, name: "Rita Adeyinka", department: "Medical", role: "Nurse", shift: "Full day", phone: "+234 803 111 2239", status: "confirmed" },
      { eventId: summitId, name: "Femi Balogun", department: "Transportation", role: "Route Lead", shift: "Morning (06:00–13:00)", phone: "+234 803 111 2240", status: "confirmed", isLeader: true },
      { eventId: summitId, name: "Anna Peter", department: "Prayer Team", role: "Member", shift: "Evening (17:00–22:00)", phone: "+234 803 111 2241", status: "confirmed" },
      { eventId: summitId, name: "John Uche", department: "Technical", role: "Sound", shift: "Full day", phone: "+234 803 111 2242", status: "pending" },
      { eventId: summitId, name: "Martha James", department: "Ushering", role: "Member", shift: "Afternoon (12:00–20:00)", phone: "+234 803 111 2243", status: "pending" },
      { eventId: summitId, name: "Kelvin Sadiq", department: "Media", role: "Editor", shift: "Evening (17:00–22:00)", phone: "+234 803 111 2244", status: "pending" },
      { eventId: retreatId, name: "Bisi Olanrewaju", department: "Welfare", role: "Team Lead", shift: "Full day", phone: "+234 803 111 2245", status: "confirmed", isLeader: true },
      { eventId: retreatId, name: "Andrew Kalu", department: "Transportation", role: "Driver Lead", shift: "Morning (06:00–13:00)", phone: "+234 803 111 2246", status: "confirmed", isLeader: true },
    ]);

    await db.insert(tasks).values([
      { organizationId: orgId, eventId: summitId, title: "Confirm final hall seating plan with venue team", category: "Venue", status: "in_progress", priority: "high", assignee: "Samuel Etim", dueAt: new Date("2027-03-10T17:00:00Z") },
      { organizationId: orgId, eventId: summitId, title: "Upload speaker photos and biographies", category: "Content", status: "complete", priority: "normal", assignee: "Joy Adebayo", dueAt: new Date("2027-02-28T17:00:00Z") },
      { organizationId: orgId, eventId: summitId, title: "Assign 12 remaining ushering positions", category: "Volunteers", status: "not_started", priority: "high", assignee: "Grace Ihedi", dueAt: new Date("2027-03-12T17:00:00Z") },
      { organizationId: orgId, eventId: summitId, title: "Print delegate badges and signage", category: "Logistics", status: "not_started", priority: "normal", assignee: "Esther Nnaji", dueAt: new Date("2027-03-15T17:00:00Z") },
      { organizationId: orgId, eventId: summitId, title: "Confirm Bus 04 departure time with driver", category: "Transport", status: "blocked", priority: "high", assignee: "Femi Balogun", dueAt: new Date("2027-03-11T17:00:00Z") },
      { organizationId: orgId, eventId: summitId, title: "Schedule T-7 email in communication timeline", category: "Communications", status: "complete", priority: "normal", assignee: "Adaeze Nwosu", dueAt: new Date("2027-03-05T17:00:00Z") },
      { organizationId: orgId, eventId: retreatId, title: "Publish retreat packing list", category: "Content", status: "in_progress", priority: "normal", assignee: "Bisi Olanrewaju", dueAt: new Date("2027-07-20T17:00:00Z") },
      { organizationId: orgId, eventId: retreatId, title: "Confirm accommodation allocation (rooms 12–18)", category: "Accommodation", status: "not_started", priority: "normal", assignee: "Andrew Kalu", dueAt: new Date("2027-07-25T17:00:00Z") },
    ]);

    await db.insert(blueprints).values([
      {
        organizationId: orgId,
        name: "Annual Leadership Conference",
        description:
          "Four-day conference with three tracks, premium delegate tier, roundtables and a delegates' dinner.",
        category: "Conference",
        includes: [
          "Registration form",
          "4 ticket tiers",
          "3-track schedule",
          "Email timeline (5 touches)",
          "Volunteer structure",
          "Certificate design",
        ],
        useCount: 7,
        lastUsedAt: new Date("2026-11-04T09:00:00Z"),
      },
      {
        organizationId: orgId,
        name: "Youth Retreat",
        description:
          "Residential retreat with accommodation, transport routes, consent forms and welfare teams.",
        category: "Retreat",
        includes: [
          "Accommodation setup",
          "Transport routes",
          "Guardian consent fields",
          "Welfare team structure",
          "Feedback survey",
        ],
        useCount: 4,
        lastUsedAt: new Date("2026-08-12T09:00:00Z"),
      },
      {
        organizationId: orgId,
        name: "Workers' Meeting",
        description:
          "Quarterly internal meeting template with attendance tracking and departmental reporting.",
        category: "Church Program",
        includes: ["Attendance tracking", "Department roster", "Internal notes"],
        useCount: 12,
        lastUsedAt: new Date("2027-01-18T09:00:00Z"),
      },
      {
        organizationId: orgId,
        name: "Marriage & Family Seminar",
        description:
          "Couples registration, paired ticketing, resource downloads and post-event feedback.",
        category: "Seminar",
        includes: ["Couple registration", "Resource hub", "Feedback survey"],
        useCount: 3,
        lastUsedAt: new Date("2026-09-30T09:00:00Z"),
      },
      {
        organizationId: orgId,
        name: "Open Worship Night",
        description:
          "Free entry, capacity-managed registration with SMS reminders and volunteer check-in.",
        category: "Worship",
        includes: ["Free registration", "Capacity limit", "SMS reminders"],
        useCount: 9,
        lastUsedAt: new Date("2026-12-21T09:00:00Z"),
      },
    ]);

    await db.insert(auditLogs).values([
      { organizationId: orgId, actor: "Adaeze Nwosu", action: "Published event", entity: "event", entityId: "kingdom-leadership-summit-2027", detail: "Kingdom Leadership Summit 2027 is now public" },
      { organizationId: orgId, actor: "Joy Adebayo", action: "Updated ticket pricing", entity: "ticket_type", entityId: "Premium Delegate", detail: "Premium Delegate changed from ₦55,000 to ₦60,000" },
      { organizationId: orgId, actor: "System", action: "Payment verified", entity: "payment", entityId: "PSK_910000", detail: "Paystack verification succeeded for KLS27-0001" },
      { organizationId: orgId, actor: "Grace Ihedi", action: "Manual check-in", entity: "registration", entityId: "KLS27-0004", detail: "Checked in at Main entrance" },
      { organizationId: orgId, actor: "Samuel Etim", action: "Saved blueprint", entity: "blueprint", entityId: "Annual Leadership Conference", detail: "Saved from Kingdom Leadership Summit 2026" },
      { organizationId: orgId, actor: "Adaeze Nwosu", action: "Scheduled communication", entity: "communication", entityId: "T-14", detail: "Preparation reminder scheduled for all attendees" },
    ]);

    console.log("[selah] demo tenant seeded");
  } catch (err) {
    console.error("[selah] seed failed:", err);
  }
}

export const DEMO_ORG_ID = orgId;
