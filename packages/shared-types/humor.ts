export type HumorCategory =
  | "wedding"
  | "best-man"
  | "maid-of-honor"
  | "father-of-bride"
  | "groom"
  | "bride"
  | "couple"
  | "anniversary"
  | "corporate"
  | "mc-icebreaker"
  | "crowd-warmup"
  | "dance-floor"
  | "trivia"
  | "personalized";

export type HumorStyle =
  | "lighthearted"
  | "family-friendly"
  | "witty"
  | "self-deprecating"
  | "story-based"
  | "observational"
  | "romantic-comedy"
  | "professional-mc";

export type AudienceAgeGroup = "kids" | "teens" | "mixed" | "adults";
export type EventFormality = "casual" | "semi-formal" | "formal";
export type SpeechTone = "funny" | "emotional" | "balanced" | "professional";
export type SpeechLength = "short" | "medium" | "long";

export interface HumorContext {
  eventType?: string;
  audienceAgeGroup?: AudienceAgeGroup;
  eventFormality?: EventFormality;
  culturalContext?: string;
  coupleNames?: string[];
  howTheyMet?: string;
  sharedHobbies?: string[];
  funnyStories?: string[];
  familyAnecdotes?: string[];
  eventTheme?: string;
  weddingPartyInfo?: string[];
}

export interface HumorSuggestion {
  id: string;
  category: HumorCategory;
  style: HumorStyle;
  line: string;
  setup?: string;
  punchline?: string;
  audienceSafe: boolean;
}

export interface SpeechRequest {
  role:
    | "best-man"
    | "maid-of-honor"
    | "father"
    | "mother"
    | "groom"
    | "bride"
    | "mc"
    | "thank-you"
    | "welcome"
    | "anniversary";
  tone: SpeechTone;
  length: SpeechLength;
  includeHumor: boolean;
}

export interface SpeechDraft {
  id: string;
  title: string;
  opening: string;
  body: string[];
  closing: string;
  estimatedMinutes: number;
}

