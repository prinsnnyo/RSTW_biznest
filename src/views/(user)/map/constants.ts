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


/**
 * Business types per category. Picking a category swaps this list, so the
 * second question always narrows the first.
 */
export const BUSINESS_TYPES_BY_CATEGORY: Record<string, ChoiceOption[]> = {
  'food-beverage': [
    { value: 'restaurant', label: 'Restaurant', description: '' },
    { value: 'fast-food', label: 'Fast Food', description: '' },
    { value: 'food-stall-carinderia', label: 'Food Stall / Carinderia', description: '' },
    { value: 'caf-coffee-shop', label: 'Café / Coffee Shop', description: '' },
    { value: 'bakery', label: 'Bakery', description: '' },
    { value: 'milk-tea-beverage-shop', label: 'Milk Tea / Beverage Shop', description: '' },
    { value: 'bbq-grill', label: 'BBQ / Grill', description: '' },
    { value: 'catering-services', label: 'Catering Services', description: '' },
    { value: 'sari-sari-store', label: 'Sari-sari Store', description: '' },
    { value: 'fruit-stand', label: 'Fruit Stand', description: '' },
  ],
  'retail-shopping': [
    { value: 'clothing-apparel-store', label: 'Clothing / Apparel Store', description: '' },
    { value: 'grocery-minimart', label: 'Grocery / Minimart', description: '' },
    { value: 'electronics-shop', label: 'Electronics Shop', description: '' },
    { value: 'hardware-store', label: 'Hardware Store', description: '' },
    { value: 'bookstore-school-supplies', label: 'Bookstore / School Supplies', description: '' },
    { value: 'pharmacy-drugstore', label: 'Pharmacy / Drugstore', description: '' },
    { value: 'gift-shop-souvenir', label: 'Gift Shop / Souvenir', description: '' },
    { value: 'furniture-store', label: 'Furniture Store', description: '' },
    { value: 'footwear-shop', label: 'Footwear Shop', description: '' },
    { value: 'appliance-store', label: 'Appliance Store', description: '' },
  ],
  'services-professional': [
    { value: 'printing-photocopy-shop', label: 'Printing / Photocopy Shop', description: '' },
    { value: 'travel-agency', label: 'Travel Agency', description: '' },
    { value: 'pawnshop', label: 'Pawnshop', description: '' },
    { value: 'money-remittance', label: 'Money Remittance', description: '' },
    { value: 'insurance-agency', label: 'Insurance Agency', description: '' },
    { value: 'accounting-tax-service', label: 'Accounting / Tax Service', description: '' },
    { value: 'legal-services-notary', label: 'Legal Services / Notary', description: '' },
    { value: 'advertising-agency', label: 'Advertising Agency', description: '' },
    { value: 'hr-staffing-agency', label: 'HR / Staffing Agency', description: '' },
    { value: 'event-coordination', label: 'Event Coordination', description: '' },
  ],
  'health-wellness': [
    { value: 'medical-clinic', label: 'Medical Clinic', description: '' },
    { value: 'dental-clinic', label: 'Dental Clinic', description: '' },
    { value: 'pharmacy', label: 'Pharmacy', description: '' },
    { value: 'gym-fitness-center', label: 'Gym / Fitness Center', description: '' },
    { value: 'salon-barbershop', label: 'Salon / Barbershop', description: '' },
    { value: 'spa-and-massage', label: 'Spa & Massage', description: '' },
    { value: 'optical-clinic', label: 'Optical Clinic', description: '' },
    { value: 'veterinary-clinic', label: 'Veterinary Clinic', description: '' },
    { value: 'dialysis-center', label: 'Dialysis Center', description: '' },
    { value: 'wellness-yoga-studio', label: 'Wellness / Yoga Studio', description: '' },
  ],
  'automotive': [
    { value: 'auto-repair-shop', label: 'Auto Repair Shop', description: '' },
    { value: 'car-wash', label: 'Car Wash', description: '' },
    { value: 'vulcanizing-tire-shop', label: 'Vulcanizing / Tire Shop', description: '' },
    { value: 'auto-parts-store', label: 'Auto Parts Store', description: '' },
    { value: 'motor-motorcycle-shop', label: 'Motor / Motorcycle Shop', description: '' },
    { value: 'car-accessories-store', label: 'Car Accessories Store', description: '' },
    { value: 'towing-service', label: 'Towing Service', description: '' },
    { value: 'driving-school', label: 'Driving School', description: '' },
    { value: 'auto-detailing', label: 'Auto Detailing', description: '' },
    { value: 'trucking-hauling', label: 'Trucking / Hauling', description: '' },
  ],
  'education-training': [
    { value: 'tutorial-center', label: 'Tutorial Center', description: '' },
    { value: 'daycare-preschool', label: 'Daycare / Preschool', description: '' },
    { value: 'review-center', label: 'Review Center', description: '' },
    { value: 'vocational-tech-school', label: 'Vocational / Tech School', description: '' },
    { value: 'language-school', label: 'Language School', description: '' },
    { value: 'music-arts-school', label: 'Music / Arts School', description: '' },
    { value: 'driving-school', label: 'Driving School', description: '' },
    { value: 'online-e-learning-center', label: 'Online / E-learning Center', description: '' },
    { value: 'child-development-center', label: 'Child Development Center', description: '' },
    { value: 'skills-training-center', label: 'Skills Training Center', description: '' },
  ],
  'entertainment-recreation': [
    { value: 'videoke-ktv-bar', label: 'Videoke / KTV Bar', description: '' },
    { value: 'billiards-hall', label: 'Billiards Hall', description: '' },
    { value: 'gaming-internet-caf', label: 'Gaming / Internet Café', description: '' },
    { value: 'movie-cinema', label: 'Movie / Cinema', description: '' },
    { value: 'bowling-alley', label: 'Bowling Alley', description: '' },
    { value: 'sports-complex', label: 'Sports Complex', description: '' },
    { value: 'escape-room', label: 'Escape Room', description: '' },
    { value: 'events-place-function-hall', label: 'Events Place / Function Hall', description: '' },
    { value: 'resort-swimming-pool', label: 'Resort / Swimming Pool', description: '' },
    { value: 'amusement-arcade', label: 'Amusement Arcade', description: '' },
  ],
  'manufacturing-production': [
    { value: 'food-processing', label: 'Food Processing', description: '' },
    { value: 'furniture-making', label: 'Furniture Making', description: '' },
    { value: 'garments-sewing', label: 'Garments / Sewing', description: '' },
    { value: 'metal-fabrication', label: 'Metal Fabrication', description: '' },
    { value: 'hollow-blocks-construction-materials', label: 'Hollow Blocks / Construction Materials', description: '' },
    { value: 'printing-press', label: 'Printing Press', description: '' },
    { value: 'soap-detergent-production', label: 'Soap / Detergent Production', description: '' },
    { value: 'candle-making', label: 'Candle Making', description: '' },
    { value: 'water-refilling-station', label: 'Water Refilling Station', description: '' },
    { value: 'ice-plant', label: 'Ice Plant', description: '' },
  ],
  'technology-digital': [
    { value: 'it-services-computer-repair', label: 'IT Services / Computer Repair', description: '' },
    { value: 'software-development', label: 'Software Development', description: '' },
    { value: 'cctv-security-installation', label: 'CCTV / Security Installation', description: '' },
    { value: 'web-design-studio', label: 'Web Design Studio', description: '' },
    { value: 'digital-marketing-agency', label: 'Digital Marketing Agency', description: '' },
    { value: 'electronics-repair', label: 'Electronics Repair', description: '' },
    { value: 'mobile-phone-shop-and-repair', label: 'Mobile Phone Shop & Repair', description: '' },
    { value: 'bpo-call-center', label: 'BPO / Call Center', description: '' },
    { value: 'drone-services', label: 'Drone Services', description: '' },
    { value: 'smart-home-installation', label: 'Smart Home Installation', description: '' },
  ],
  'construction-building': [
    { value: 'general-contractor', label: 'General Contractor', description: '' },
    { value: 'electrical-contractor', label: 'Electrical Contractor', description: '' },
    { value: 'plumbing-services', label: 'Plumbing Services', description: '' },
    { value: 'painting-services', label: 'Painting Services', description: '' },
    { value: 'interior-design', label: 'Interior Design', description: '' },
    { value: 'landscaping', label: 'Landscaping', description: '' },
    { value: 'steel-fabrication-works', label: 'Steel / Fabrication Works', description: '' },
    { value: 'roofing-services', label: 'Roofing Services', description: '' },
    { value: 'masonry-carpentry', label: 'Masonry / Carpentry', description: '' },
    { value: 'equipment-rental', label: 'Equipment Rental', description: '' },
  ],
}

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
