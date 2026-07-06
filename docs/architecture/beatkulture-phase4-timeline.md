# PHASE 4: EVENT TIMELINE ENGINE - Architecture Summary

## Overview
Phase 4 introduces intelligent event scheduling that automatically generates optimized timelines for different event types. The engine handles:
- Multi-phase event generation (ceremony → cocktail → reception → dancing)
- Guest count-aware duration adjustment
- DJ schedule coordination
- Equipment timing and setup
- Timeline optimization with AI suggestions

## Key Components

### 1. Timeline Types (`packages/shared-types/timeline.ts`)
- **EventPhase**: ceremony, cocktail, reception, grand_entrance, speeches, first_dance, dinner, dancing, special_performances, final_moments
- **DjActivity**: ceremony_music, cocktail_mix, mc_announcements, dancing, special_effects, setup, breakdown
- **TimelineEvent**: Single scheduled item with time, phase, duration, DJ activity
- **EventTimeline**: Complete event schedule with events, music selections, equipment
- **TimelineConfig**: Input configuration for generation (event type, duration, guest count)
- **TimelineOptimization**: Result with score (0-100) and optimization suggestions

### 2. Timeline Engine (`services/timeline-engine/timeline-engine.ts`)
Core scheduling logic:

#### Key Methods:
- `generateTimeline(config, eventId)` - Generate base timeline from event config
- `optimizeTimeline(timeline, constraints)` - Optimize for flow and energy
- `generateDjSchedule(timeline)` - Create DJ activity schedule
- `adjustDurationForGuestCount(duration, guestCount)` - Scale phases by attendance
- `calculateSetupTime(timeline)` - Estimate equipment setup duration
- `getTimelineSummary(timeline)` - Format for display

#### Phase Defaults (Wedding Example):
| Phase | Duration | Buffer | Priority | DJ Activity |
|-------|----------|--------|----------|-------------|
| Ceremony | 45 min | 15 min | 10 | ceremony_music |
| Cocktail | 60 min | 10 min | 8 | cocktail_mix |
| Grand Entrance | 15 min | 5 min | 9 | mc_announcements |
| Speeches | 30 min | 10 min | 7 | mc_announcements |
| Dinner | 60 min | 5 min | 6 | cocktail_mix |
| First Dance | 5 min | 5 min | 9 | special_effects |
| Dancing | 180 min | 15 min | 8 | dancing |
| Special Performances | 30 min | 10 min | 5 | special_effects |
| Final Moments | 20 min | 0 min | 7 | dancing |

#### Optimization Criteria:
- Minimum 15-minute gaps between phases
- Maximum 2 consecutive high-energy phases
- Dancing duration minimum 90 minutes
- Proper ceremony/dining balance
- Equipment setup time included

#### Event Type Presets:
- **Wedding**: Formal, ceremony-focused, 1+ hour dancing
- **Corporate**: Professional, speeches prominent, moderate dancing
- **Birthday**: Performance-focused, shorter formal sections, high-energy dancing

### 3. Timeline Hook (`src/hooks/useTimeline.ts`)
React hook for timeline management:
- `generateTimeline(config, eventId)` - Generate and optimize
- `updateTimeline(updatedTimeline)` - Update and re-optimize
- `getFormattedTimeline()` - Format for display
- `getTimelineSummary()` - Text summary
- `getSetupTime()` - Equipment setup estimate

### 4. Timeline UI Component (`src/components/timeline/EventTimeline.tsx`)
Visual timeline display:
- Time-indexed event cards
- DJ activity badges
- Music genre tags
- Phase-specific notes
- Edit buttons for each event
- DJ schedule summary panel
- Timeline statistics (duration, phase count)
- Responsive layout with animations

#### Card Layout:
- **Left**: Time bar (start time + duration)
- **Center**: Event details, badges, notes
- **Right**: Edit button

#### Status Indicators:
- DJ activity icon/name
- Music genre badge
- Main event marker (dancing)
- Phase-specific notes

## Integration Points

### With Phase 1 (AI Planner)
- Timeline auto-generates after event details collected
- Avatar celebrates when timeline created
- User can ask AI for timeline adjustments
- "Refine my timeline" command triggers optimization

### With Phase 2 (Voice AI)
- Voice commands: "Make dancing longer", "Add special performances"
- Avatar speaks timeline during voice interaction
- DJ schedule spoken aloud for staff reference

### With Phase 3 (Avatar)
- Avatar animates phase changes during rehearsal
- Timeline displayed as avatar narrates
- Milestone celebrations tied to timeline completion

### Future (Phase 5-6)
- Timeline drives visual scene generation
- Avatar narrates phases during rehearsal video
- Timeline used as director's script for visualization

## Generation Algorithm

1. **Load Phase Presets**: Get default durations for event type
2. **Adjust for Guests**: Scale durations based on guest count
   - <50 guests: 20% shorter
   - >300 guests: 20% longer
3. **Fill Timeline**: Add phases sequentially with buffer times
4. **Optimize**: Check gaps, energy balance, phase priority
5. **Generate Schedule**: Create DJ activity schedule
6. **Return**: Timeline with optimization score and suggestions

## Example Timeline Output

```
15:00 - 15:45  Ceremony (45 min)
15:45 - 16:00  [Buffer]
16:00 - 17:00  Cocktail Hour (60 min)
17:00 - 17:05  [Buffer]
17:05 - 17:20  Grand Entrance (15 min)
17:20 - 17:25  [Buffer]
17:25 - 17:55  Speeches & Toasts (30 min)
17:55 - 18:05  [Buffer]
18:05 - 19:05  Dinner (60 min)
19:05 - 19:10  [Buffer]
19:10 - 19:15  First Dance (5 min)
19:15 - 19:20  [Buffer]
19:20 - 22:20  Open Dance Floor (180 min)
22:20 - 22:35  [Buffer]
22:35 - 23:05  Special Performances (30 min)
23:05 - 23:15  [Buffer]
23:15 - 23:35  Final Moments (20 min)

Total: 8 hours 35 minutes
DJ Setup: 30 minutes before ceremony
DJ Breakdown: 15 minutes after final moment
```

## Optimization Suggestions Examples
- "Consider extending dancing to 120 min for better engagement"
- "Add brief performance between dinner and dancing for energy reset"
- "Ceremony is short (25 min) - consider 40+ min for full experience"

## Configuration Example
```typescript
const config = {
  eventType: "wedding",
  startTime: new Date("2026-06-15T15:00:00"),
  endTime: new Date("2026-06-15T23:30:00"),
  eventDuration: 510, // 8.5 hours
  guestCount: 150,
  venue: "Grand Ballroom, Johannesburg",
  hasSpecialPerformances: true,
  hasSpeeches: true,
  musicGenre: "Mixed/Upbeat",
  isSemiOutdoor: false,
};

const timeline = timelineEngine.generateTimeline(config, "event-123");
const optimized = timelineEngine.optimizeTimeline(timeline, {});
const djSchedule = timelineEngine.generateDjSchedule(timeline);
```

## Next Steps
1. Integrate timeline generation with Phase 1 AI Planner
2. Add timeline editor UI for custom adjustments
3. Store timelines in PostgreSQL (bk_timelines table)
4. Build Phase 5 (Event Visualization) - Avatar narrates timeline with visual scenes
