import { Location } from '@/types/rbac';

export const MOCK_LOCATIONS: Location[] = [
  {
    id: 'abuja',
    name: 'Abuja International Airport',
    code: 'ABV',
    terminals: [
      {
        id: 'abv-t1',
        name: 'Terminal 1',
        zones: [
          { id: 'abv-t1-g1', name: 'Departure Gate A', status: 'green' },
          { id: 'abv-t1-l1', name: 'VIP Lounge', status: 'green' },
          { id: 'abv-t1-r1', name: 'Restroom - East Wing', status: 'red' },
          { id: 'abv-t1-s1', name: 'Security Checkpoint', status: 'yellow' },
        ],
      },
      {
        id: 'abv-t2',
        name: 'Terminal 2',
        zones: [
          { id: 'abv-t2-g1', name: 'Gate 1', status: 'green' },
          { id: 'abv-t2-b1', name: 'Baggage Claim', status: 'yellow' },
          { id: 'abv-t2-r1', name: 'Restroom - West', status: 'green' },
        ],
      },
    ],
  },
  {
    id: 'lagos',
    name: 'Lagos Murtala Muhammed International Airport',
    code: 'LOS',
    terminals: [
      {
        id: 'los-intl',
        name: 'International Terminal',
        zones: [
          { id: 'los-intl-g1', name: 'Gate 1', status: 'green' },
          { id: 'los-intl-b1', name: 'Baggage Area', status: 'yellow' },
          { id: 'los-intl-l1', name: 'VIP Lounge', status: 'green' },
        ],
      },
      {
        id: 'los-dom',
        name: 'Domestic Terminal',
        zones: [
          { id: 'los-dom-g1', name: 'Departure Hall', status: 'green' },
          { id: 'los-dom-s1', name: 'Security Area', status: 'red' },
        ],
      },
    ],
  },
  {
    id: 'kano',
    name: 'Kano Mallam Aminu International Airport',
    code: 'KAN',
    terminals: [
      {
        id: 'kan-t1',
        name: 'Main Terminal',
        zones: [
          { id: 'kan-t1-g1', name: 'Arrival Gate', status: 'green' },
          { id: 'kan-t1-r1', name: 'Restroom', status: 'yellow' },
        ],
      },
    ],
  },
  {
    id: 'port-harcourt',
    name: 'Port Harcourt International Airport',
    code: 'PHC',
    terminals: [
      {
        id: 'phc-t1',
        name: 'Terminal 1',
        zones: [
          { id: 'phc-t1-g1', name: 'Departure Gate', status: 'green' },
          { id: 'phc-t1-c1', name: 'Check-in Area', status: 'yellow' },
        ],
      },
    ],
  },
];

export const getLocationById = (id: string): Location | undefined => {
  return MOCK_LOCATIONS.find((loc) => loc.id === id);
};

export const getLocationName = (id: string): string => {
  const location = getLocationById(id);
  return location?.name || 'Unknown Location';
};