// Timeline Types - Event scheduling domain
import type { BkEvent } from "@/packages/shared-types/beatkulture";

/**
 * Event phase types
 */
export type EventPhase = 
  | "ceremony"
  | "cocktail"
  | "reception"
  | "grand_entrance"
  | "speeches"
  | "first_dance"
  | "dinner"
  | "dancing"
  | "special_performances"
  | "final_moments";

/**
 * DJ activity during phase
 */
export type DjActivity = "ceremony_music" | "cocktail_mix" | "mc_announcements" | "dancing" | "special_effects" | "setup" | "breakdown";

/**
 * Equipment status
 */
export type EquipmentStatus = "setup" | "active" | "standby" | "breakdown";

/**
 * Timeline event (single scheduled item)
 */
export interface TimelineEvent {
  id: string;
  phase: EventPhase;
  startTime: Date;
  endTime: Date;
  title: string;
  description?: string;
  duration: number; // minutes
  djActivity?: DjActivity;
  musicGenre?: string;
  notes?: string;
}

/**
 * Music selection for timeline
 */
export interface TimelineMusic {
  id: string;
  title: string;
  artist: string;
  duration: number; // seconds
  genre: string;
  bpm: number;
  linkedToPhase: EventPhase;
}

/**
 * Equipment requirement
 */
export interface EquipmentRequirement {
  name: string;
  setupTime: number; // minutes
  breakdownTime: number; // minutes
  phases: EventPhase[]; // which phases need this
  status: EquipmentStatus;
}

/**
 * Timeline state
 */
export interface EventTimeline {
  id: string;
  eventId: string;
  events: TimelineEvent[];
  music: TimelineMusic[];
  equipment: EquipmentRequirement[];
  totalDuration: number; // minutes
  bufferTime: number; // minutes between phases
  createdAt: Date;
  updatedAt: Date;
  aiOptimized: boolean;
}

/**
 * Timeline configuration for generation
 */
export interface TimelineConfig {
  eventType: "wedding" | "corporate" | "birthday" | "anniversary" | "graduation";
  startTime: Date;
  endTime: Date;
  eventDuration: number; // minutes
  guestCount: number;
  venue: string;
  hasSpecialPerformances: boolean;
  hasSpeeches: boolean;
  musicGenre: string;
  isSemiOutdoor?: boolean;
}

/**
 * Phase duration estimate
 */
export interface PhaseDurationEstimate {
  phase: EventPhase;
  duration: number; // minutes
  bufferAfter: number; // minutes
  priority: number; // 1-10
}

/**
 * DJ schedule entry
 */
export interface DjScheduleEntry {
  time: Date;
  activity: DjActivity;
  phase: EventPhase;
  notes?: string;
  equipment?: string[];
}

/**
 * Timeline optimization result
 */
export interface TimelineOptimization {
  timeline: EventTimeline;
  score: number; // 0-100 how well optimized
  suggestions: string[];
  conflicts: string[];
}
