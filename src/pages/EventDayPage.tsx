import { useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { EventDayCommandCenter } from '@/components/event-day/EventDayCommandCenter';
import { useState, useEffect } from 'react';
import { CinematicAmbient } from '@/components/CinematicAmbient';

export default function EventDayPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const { user } = useAuth();
  const [timelinePhases, setTimelinePhases] = useState([
    {
      id: 'phase-1',
      name: 'Ceremony',
      startTime: '15:00',
      duration: 45,
      description: 'Wedding ceremony begins',
      music: { title: 'Canon in D', artist: 'Johann Pachelbel', duration: 45 },
    },
    {
      id: 'phase-2',
      name: 'Cocktail Hour',
      startTime: '15:45',
      duration: 60,
      description: 'Guests enjoy cocktails and hors d\'oeuvres',
      music: { title: 'Jazz Background', artist: 'Various', duration: 60 },
    },
    {
      id: 'phase-3',
      name: 'Grand Entrance',
      startTime: '16:45',
      duration: 15,
      description: 'Couple enters the reception',
      music: { title: 'Celebration', artist: 'Kool & The Gang', duration: 3 },
    },
    {
      id: 'phase-4',
      name: 'Speeches',
      startTime: '17:00',
      duration: 45,
      description: 'Best man and maid of honor speeches',
      music: { title: 'Ambient Background', artist: 'Various', duration: 45 },
    },
    {
      id: 'phase-5',
      name: 'First Dance',
      startTime: '17:45',
      duration: 5,
      description: 'Bride and groom first dance',
      music: { title: 'Perfect', artist: 'Ed Sheeran', duration: 3 },
    },
    {
      id: 'phase-6',
      name: 'Dance Floor Opens',
      startTime: '17:50',
      duration: 240,
      description: 'Open dance floor for all guests',
      music: { title: 'Current Top Hits Mix', artist: 'DJ Mix', duration: 240 },
    },
  ]);

  if (!user) {
    return (
      <div className="cinematic-shell min-h-screen flex items-center justify-center">
        <CinematicAmbient intensity="soft" />
        <div className="text-center">
          <p className="text-xl text-muted-foreground">Please sign in to access event day command center.</p>
        </div>
      </div>
    );
  }

  if (!eventId) {
    return (
      <div className="cinematic-shell min-h-screen flex items-center justify-center">
        <CinematicAmbient intensity="soft" />
        <div className="text-center">
          <p className="text-xl text-muted-foreground">Event ID not found.</p>
        </div>
      </div>
    );
  }

  return <EventDayCommandCenter eventId={eventId} timelinePhases={timelinePhases} />;
}
