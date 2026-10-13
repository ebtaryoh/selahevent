/**
 * Selah Christian Ministry Guard & Content Moderation Engine
 * 
 * Protects the platform from secular raves, gambling, occultic gatherings,
 * adult content, and non-Christian programs while welcoming genuine
 * churches, student fellowships, and Christian organizers.
 */

export interface ModerationResult {
  isValid: boolean;
  reason?: string;
  isFlaggedForReview?: boolean;
  flagNotice?: string;
  faithScore: number; // 0 - 100 confidence
}

// 1. Strictly Prohibited Categories on Selah (Instant Rejection)
const PROHIBITED_PATTERNS = [
  // Adult / Explicit Content
  /\b(strip club|stripper|erotic|adult entertainment|escort service|twerk contest|lingerie party|onlyfans|xxx)\b/i,
  // Nightclub / Secular Drinking Raves
  /\b(nightclub rave|club party|booze fest|beer pong|hookah lounge|pub crawl|bar crawl|drunk night|strip show)\b/i,
  // Gambling / Betting / Scams
  /\b(casino|sports betting|sportsbook|roulette|blackjack|lottery draw|bet9ja|1xbet|crypto ponzi|get rich quick scheme)\b/i,
  // Occultic / Esoteric / Anti-Christian
  /\b(witchcraft|voodoo|black magic|sorcery|tarot reading|psychic reading|astrology reading|necromancy|satanic|luciferian|anti-christ)\b/i,
];

// 2. Positive Christian Faith Signals
const CHRISTIAN_FAITH_SIGNALS = [
  /\b(jesus|christ|god|holy spirit|holy ghost|scripture|bible|biblical|gospel)\b/i,
  /\b(church|parish|fellowship|chapel|assembly|cathedral|sanctuary|ministry|mission)\b/i,
  /\b(worship|praise|prayer|praying|intercession|vigil|revival|anointing|grace)\b/i,
  /\b(pastor|apostle|evangelist|prophet|minister|deacon|elder|bishop|reverend|priest)\b/i,
  /\b(brethren|believers|disciples|choir|hymn|psalm|testimony|communion|sacrament)\b/i,
  /\b(youth fellowship|campus fellowship|nifes|jccf|rcf|cu|casor|fyb dinner|vbs)\b/i,
  /\b(crusade|retreat|christian|godly|salvation|resurrection|easter|christmas)\b/i,
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

  // Step 1: Check for Strictly Prohibited Content
  for (const pattern of PROHIBITED_PATTERNS) {
    const match = combinedText.match(pattern);
    if (match) {
      return {
        isValid: false,
        reason: `This event cannot be published on Selah. Selah is exclusively dedicated to Christ-honoring ministry gatherings, fellowships, and church programs. The term "${match[0]}" violates our Christian Ministry Covenant.`,
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

  // Base score calculation
  const faithScore = Math.min(100, matchedSignalsCount * 25);

  return {
    isValid: true,
    faithScore,
    isFlaggedForReview: faithScore === 0,
    flagNotice: faithScore === 0 
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
