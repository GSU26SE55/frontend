/**
 * AI-ranked suggestions for a ticket.
 *
 * Human-in-the-loop: the AI only ranks and explains. The Manager decides who gets
 * assigned, and the technician decides which article to read. No endpoint here
 * assigns anyone or attaches an article on its own.
 */

export interface StaffSuggestionDTO {
  staffId: string;
  fullName: string;
  skillTier: number; // StaffSkillTierEnum: 1=Generalist, 2=ModuleSpecialist, 3=SeniorSpecialist
  skillCodes: string[];
  activeTickets: number;
  maxConcurrentTickets: number;
  /** Fit score [0..1] assigned by the AI. */
  score: number;
  /**
   * Human-readable rationale — MUST be displayed; this is what the Manager needs
   * in order to trust the suggestion.
   */
  reason: string;
}

export interface KbSuggestionDTO {
  kbArticleId: string;
  code: string;
  title: string;
  score: number;
  reason: string;
}

/**
 * Common wrapper for both kinds of suggestion.
 *
 * `aiAvailable=false` means the AI could not respond — the list is empty because of a
 * technical failure, NOT because no suitable candidate exists. The UI must distinguish
 * these two cases; otherwise users read it as "the system says there is nobody".
 */
export interface SuggestionListDTO<T> {
  items: T[];
  /**
   * Note shown when the list is empty or weak, e.g. "No staff member meets the
   * required tier for a P1 ticket."
   */
  note: string;
  aiAvailable: boolean;
}

export type StaffSuggestionListDTO = SuggestionListDTO<StaffSuggestionDTO>;
export type KbSuggestionListDTO = SuggestionListDTO<KbSuggestionDTO>;

/** Display labels for the tiers — match the BE's StaffSkillTierEnum. */
export const SKILL_TIER_LABELS: Record<number, string> = {
  1: "Tier 1 · Generalist",
  2: "Tier 2 · Module Specialist",
  3: "Tier 3 · Senior Specialist",
};
