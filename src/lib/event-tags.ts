/**
 * Selah Event Tags & Category Architecture
 * Ensures all events (including Christian Banquets, Weddings, and Birthdays)
 * map strictly to the available tags on Selah.
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
    case "banquet":
    case "birthday":
    case "christian_hangout":
    case "christian hangout":
      return "Christian Hangout";

    case "wedding":
    case "married_singles":
    case "married & singles":
      return "Married & Singles";

    case "singles":
    case "singles_program":
    case "singles program":
      return "Singles Program";

    case "youth":
    case "youth_meetings":
    case "youth meetings":
      return "Youth Meetings";

    case "retreat":
    case "retreats":
      return "Retreats";

    case "seminar":
    case "seminars":
      return "Seminars";

    case "concert":
    case "concerts":
      return "Concerts";

    case "worship":
    case "church_service":
      return "Worship";

    case "business":
      return "Business";

    case "bible_study":
    case "bible study":
      return "Bible Study";

    case "online":
      return "Online";

    case "conference":
    case "conferences":
    case "summit":
    default:
      return "Conferences";
  }
}

/**
 * Checks if the event type utilizes table & seat allocation
 * (Banquets, Weddings, Birthdays, Dinners)
 */
export function isSeatedEvent(eventType?: string | null): boolean {
  if (!eventType) return false;
  const normalized = eventType.toLowerCase().trim();
  return ["banquet", "wedding", "birthday", "dinner", "gala"].includes(normalized);
}

/**
 * Formatted human-friendly title for the event type
 */
export function getEventTypeLabel(eventType?: string | null): string {
  if (!eventType) return "Event";
  switch (eventType.toLowerCase().trim()) {
    case "banquet":
      return "Christian Banquet / Dinner";
    case "wedding":
      return "Christian Wedding";
    case "birthday":
      return "Christian Birthday / Celebration";
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
    case "youth_meetings":
      return "Youth Meeting";
    case "singles_program":
      return "Singles Program";
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
      return ["christian hangout", "christian_hangout", "banquet", "birthday"];
    case "married & singles":
      return ["married & singles", "married_singles", "wedding"];
    case "conferences":
      return ["conferences", "conference", "summit"];
    case "retreats":
      return ["retreats", "retreat"];
    case "seminars":
      return ["seminars", "seminar"];
    case "concerts":
      return ["concerts", "concert"];
    case "worship":
      return ["worship", "church_service"];
    case "youth meetings":
      return ["youth meetings", "youth_meetings"];
    case "singles program":
      return ["singles program", "singles_program"];
    case "bible study":
      return ["bible study", "bible_study"];
    case "business":
      return ["business"];
    case "online":
      return ["online"];
    default:
      return [norm];
  }
}
