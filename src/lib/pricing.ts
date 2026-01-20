export interface EquipmentItem {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
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
  kidsCorner: boolean;
  kidsHours: number;
  travelDistance: number;
  discountPercent: number;
}

export const DJ_HOURLY_RATE = 800;
export const KIDS_CORNER_HOURLY_RATE = 500;
export const TRAVEL_RATE_PER_KM = 7.5;
export const FREE_TRAVEL_KM = 30;
export const OVERTIME_MULTIPLIER = 1.5;
export const DEPOSIT_PERCENT = 30;

export const EQUIPMENT_CATALOG: EquipmentItem[] = [
  // Speakers
  { id: 'partyrocker', name: 'Partyrocker 300W RMS', category: 'Speakers', description: '2 X 6 INCH DUAL SUB + TWEET', price: 650 },
  { id: 'boothSpeaker', name: 'Booth Speaker', category: 'Speakers', description: '2 X 3 INCH DUAL CONE', price: 350 },
  { id: 'subwoofer', name: '15" DBTECH Subwoofer 600W RMS', category: 'Speakers', description: '15 INCH WOOF', price: 1000 },
  
  // Mixers/Amplifiers
  { id: 'mixer', name: 'Professional Mixer', category: 'Mixers/Amplifiers', description: '4 channel', price: 400 },
  { id: 'amplifier', name: 'Amplifier', category: 'Mixers/Amplifiers', description: '4 channel', price: 600 },
  
  // Lighting
  { id: 'rgbStrobe', name: '5 Eye RGB LED Strobe', category: 'Lighting', description: 'Sound-Activated LED Strobe with Remote', price: 200 },
  { id: 'uvBar', name: 'UV Light Bar', category: 'Lighting', description: 'Ultraviolet light for stages and venues', price: 250 },
  { id: 'spiderHead', name: '8 Eye Spider Moving Head', category: 'Lighting', description: '9x10W LEDs with red/green lasers', price: 500 },
  { id: 'washHead', name: 'Wash Light Moving Head', category: 'Lighting', description: 'Wash light moving robotic head RGB', price: 400 },
  { id: 'rgbLaser', name: 'RGB Laser Combo Show', category: 'Lighting', description: 'Single Head Animation with DMX', price: 500 },
  { id: 'disco21', name: '21 Eye RGB LED UV Disco', category: 'Lighting', description: 'Voice-Activated, Sound-Synced', price: 350 },
  { id: 'moodLight', name: 'LED Mood Light', category: 'Lighting', description: 'Colourful up-lighter for décor', price: 140 },
  { id: 'laserBall', name: 'LED RGB Laser Disco Ball', category: 'Lighting', description: 'Ceiling Sound-Activated Projector', price: 100 },
  
  // Microphones
  { id: 'wirelessMic', name: 'Wireless Mic', category: 'Microphones', description: 'Wireless microphone', price: 250 },
  { id: 'wiredMic', name: 'Wired Mic', category: 'Microphones', description: 'Wired microphone', price: 180 },
  { id: 'twoWayRadio', name: '2 Way Radio', category: 'Microphones', description: 'Walkie Talkie for cueing/timing', price: 300 },
  
  // Effects
  { id: 'smokeMachine', name: 'Smoke Machine', category: 'Effects', description: 'Single burst, includes 250ml fluid', price: 400 },
  { id: 'lowFog', name: 'Low Fog Machine', category: 'Effects', description: 'Medium 25L, includes 2KG dry ice', price: 700 },
  { id: 'bubbleBlaster', name: 'Bubble Blaster', category: 'Effects', description: 'Small, includes 100ml fluid', price: 150 },
];

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

export function calculateQuote(data: QuoteData): {
  djCost: number;
  equipmentCost: number;
  kidsCost: number;
  subtotal: number;
  travelCost: number;
  discount: number;
  total: number;
  deposit: number;
  balance: number;
  hours: number;
} {
  const hours = calculateHours(data.startTime, data.endTime);
  
  // DJ cost
  const djCost = hours * DJ_HOURLY_RATE;
  
  // Equipment cost
  let equipmentCost = 0;
  EQUIPMENT_CATALOG.forEach(item => {
    const qty = data.equipment[item.id] || 0;
    equipmentCost += qty * item.price;
  });
  
  // Kids corner
  const kidsCost = data.kidsCorner ? data.kidsHours * KIDS_CORNER_HOURLY_RATE : 0;
  
  // Subtotal before travel and discount
  const subtotal = djCost + equipmentCost + kidsCost;
  
  // Travel cost
  const extraKm = Math.max(0, data.travelDistance - FREE_TRAVEL_KM);
  const travelCost = extraKm * TRAVEL_RATE_PER_KM;
  
  // Discount
  const discount = subtotal * (data.discountPercent / 100);
  
  // Total
  const total = subtotal + travelCost - discount;
  
  // Deposit
  const deposit = total * (DEPOSIT_PERCENT / 100);
  
  return {
    djCost,
    equipmentCost,
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
