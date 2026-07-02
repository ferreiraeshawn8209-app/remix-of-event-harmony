export interface PlanSnapshot {
  id: string;
  eventId: string;
  clientId: string;
  clientName: string;
  eventType: string;
  eventDate: string;
  venue: string;
  status: "draft" | "timeline_generated" | "visualization_generated" | "rehearsal_generated" | "pending_review" | "approved" | "changes_requested";
  hasTimeline: boolean;
  hasVisualization: boolean;
  hasRehearsal: boolean;
  timelinePhases?: number;
  storyboardScenes?: number;
  rehearsalDuration?: number;
  createdAt: string;
  updatedAt: string;
  lastMessageAt?: string;
}

export interface ApprovalItem {
  id: string;
  eventId: string;
  clientName: string;
  artifactType: "timeline" | "visualization" | "rehearsal";
  status: "pending" | "approved" | "changes_requested";
  requestedChangeNotes?: string;
  submittedAt: string;
  resolvedAt?: string;
}

export interface AnalyticsMetric {
  label: string;
  value: number;
  trend?: "up" | "down" | "stable";
  percentChange?: number;
}

export interface DashboardAnalytics {
  totalPlansCreated: number;
  plansWithTimeline: number;
  plansWithVisualization: number;
  plansWithRehearsal: number;
  averageTimeToFirstTimeline: number;
  approvalRate: number;
  changesRequestedRate: number;
  mostUsedHumorCategories: { category: string; count: number }[];
  mostUsedSpeechRoles: { role: string; count: number }[];
  clientSatisfaction?: number;
  avgSessionDuration?: number;
}
