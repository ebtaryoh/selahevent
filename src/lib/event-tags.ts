/**
 * Selah Event Tags & Category Architecture
 * Ensures all events (including student fellowships, youth camps, couples dinners,
 * ministers retreats, and church hangouts) map strictly to available tags on Selah.
 */

export const AVAILABLE_EVENT_TAGS = [
  "Conferences",
  "Worship",
  "Business",
  "Youth Meetings",
  "Singles Program",
  "Christian Hangout",
  "Married & Singles",
  "Retreats",
  "Seminars",
  "Concerts",
  "Bible Study",
  "Online",
] as const;

export type AvailableEventTag = (typeof AVAILABLE_EVENT_TAGS)[number];

/**
 * Returns the official tag among the ones already available in Selah.
 */
export function getEventTag(eventType?: string | null): AvailableEventTag {
  if (!eventType) return "Conferences";
  const normalized = eventType.toLowerCase().trim();

  switch (normalized) {
    // Christian Hangouts, Picnics & Social Celebrations
    case "banquet":
    case "birthday":
    case "fyb_dinner":
    case "campus_handover":
    case "singles_hangout":
    case "singles_dinner":
    case "departmental_dinner":
    case "church_picnic":
    case "game_night":
    case "love_feast":
    case "youth_hangout":
    case "mens_breakfast":
    case "christian_hangout":
    case "christian hangout":
      return "Christian Hangout";

    // Married & Couples
    case "wedding":
    case "couples_dinner":
    case "family_conference":
    case "married_singles":
    case "married & singles":
      return "Married & Singles";

    // Singles Programs
    case "singles":
    case "singles_program":
    case "singles program":
      return "Singles Program";

    // Youth & Students
    case "youth":
    case "youth_meetings":
    case "youth meetings":
    case "freshers_welcome":
    case "teens_camp":
      return "Youth Meetings";

    // Retreats & Camps
    case "retreat":
    case "retreats":
    case "youth_camp":
    case "marriage_retreat":
    case "ministers_retreat":
    case "workers_retreat":
    case "elders_retreat":
    case "choir_retreat":
      return "Retreats";

    // Seminars, Workshops & Training
    case "seminar":
    case "seminars":
    case "career_workshop":
    case "premarital_class":
    case "ushers_training":
    case "media_workshop":
      return "Seminars";

    // Concerts & Music Festivals
    case "concert":
    case "concerts":
    case "youth_rally":
      return "Concerts";

    // Worship & Crusades
    case "worship":
    case "church_service":
    case "crusade":
    case "vigil":
      return "Worship";

    // Business
    case "business":
      return "Business";

    // Bible Study & VBS
    case "bible_study":
    case "bible study":
    case "vbs_camp":
      return "Bible Study";

    // Online
    case "online":
      return "Online";

    // Conferences, Conventions & Summits
    case "conference":
    case "conferences":
    case "summit":
    case "campus_conference":
    case "academic_summit":
    case "ministers_conference":
    case "womens_conference":
    case "church_convention":
    default:
      return "Conferences";
  }
}

/**
 * Checks if the event type utilizes table & seat allocation
 * (Banquets, Weddings, Birthdays, FYB Dinners, Couples Dinners, Galas)
 */
export function isSeatedEvent(eventType?: string | null): boolean {
  if (!eventType) return false;
  const normalized = eventType.toLowerCase().trim();
  return [
    "banquet",
    "wedding",
    "birthday",
    "dinner",
    "gala",
    "fyb_dinner",
    "campus_handover",
    "couples_dinner",
    "singles_dinner",
    "departmental_dinner",
    "mens_breakfast",
  ].includes(normalized);
}

/**
 * Formatted human-friendly title for the event type
 */
export function getEventTypeLabel(eventType?: string | null): string {
  if (!eventType) return "Event";
  switch (eventType.toLowerCase().trim()) {
    // Campus & Students
    case "fyb_dinner":
      return "Final Year Brethren (FYB) Dinner";
    case "campus_conference":
      return "Campus Fellowship Conference";
    case "freshers_welcome":
      return "Freshers' Welcome & Orientation";
    case "campus_handover":
      return "Fellowship Handover Banquet";
    case "academic_summit":
      return "Students' Academic & Spiritual Summit";

    // Youth & Teens
    case "youth_camp":
      return "Youth Camp & Retreat";
    case "youth_meetings":
      return "Youth Meeting";
    case "teens_camp":
      return "Teenagers' Bootcamp & Camp";
    case "youth_hangout":
      return "Youth Games Day & Hangout";
    case "youth_rally":
      return "Youth Praise Rally";
    case "career_workshop":
      return "Career, Skills & Tech Workshop";

    // Singles
    case "singles_program":
      return "Singles Summit & Seminar";
    case "singles_hangout":
      return "Singles Mixer & Hangout";
    case "singles_dinner":
      return "Singles Gala Dinner";
    case "premarital_class":
      return "Courtship & Pre-Marital Class";

    // Married & Couples
    case "couples_dinner":
      return "Couples Dinner & Romance Night";
    case "marriage_retreat":
      return "Marriage Enrichment Retreat";
    case "wedding":
      return "Christian Wedding";
    case "family_conference":
      return "Parents & Family Life Conference";

    // Pastors & Ministers
    case "ministers_conference":
      return "Pastors & Church Leaders Conference";
    case "ministers_retreat":
      return "Ministers Impartation Retreat";
    case "workers_retreat":
      return "Church Workers Induction Retreat";
    case "elders_retreat":
      return "Elders & Deacons Retreat";

    // Church Departments & Groups
    case "choir_retreat":
      return "Choir & Music Ministry Retreat";
    case "ushers_training":
      return "Ushers & Protocol Training Summit";
    case "media_workshop":
      return "Media, Sound & Tech Workshop";
    case "mens_breakfast":
      return "Men's Fellowship Breakfast & Summit";
    case "womens_conference":
      return "Women's Conference & Fellowship";
    case "vbs_camp":
      return "Children's Vacation Bible School (VBS)";
    case "departmental_dinner":
      return "Departmental End-of-Year Banquet";

    // Socials & Banquets
    case "banquet":
      return "Christian Banquet / Dinner";
    case "birthday":
      return "Christian Birthday Celebration";
    case "church_picnic":
      return "Church Picnic & Outdoor Fellowship";
    case "game_night":
      return "Christian Game Night & Hangout";
    case "love_feast":
      return "Love Feast & Praise Buffet";

    // Congregational
    case "church_convention":
      return "Annual Church Convention / Synod";
    case "crusade":
      return "Miracle Crusade & City Outreach";
    case "vigil":
      return "All-Night Prayer Vigil";
    case "conference":
      return "Conference";
    case "retreat":
      return "Retreat";
    case "worship":
      return "Worship Night";
    case "church_service":
      return "Church Service";
    case "summit":
      return "Summit";
    case "concert":
      return "Concert";
    case "seminar":
      return "Seminar";
    case "bible_study":
      return "Bible Study";
    case "christian_hangout":
      return "Christian Hangout";
    case "married_singles":
      return "Married & Singles Gathering";
    case "business":
      return "Business & Marketplace";
    case "online":
      return "Online Gathering";
    default:
      return getEventTag(eventType);
  }
}

/**
 * Maps a public filter category pill to raw DB event_type values
 */
export function getDbEventTypesForCategory(category: string): string[] {
  const norm = category.toLowerCase().trim();

  switch (norm) {
    case "christian hangout":
      return [
        "christian hangout",
        "christian_hangout",
        "banquet",
        "birthday",
        "fyb_dinner",
        "campus_handover",
        "singles_hangout",
        "singles_dinner",
        "departmental_dinner",
        "church_picnic",
        "game_night",
        "love_feast",
        "youth_hangout",
        "mens_breakfast",
      ];
    case "married & singles":
      return [
        "married & singles",
        "married_singles",
        "wedding",
        "couples_dinner",
        "family_conference",
      ];
    case "conferences":
      return [
        "conferences",
        "conference",
        "summit",
        "campus_conference",
        "academic_summit",
        "ministers_conference",
        "womens_conference",
        "church_convention",
      ];
    case "retreats":
      return [
        "retreats",
        "retreat",
        "youth_camp",
        "marriage_retreat",
        "ministers_retreat",
        "workers_retreat",
        "elders_retreat",
        "choir_retreat",
      ];
    case "seminars":
      return [
        "seminars",
        "seminar",
        "career_workshop",
        "premarital_class",
        "ushers_training",
        "media_workshop",
      ];
    case "concerts":
      return ["concerts", "concert", "youth_rally"];
    case "worship":
      return ["worship", "church_service", "crusade", "vigil"];
    case "youth meetings":
      return ["youth meetings", "youth_meetings", "freshers_welcome", "teens_camp"];
    case "singles program":
      return ["singles program", "singles_program"];
    case "bible study":
      return ["bible study", "bible_study", "vbs_camp"];
    case "business":
      return ["business"];
    case "online":
      return ["online"];
    default:
      return [norm];
  }
}
