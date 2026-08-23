import type { AnalysisOption, ChoiceOption } from '@/views/(user)/map/types/smart-analysis.types'

/** A polygon needs at least this many points before it can be analysed. */
export const MIN_AREA_POINTS = 3

export const ANALYSIS_OPTIONS: AnalysisOption[] = [
  {
    key: 'business-suitability',
    title: 'Analyze Business Suitability in this Area',
    description: 'Check if this area is suitable for your planned business.',
  },
  {
    key: 'top-businesses',
    title: 'Find the Top 5 Best Businesses in this Area',
    description: 'Discover which types of businesses have the highest potential in the drawn area.',
  },
  {
    key: 'nearest-suppliers',
    title: 'Find the Nearest Suppliers',
    description: 'Locate suppliers near this area that match your business needs.',
  },
  {
    key: 'nearest-spaces',
    title: 'Find Nearest Space for Rent / Sale in the Area',
    description: 'Find available commercial spaces in or near the drawn area.',
  },
]

export const BUSINESS_CATEGORIES: ChoiceOption[] = [
  {
    value: 'food-beverage',
    label: 'Food & Beverage',
    description: 'Restaurants, cafes, food stalls, and beverage shops',
  },
  {
    value: 'retail-shopping',
    label: 'Retail & Shopping',
    description: 'Stores selling goods, clothing, electronics, and more',
  },
  {
    value: 'services-professional',
    label: 'Services & Professional',
    description: 'Professional services, consulting, and business solutions',
  },
  {
    value: 'health-wellness',
    label: 'Health & Wellness',
    description: 'Healthcare, fitness, beauty, and wellness services',
  },
  {
    value: 'automotive',
    label: 'Automotive',
    description: 'Car services, repair shops, and automotive businesses',
  },
  {
    value: 'education-training',
    label: 'Education & Training',
    description: 'Schools, training centers, and educational services',
  },
  {
    value: 'entertainment-recreation',
    label: 'Entertainment & Recreation',
    description: 'Entertainment venues, gaming, and recreational businesses',
  },
  {
    value: 'manufacturing-production',
    label: 'Manufacturing & Production',
    description: 'Manufacturing, production, and industrial businesses',
  },
  {
    value: 'technology-digital',
    label: 'Technology & Digital',
    description: 'Tech services, software, and digital businesses',
  },
  {
    value: 'construction-building',
    label: 'Construction & Building',
    description: 'Construction, building, and related services',
  },
]

export const INVESTMENT_SCALES: ChoiceOption[] = [
  {
    value: 'micro',
    label: 'Micro Enterprise',
    description: '₱10,000 – ₱100,000 · Sari-sari store, food stall, kiosk, load/bills station',
  },
  {
    value: 'small',
    label: 'Small Enterprise',
    description: '₱100,001 – ₱3,000,000 · Restaurant, boutique, salon, printing shop',
  },
  {
    value: 'medium',
    label: 'Medium Enterprise',
    description: '₱3,000,001 – ₱15,000,000 · Café chain, gym, pharmacy, function hall',
  },
  {
    value: 'large',
    label: 'Large Enterprise',
    description: '₱15,000,001 and above · Hotel, mall unit, hospital, supermarket',
  },
]

export const OPERATING_DAYS: ChoiceOption[] = [
  { value: 'weekdays', label: 'Weekdays', description: 'Monday – Friday' },
  { value: 'weekends', label: 'Weekends', description: 'Saturday – Sunday' },
  { value: 'six-days', label: '6 Days', description: 'Monday – Saturday' },
  { value: 'whole-week', label: 'Whole Week', description: 'Monday – Sunday' },
]

export const OPERATING_HOURS: ChoiceOption[] = [
  { value: 'morning', label: 'Morning Hours', description: '6:00 AM – 12:00 PM' },
  { value: 'business', label: 'Business Hours', description: '9:00 AM – 5:00 PM' },
  { value: 'extended', label: 'Extended Hours', description: '8:00 AM – 8:00 PM' },
  { value: 'evening', label: 'Evening Focus', description: '2:00 PM – 10:00 PM' },
  { value: 'nightlife', label: 'Bar / Nightlife', description: '6:00 PM – 2:00 AM' },
  { value: 'late-night', label: 'Late Night Club', description: '9:00 PM – 4:00 AM' },
  { value: 'full-day', label: 'Full Day', description: '6:00 AM – 10:00 PM' },
  { value: 'always-open', label: '24/7 Operation', description: 'Open 24 Hours' },
]

export const SPACE_INTENTS: ChoiceOption[] = [
  { value: 'rent', label: 'For Rent', description: 'Lease a commercial space in this area' },
  { value: 'sale', label: 'For Sale', description: 'Buy a commercial property in this area' },
]

export const SPACE_SIZES: ChoiceOption[] = [
  { value: 'under-20', label: 'Under 20 sqm', description: 'Kiosk / stall' },
  { value: '20-50', label: '20 – 50 sqm', description: 'Small shop' },
  { value: '51-100', label: '51 – 100 sqm', description: 'Medium space' },
  { value: '101-300', label: '101 – 300 sqm', description: 'Large commercial' },
  { value: '300-plus', label: '300 sqm and above', description: 'Warehouse / hall' },
]

/** Shown when the signed-in user has no city on their profile. */
export const DEFAULT_LOCATION_LABEL = 'Butuan City, Agusan del Norte'
