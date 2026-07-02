// Beatkulture shared domain types - Phase 1+

export type EventType = 'wedding' | 'corporate' | 'birthday' | 'anniversary' | 'other';
export type EventStatus = 'draft' | 'planning' | 'ready_for_review' | 'approved' | 'archived';
export type TimelineStatus = 'draft' | 'generated' | 'client_review' | 'approved';
export type ApprovalStatus = 'pending' | 'approved' | 'changes_requested';
export type MessageRole = 'system' | 'user' | 'assistant';

export interface BkClient {
  id: string;
  owner_user_id: string;
  company_name?: string;
  contact_name: string;
  contact_email?: string;
  contact_phone?: string;
  preferences_json: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface BkEvent {
  id: string;
  client_id: string;
  type: EventType;
  title: string;
  event_date?: string;
  venue_name?: string;
  venue_address?: string;
  guest_count?: number;
  status: EventStatus;
  metadata_json: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface BkWedding {
  event_id: string;
  partner_a?: string;
  partner_b?: string;
  ceremony_type?: string;
  cultural_notes?: string;
  special_moments?: string;
  created_at: string;
  updated_at: string;
}

export interface BkAiConversation {
  id: string;
  event_id: string;
  channel: 'text' | 'voice';
  started_by?: string;
  model?: string;
  summary?: string;
  created_at: string;
}

export interface BkAiMessage {
  id: string;
  conversation_id: string;
  role: MessageRole;
  content: string;
  metadata_json: Record<string, any>;
  created_at: string;
}

export interface PlannerContext {
  eventId: string;
  conversationId: string;
  eventType: EventType;
  clientPreferences: Record<string, any>;
  collectedData: {
    clientDetails?: ClientDetails;
    eventDetails?: EventDetails;
    venueDetails?: VenueDetails;
    weddingDetails?: WeddingDetails;
    musicSelections?: MusicSelection[];
    ceremonyInfo?: CeremonyInfo;
    receptionInfo?: ReceptionInfo;
    entertainmentInfo?: EntertainmentInfo;
    eventStyle?: EventStyle;
  };
  memoryMessages: BkAiMessage[];
}

export interface ClientDetails {
  primaryContact: string;
  phone?: string;
  email?: string;
  secondaryContact?: string;
  budget?: number;
  timeline?: string;
}

export interface EventDetails {
  type: EventType;
  date: string;
  startTime?: string;
  estimatedEndTime?: string;
  guestCount?: number;
  dress_code?: string;
  theme?: string;
}

export interface VenueDetails {
  name: string;
  address?: string;
  type?: string;
  capacity?: number;
  indoorOutdoor?: 'indoor' | 'outdoor' | 'hybrid';
  parking?: boolean;
  catering_included?: boolean;
}

export interface WeddingDetails {
  partnerA: string;
  partnerB: string;
  ceremonyType: string;
  culturalTraditions?: string[];
  specialMoments?: string[];
}

export interface MusicSelection {
  segment: string;
  trackTitle: string;
  artist: string;
  bpm?: number;
  explicitOk: boolean;
}

export interface CeremonyInfo {
  type: string;
  duration_min?: number;
  readings?: string[];
  specialMusicMoments?: string[];
}

export interface ReceptionInfo {
  mealService?: string;
  danceFloorSize?: string;
  lightingPreference?: string;
  specialRequests?: string[];
}

export interface EntertainmentInfo {
  djPackage?: string;
  additionalServices?: string[];
  specialPerformances?: string[];
}

export interface EventStyle {
  colorPalette?: string[];
  musicGenres?: string[];
  vibe?: string;
  specialTheme?: string;
}

export interface AiPlannerResponse {
  message: string;
  nextQuestion?: string;
  dataCollected?: Record<string, any>;
  recommendations?: string[];
  confirmationNeeded?: boolean;
  structuredPlan?: EventPlan;
}

export interface EventPlan {
  eventType: EventType;
  summary: string;
  keyMoments: string[];
  musicThemes: string[];
  suggestedTimeline?: TimelineSegment[];
  notes: string;
}

export interface TimelineSegment {
  time: string;
  activity: string;
  duration_min: number;
  notes?: string;
}
