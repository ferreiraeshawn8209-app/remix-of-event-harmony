export interface EquipmentItem {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  image?: string;
}

export interface CustomLineItem {
  name: string;
  price: number;
  qty: number;
}

/** Outsourced extras (catering, tables, chairs, etc.) — pass-through cost, NEVER discounted. */
export interface ExtraLineItem {
  name: string;
  price: number;
  qty: number;
  supplier?: string;
}

export interface QuoteData {
  clientName: string;
  contactNo: string;
  email: string;
  venue: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  eventType: string;
  djName: string;
  equipment: { [key: string]: number };
  customItems: CustomLineItem[];
  extras: ExtraLineItem[];
  kidsCorner: boolean;
  kidsHours: number;
  humanJukebox: boolean;
  humanJukeboxHours: number;
  travelDistance: number;
  discountPercent: number;
}

export interface Package {
  id: string;
  name: string;
  category: 'wedding' | 'corporate' | 'party';
  description: string;
  price: number;
  includes: string[];
  popular?: boolean;
}

export const DJ_HOURLY_RATE = 800;
export const KIDS_CORNER_HOURLY_RATE = 500;
export const TRAVEL_RATE_PER_KM = 7.5;
export const FREE_TRAVEL_KM = 30;
export const OVERTIME_MULTIPLIER = 1.5;
export const DEPOSIT_PERCENT = 30;

export const EQUIPMENT_CATALOG: EquipmentItem[] = [
  // Speakers
  { 
    id: 'partyrocker', 
    name: 'Partyrocker 300W RMS', 
    category: 'Speakers', 
    description: '2 X 6 INCH DUAL SUB + TWEET - Perfect for small to medium venues with crystal-clear sound and deep bass', 
    price: 650,
    image: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=400&h=300&fit=crop'
  },
  { 
    id: 'boothSpeaker', 
    name: 'Booth Speaker', 
    category: 'Speakers', 
    description: '2 X 3 INCH DUAL CONE - Compact monitoring speaker ideal for DJ booth reference', 
    price: 350,
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop'
  },
  { 
    id: 'subwoofer', 
    name: '15" DBTECH Subwoofer 600W RMS', 
    category: 'Speakers', 
    description: '15 INCH WOOF - Thunderous bass that you can feel. Perfect for dance floors and large venues', 
    price: 1000,
    image: 'https://images.unsplash.com/photo-1593697821028-7cc59cfd7399?w=400&h=300&fit=crop'
  },
  
  // Mixers/Amplifiers
  { 
    id: 'mixer', 
    name: 'Professional Mixer', 
    category: 'Mixers/Amplifiers', 
    description: '4 channel professional mixer with EQ controls, effects, and seamless track transitions', 
    price: 400,
    image: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=400&h=300&fit=crop'
  },
  { 
    id: 'amplifier', 
    name: 'Amplifier', 
    category: 'Mixers/Amplifiers', 
    description: '4 channel power amplifier delivering clean, distortion-free sound to all speakers', 
    price: 600,
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop'
  },
  
  // Lighting
  { 
    id: 'rgbStrobe', 
    name: '5 Eye RGB LED Strobe', 
    category: 'Lighting', 
    description: 'Sound-Activated LED Strobe with Remote - Creates electrifying atmosphere with pulsing lights', 
    price: 200,
    image: 'https://images.unsplash.com/photo-1504509546545-e000b4a62425?w=400&h=300&fit=crop'
  },
  { 
    id: 'uvBar', 
    name: 'UV Light Bar', 
    category: 'Lighting', 
    description: 'Ultraviolet light for stages and venues - Makes whites glow and creates stunning visual effects', 
    price: 250,
    image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&h=300&fit=crop'
  },
  { 
    id: 'spiderHead', 
    name: '8 Eye Spider Moving Head', 
    category: 'Lighting', 
    description: '9x10W LEDs with red/green lasers - Professional moving head light with sweeping beams', 
    price: 500,
    image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=300&fit=crop'
  },
  { 
    id: 'washHead', 
    name: 'Wash Light Moving Head', 
    category: 'Lighting', 
    description: 'Wash light moving robotic head RGB - Floods the venue with smooth, blended colors', 
    price: 400,
    image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&h=300&fit=crop'
  },
  { 
    id: 'rgbLaser', 
    name: 'RGB Laser Combo Show', 
    category: 'Lighting', 
    description: 'Single Head Animation with DMX - Stunning laser patterns and animations for the ultimate show', 
    price: 500,
    image: 'https://images.unsplash.com/photo-1571266028243-e4733b0f0bb0?w=400&h=300&fit=crop'
  },
  { 
    id: 'disco21', 
    name: '21 Eye RGB LED UV Disco', 
    category: 'Lighting', 
    description: 'Voice-Activated, Sound-Synced - Mesmerizing disco effect that responds to the beat', 
    price: 350,
    image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&h=300&fit=crop'
  },
  { 
    id: 'moodLight', 
    name: 'LED Mood Light', 
    category: 'Lighting', 
    description: 'Colourful up-lighter for décor - Elegant ambient lighting to match your event theme', 
    price: 140,
    image: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=400&h=300&fit=crop'
  },
  { 
    id: 'laserBall', 
    name: 'LED RGB Laser Disco Ball', 
    category: 'Lighting', 
    description: 'Ceiling Sound-Activated Projector - Classic disco vibes with modern LED technology', 
    price: 100,
    image: 'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=400&h=300&fit=crop'
  },
  
  // Microphones
  { 
    id: 'wirelessMic', 
    name: 'Wireless Mic', 
    category: 'Microphones', 
    description: 'Professional wireless microphone - Freedom to move while making announcements or speeches', 
    price: 250,
    image: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=400&h=300&fit=crop'
  },
  { 
    id: 'wiredMic', 
    name: 'Wired Mic', 
    category: 'Microphones', 
    description: 'Reliable wired microphone - Crystal clear audio for speeches and announcements', 
    price: 180,
    image: 'https://images.unsplash.com/photo-1558470598-a5dda9640f68?w=400&h=300&fit=crop'
  },
  { 
    id: 'twoWayRadio', 
    name: '2 Way Radio', 
    category: 'Microphones', 
    description: 'Walkie Talkie for cueing/timing - Essential for coordinating with event planners and venues', 
    price: 300,
    image: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400&h=300&fit=crop'
  },
  
  // Effects
  { 
    id: 'smokeMachine', 
    name: 'Smoke Machine', 
    category: 'Effects', 
    description: 'Single burst, includes 250ml fluid - Creates dramatic atmosphere and enhances light beams', 
    price: 400,
    image: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=400&h=300&fit=crop'
  },
  { 
    id: 'lowFog', 
    name: 'Low Fog Machine', 
    category: 'Effects', 
    description: 'Medium 25L, includes 2KG dry ice - Magical floor-hugging fog for first dances and grand entrances', 
    price: 700,
    image: 'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=400&h=300&fit=crop'
  },
  { 
    id: 'bubbleBlaster', 
    name: 'Bubble Blaster', 
    category: 'Effects', 
    description: 'Small, includes 100ml fluid - Fun and whimsical bubbles for parties and celebrations', 
    price: 150,
    image: 'https://images.unsplash.com/photo-1528495612343-9ca9f4a4de28?w=400&h=300&fit=crop'
  },
];

// Wedding Packages
export const WEDDING_PACKAGES: Package[] = [
  {
    id: 'wedding-essential',
    name: 'Essential Wedding',
    category: 'wedding',
    description: 'Perfect for intimate weddings. Professional DJ service with all the essentials for your special day.',
    price: 8500,
    includes: [
      '5 hours DJ service',
      'Professional sound system (up to 100 guests)',
      'Basic lighting package',
      'Wireless microphone for speeches',
      'Wedding ceremony music',
      'MC services',
      'Consultation meeting',
    ],
  },
  {
    id: 'wedding-premium',
    name: 'Premium Wedding',
    category: 'wedding',
    description: 'The complete wedding experience. Enhanced sound, professional lighting, and dedicated coordination.',
    price: 15000,
    popular: true,
    includes: [
      '8 hours DJ service',
      'Premium sound system (up to 200 guests)',
      'Moving head lights & uplighting',
      '2 Wireless microphones',
      'Ceremony & reception music',
      'First dance spotlight',
      'Low fog machine for first dance',
      'Professional MC services',
      'Detailed planning consultation',
      'Backup equipment on-site',
    ],
  },
  {
    id: 'wedding-luxury',
    name: 'Luxury Wedding',
    category: 'wedding',
    description: 'The ultimate wedding celebration. No limits, no compromises. Your dream wedding soundscape.',
    price: 25000,
    includes: [
      '10+ hours DJ service',
      'Concert-grade sound (up to 400 guests)',
      'Full intelligent lighting rig',
      'LED dance floor lighting',
      'Laser show package',
      'Multiple wireless microphones',
      'All ceremony transitions',
      'Premium low fog effects',
      'Confetti/streamer cannons',
      'Dedicated event coordinator',
      '2 DJs available',
      'Kiddies corner entertainment',
      'After-party setup',
    ],
  },
];

// Corporate Packages
export const CORPORATE_PACKAGES: Package[] = [
  {
    id: 'corporate-basic',
    name: 'Corporate Basic',
    category: 'corporate',
    description: 'Professional background music and sound for corporate functions and networking events.',
    price: 6000,
    includes: [
      '4 hours service',
      'Professional sound system',
      'Background/ambient music',
      'Wireless microphone',
      'PA announcements',
      'Playlist customization',
    ],
  },
  {
    id: 'corporate-full',
    name: 'Corporate Full',
    category: 'corporate',
    description: 'Complete corporate event solution with entertainment and professional presentation support.',
    price: 12000,
    popular: true,
    includes: [
      '6 hours service',
      'Enhanced sound system',
      'Elegant lighting setup',
      '2 Wireless microphones',
      'Presentation audio support',
      'Award ceremony coordination',
      'Background to party transition',
      'Custom branded playlist',
      'Technical support included',
    ],
  },
  {
    id: 'corporate-gala',
    name: 'Corporate Gala',
    category: 'corporate',
    description: 'Premium gala and awards ceremony package with full production capabilities.',
    price: 20000,
    includes: [
      '8+ hours service',
      'Premium PA system',
      'Full stage lighting',
      'Multiple microphones',
      'Presentation/AV integration',
      'Awards ceremony support',
      'Walk-on music & fanfares',
      'Live mixing & mastering',
      'Dedicated technical crew',
      'Backup systems on-site',
    ],
  },
];

// Private Party Packages
export const PARTY_PACKAGES: Package[] = [
  {
    id: 'party-starter',
    name: 'Party Starter',
    category: 'party',
    description: 'Get the party started! Perfect for birthdays, house parties, and small celebrations.',
    price: 4500,
    includes: [
      '4 hours DJ service',
      'Party sound system',
      'LED party lights',
      'Smoke machine',
      'Playlist requests',
      'Games & activities',
    ],
  },
  {
    id: 'party-premium',
    name: 'Party Premium',
    category: 'party',
    description: 'Take your celebration to the next level with premium sound and effects.',
    price: 8000,
    popular: true,
    includes: [
      '6 hours DJ service',
      'Enhanced sound system',
      'Moving head lights',
      'Laser effects',
      'Smoke & bubble machines',
      'Wireless microphone',
      'MC services',
      'Interactive games',
      'Photo moment lighting',
    ],
  },
  {
    id: 'party-ultimate',
    name: 'Ultimate Party',
    category: 'party',
    description: 'The ultimate celebration experience. Club-quality production for your private event.',
    price: 14000,
    includes: [
      '8+ hours DJ service',
      'Club-grade sound system',
      'Full intelligent lighting',
      'Laser show',
      'All special effects',
      'Multiple microphones',
      'Professional MC',
      'Dance competitions',
      'Kiddies corner option',
      'After-party extension available',
    ],
  },
];

export const ALL_PACKAGES = [...WEDDING_PACKAGES, ...CORPORATE_PACKAGES, ...PARTY_PACKAGES];

export const EVENT_TYPES = [
  'Wedding',
  'Birthday Party',
  'Corporate Event',
  'Matric Dance',
  'Anniversary',
  'Graduation',
  'Other'
];

export const DJ_LIST = [
  'DJ Shawn-E-Shawn',
  'DJ BeatMaster',
  'DJ Kulture',
];

export function calculateHours(startTime: string, endTime: string): number {
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  
  let startMinutes = startHour * 60 + startMin;
  let endMinutes = endHour * 60 + endMin;
  
  // If end time is before start time, it's past midnight
  if (endMinutes <= startMinutes) {
    endMinutes += 24 * 60;
  }
  
  return (endMinutes - startMinutes) / 60;
}

export function calculateQuote(data: QuoteData, catalog?: EquipmentItem[], rates?: {
  dj_hourly_rate?: number;
  kids_corner_hourly_rate?: number;
  travel_rate_per_km?: number;
  free_travel_km?: number;
  deposit_percent?: number;
}): {
  djCost: number;
  equipmentCost: number;
  customItemsCost: number;
  extrasCost: number;
  kidsCost: number;
  subtotal: number;
  travelCost: number;
  discount: number;
  total: number;
  deposit: number;
  balance: number;
  hours: number;
} {
  const djRate = rates?.dj_hourly_rate ?? DJ_HOURLY_RATE;
  const kidsRate = rates?.kids_corner_hourly_rate ?? KIDS_CORNER_HOURLY_RATE;
  const travelRate = rates?.travel_rate_per_km ?? TRAVEL_RATE_PER_KM;
  const freeKm = rates?.free_travel_km ?? FREE_TRAVEL_KM;
  const depositPct = rates?.deposit_percent ?? DEPOSIT_PERCENT;

  const hours = calculateHours(data.startTime, data.endTime);
  
  // DJ cost
  const djCost = hours * djRate;
  
  // Equipment cost - use provided catalog or fallback to hardcoded
  const equipmentList = catalog || EQUIPMENT_CATALOG;
  let equipmentCost = 0;
  equipmentList.forEach(item => {
    const qty = data.equipment[item.id] || 0;
    equipmentCost += qty * item.price;
  });

  // Custom items cost (BeatKulture-supplied — discountable)
  const customItemsCost = (data.customItems || []).reduce(
    (sum, item) => sum + item.price * item.qty, 0
  );

  // Extras cost (OUTSOURCED — pass-through, NEVER discounted)
  const extrasCost = (data.extras || []).reduce(
    (sum, item) => sum + item.price * item.qty, 0
  );
  
  // Kids corner
  const kidsCost = data.kidsCorner ? data.kidsHours * kidsRate : 0;
  
  // Subtotal of DISCOUNTABLE items only (DJ + equipment + custom + kids)
  const subtotal = djCost + equipmentCost + customItemsCost + kidsCost;
  
  // Travel cost
  const extraKm = Math.max(0, data.travelDistance - freeKm);
  const travelCost = extraKm * travelRate;
  
  // Discount — applies ONLY to DJ/equipment/custom/kids subtotal, NOT to extras or travel
  const discount = subtotal * (data.discountPercent / 100);
  
  // Total — extras added AFTER discount as a pass-through line
  const total = subtotal + travelCost + extrasCost - discount;
  
  // Deposit
  const deposit = total * (depositPct / 100);
  
  return {
    djCost,
    equipmentCost,
    customItemsCost,
    extrasCost,
    kidsCost,
    subtotal,
    travelCost,
    discount,
    total,
    deposit,
    balance: total - deposit,
    hours,
  };
}


export function formatCurrency(amount: number): string {
  return `R ${amount.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
