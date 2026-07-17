export interface WeeklyProgram {
  day: string;
  program: string;
  time: string;
  color: string;
  description: string;
  location: string;
}

export const WEEKLY_PROGRAMS: WeeklyProgram[] = [
  {
    day: 'Mon',
    program: "Enough is Enough Prayer Service",
    time: '6:00PM - 8:00PM',
    color: '#ea5252',
    description: 'Powerful prayer service seeking God\'s intervention and breakthrough. Bring your prayer requests.',
    location: 'Main Sanctuary'
  },
  {
    day: 'Wed',
    program: 'Bible Study',
    time: '6:00PM - 8:30PM',
    color: '#3d8d8f',
    description: 'Deep dive into Scripture with practical application for daily living. Grow in understanding God\'s Word.',
    location: 'Fellowship Hall'
  },
  {
    day: 'Thu',
    program: 'Worship Team Fellowship',
    time: '7:00PM - 9:00PM',
    color: '#d4a200',
    description: 'Worship practice and spiritual preparation. Develop your gifts and connect with fellow worshippers.',
    location: 'Worship Center'
  },
  {
    day: 'Fri',
    program: "Eagle's Friday Service",
    time: '6:00PM - 9:00PM',
    color: '#cd7423',
    description: 'Weekend kickoff with powerful worship, life-changing Word, and warm fellowship.',
    location: 'Main Sanctuary'
  },
  {
    day: 'Sat',
    program: 'Worship Team Fellowship',
    time: '6:00PM - 8:00PM',
    color: '#df4b4b',
    description: 'Weekend worship rehearsal and spiritual preparation for Sunday services.',
    location: 'Worship Center'
  },
  {
    day: 'Sun',
    program: 'Sunday Services',
    time: '7:30AM - 1:30PM',
    color: '#4c47c9',
    description: 'Multiple services featuring powerful worship, life-changing Word, and warm fellowship.',
    location: 'Main Sanctuary'
  },
];

export const PROGRAM_COLORS = {
  mon: '#ea5252',
  wed: '#3d8d8f',
  thu: '#d4a200',
  fri: '#cd7423',
  sat: '#df4b4b',
  sun: '#4c47c9',
} as const;