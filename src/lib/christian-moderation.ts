/**
 * Selah Christian Ministry Guard & Content Moderation Engine
 * 
 * Protects the platform from secular raves, nightclubs, gambling, occultic gatherings,
 * adult content, and worldly entertainment while welcoming genuine churches,
 * student fellowships, and Christian ministry organizers.
 */

export interface ModerationResult {
  isValid: boolean;
  reason?: string;
  isFlaggedForReview?: boolean;
  flagNotice?: string;
  faithScore: number; // 0 - 100 confidence
}

// 1. Strictly Prohibited Keywords on Selah (Instant Rejection)
const PROHIBITED_PATTERNS: { regex: RegExp; category: string }[] = [
  // Nightclub / Secular Drinking Raves / Nightlife
  {
    regex: /\b(night[\s-]*club|nightclub|clubbing|disco|rave|bar[\s-]*crawl|pub[\s-]*crawl|hookah[\s-]*lounge|shisha|beer[\s-]*pong|booze[\s-]*fest|drunk[\s-]*night|strip[\s-]*show|gentlem[ae]n'?s[\s-]*club)\b/i,
    category: "Secular Nightclub / Nightlife",
  },
  // Adult / Explicit Content
  {
    regex: /\b(strip[\s-]*club|stripper|erotic|adult entertainment|escort service|twerk|lingerie party|onlyfans|xxx|porn)\b/i,
    category: "Adult / Explicit Content",
  },
  // Gambling / Betting / Scams
  {
    regex: /\b(casino|sports betting|sportsbook|roulette|blackjack|lottery draw|bet9ja|1xbet|crypto ponzi|gambling|poker tournament)\b/i,
    category: "Gambling / Betting",
  },
  // Occultic / Esoteric / Anti-Christian
  {
    regex: /\b(witchcraft|voodoo|black magic|sorcery|tarot|psychic reading|astrology reading|necromancy|satanic|luciferian|anti-christ|pagan ritual)\b/i,
    category: "Occultic / Anti-Christian",
  },
];

// 2. Suspicious Secular Nightlife & Party Terms (Blocked if lacking Christian context)
const SECULAR_PARTY_PATTERNS = [
  /\b(party|rave|after[\s-]*party|pool[\s-]*party|beach[\s-]*party|hangover|turn[\s-]*up|wild[\s-]*night|dj[\s-]*set|booze|cocktail[\s-]*night)\b/i,
];

// 3. Positive Christian Faith Signals
const CHRISTIAN_FAITH_SIGNALS = [
  /\b(jesus|christ|god|holy spirit|holy ghost|scripture|bible|biblical|gospel)\b/i,
  /\b(church|parish|fellowship|chapel|assembly|cathedral|sanctuary|ministry|mission)\b/i,
  /\b(worship|praise|prayer|praying|intercession|vigil|revival|anointing|grace)\b/i,
  /\b(pastor|apostle|evangelist|prophet|minister|deacon|elder|bishop|reverend|priest)\b/i,
  /\b(brethren|believers|disciples|choir|hymn|psalm|testimony|communion|sacrament)\b/i,
  /\b(youth fellowship|campus fellowship|nifes|jccf|rcf|cu|casor|fyb dinner|vbs)\b/i,
  /\b(crusade|retreat|christian|godly|salvation|resurrection|easter|christmas)\b/i,
  /\b(convocation|discipleship|impartation|deliverance|altar|soaking|sanctuary)\b/i,
];

// Allowed Christian Event Types in Selah
const CHRISTIAN_EVENT_TYPES = [
  "conference",
  "worship_night",
  "retreat",
  "seminar",
  "youth_fellowship",
  "prayer_vigil",
  "revival",
  "camp_meeting",
  "gospel_concert",
  "bible_study",
  "leadership_summit",
  "marriage_seminar",
  "singles_fellowship",
  "breakfast_meeting",
  "online_service",
];

/**
 * Validates whether an event complies with Selah's Christian Ministry Covenant.
 */
export function validateChristianEventContent(data: {
  title?: string | null;
  theme?: string | null;
  tagline?: string | null;
  description?: string | null;
  eventType?: string | null;
}): ModerationResult {
  const combinedText = [
    data.title || "",
    data.theme || "",
    data.tagline || "",
    data.description || "",
    data.eventType || "",
  ].join(" ").toLowerCase();

  // Step 1: Check for Strictly Prohibited Content (Instant Rejection)
  for (const { regex, category } of PROHIBITED_PATTERNS) {
    const match = combinedText.match(regex);
    if (match) {
      return {
        isValid: false,
        reason: `This event cannot be published on Selah. Selah is a Christian Event Operating System dedicated exclusively to Christ-honoring ministry gatherings, fellowships, and church programs. The term "${match[0]}" (${category}) violates our Christian Ministry Covenant.`,
        faithScore: 0,
      };
    }
  }

  // Step 2: Compute Positive Christian Context Score
  let matchedSignalsCount = 0;
  for (const signal of CHRISTIAN_FAITH_SIGNALS) {
    if (signal.test(combinedText)) {
      matchedSignalsCount++;
    }
  }

  // Step 3: Check Secular Party Patterns lacking Christian context
  for (const pattern of SECULAR_PARTY_PATTERNS) {
    const partyMatch = combinedText.match(pattern);
    if (partyMatch && matchedSignalsCount === 0) {
      return {
        isValid: false,
        reason: `This event cannot be published on Selah. Selah is exclusively dedicated to Christ-centered church and ministry programs. Secular party or entertainment events containing "${partyMatch[0]}" without Christian ministry purpose are not permitted.`,
        faithScore: 0,
      };
    }
  }

  // Step 4: Require Minimum Faith Context
  // If an event has 0 faith signals and the event type is not an intrinsically recognized Christian type:
  if (matchedSignalsCount === 0) {
    const normalizedType = (data.eventType || "").toLowerCase();
    const isExplicitlyChristianType = [
      "worship_night",
      "youth_fellowship",
      "prayer_vigil",
      "revival",
      "camp_meeting",
      "gospel_concert",
      "bible_study",
    ].includes(normalizedType);

    if (!isExplicitlyChristianType) {
      return {
        isValid: false,
        reason: `Selah is exclusively dedicated to Christian churches, ministries, and spiritual fellowships. Please include your Christian ministry name, church affiliation, or faith focus (e.g., worship, prayer, Scripture, fellowship) in the title or description.`,
        faithScore: 0,
      };
    }
  }

  // Base score calculation
  const faithScore = Math.min(100, matchedSignalsCount * 25);

  return {
    isValid: true,
    faithScore,
    isFlaggedForReview: faithScore < 25,
    flagNotice: faithScore < 25 
      ? "Note: Please ensure this event is affiliated with a recognized Christian church, ministry, or fellowship." 
      : undefined,
  };
}

/**
 * Organizer Verification & Covenant Checklist
 */
export const SELAH_MINISTRY_COVENANT = [
  "Christ-Centered Purpose: This event is organized to worship God, teach Scripture, equip believers, win souls, or foster godly Christian fellowship.",
  "Moral Integrity: The program contains no adult entertainment, drunkenness, gambling, occult practices, or profane content.",
  "Financial Transparency: All ticketing and offerings collected are handled with godly stewardship and accountability.",
  "Safe Sanctuary: The gathering maintains a safe, respectful environment for families, children, youth, and leaders.",
];
