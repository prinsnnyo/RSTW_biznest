import type { Establishment, GeoPoint, RentalSpace, RegistrationTopic, Supplier } from '@/types/chatbot.types'

export const CITY_CENTER: GeoPoint = { lat: 8.9475, lng: 125.5406 }

export const NEW_BUSINESS_PERMIT_REQUIREMENTS_ANSWER =
  'Here are the requirements for a NEW business permit application (online):\n' +
  '- Locational sketch\n' +
  '- 1 set of SEC registration (for corporations)\n' +
  '- Certificate of Registration from the Cooperative Development Authority (if cooperative)\n' +
  '- Contract of lease (if the space is rented)\n' +
  '- Scanned copy of tax declaration\n' +
  '- City ENRO Certificate of Compliance (if the establishment generates noise during operation)\n' +
  '- Government-issued ID\n' +
  '- Fire Safety Inspection Certificate for Occupancy (except establishments using indigenous materials)'

export const RENEWAL_BUSINESS_PERMIT_REQUIREMENTS_ANSWER =
  'Here are the requirements for BUSINESS PERMIT RENEWAL (online):\n' +
  '- Business Permit Renewal Form (updating of business record)\n' +
  '- Previous business permit or any proof of payment\n' +
  '- 1 photocopy of audited financial statement, income tax return, monthly or quarterly value-added returns, or schedule of breakdown per LGU of gross sales/receipts from the consolidated financial statement\n' +
  '- Contract of lease (if the space is rented)\n' +
  '- Other requirements from national offices / government agencies / instrumentalities'

const UNSPLASH = (photoId: string): string =>
  `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=480&h=240&q=60`

export const RENTAL_SPACES: RentalSpace[] = [
  {
    id: 'rs-intino-1',
    name: 'RC Intino Building',
    barangay: 'Obrero',
    address: 'Montilla Blvd., Obrero',
    location: { lat: 8.94837, lng: 125.537574 },
    spaceType: 'retail',
    isAvailable: true,
    suitableFor: ['office', 'retail', 'commercial business', 'clinic', 'salon'],
    imageUrl: UNSPLASH('photo-1486406146926-c627a92ad1ab'),
    description:
      'Established commercial building along Montilla Boulevard with rentable spaces for offices and businesses.',
  },
  {
    id: 'rs-intino-2',
    name: 'RC Intino Building 2',
    barangay: 'Libertad',
    address: 'North Montilla Boulevard, Libertad',
    location: { lat: 8.956425, lng: 125.536026 },
    spaceType: 'office',
    isAvailable: true,
    suitableFor: ['office', 'retail', 'commercial business', 'tutorial center', 'printing services'],
    imageUrl: UNSPLASH('photo-1497366216548-37526070297c'),
    rating: 4.4,
    contactNumber: '0956 466 5774',
    description:
      'Has parking and affordable rental space suitable for offices and businesses.',
  },
  {
    id: 'rs-vcdu',
    name: 'VCDU Building',
    barangay: 'Obrero',
    address: 'Montilla Blvd., Obrero',
    location: { lat: 8.94504, lng: 125.5367 },
    spaceType: 'retail',
    isAvailable: true,
    suitableFor: ['retail', 'office', 'sari-sari store', 'pharmacy', 'clothing boutique'],
    imageUrl: UNSPLASH('photo-1441984904996-e0b6ba687e04'),
    rating: 4.0,
    description:
      'Multi-tenant building with multiple businesses occupying individual rental spaces (e.g., Door 2).',
  },
  {
    id: 'rs-sintrade',
    name: 'Sintrade Building',
    barangay: 'Obrero',
    address: '424 Villanueva Street, Obrero',
    location: { lat: 8.950299, lng: 125.541976 },
    spaceType: 'office',
    isAvailable: true,
    suitableFor: ['office', 'commercial business', 'printing services', 'electronics repair'],
    imageUrl: UNSPLASH('photo-1441986300917-64674bd600d8'),
    description:
      'Multi-tenant commercial/office building along Villanueva Street.',
  },
]

export const SUPPLIERS: Supplier[] = [
  {
    id: 'sup-1',
    name: 'Butuan Packaging Hub',
    category: 'packaging',
    barangay: 'Obrero',
    location: { lat: 8.9505, lng: 125.5401 },
    servesBusinessTypes: ['sari-sari store', 'grocery', 'bakery', 'restaurant', 'coffee shop'],
  },
  {
    id: 'sup-2',
    name: 'Agusan Fresh Produce Trading',
    category: 'fresh produce',
    barangay: 'Bonbon',
    location: { lat: 8.9538, lng: 125.5501 },
    servesBusinessTypes: ['restaurant', 'coffee shop', 'snack house', 'canteen'],
  },
  {
    id: 'sup-3',
    name: 'NorthMin Coffee Roasters',
    category: 'coffee supply',
    barangay: 'Libertad',
    location: { lat: 8.9575, lng: 125.5355 },
    servesBusinessTypes: ['coffee shop', 'milk tea shop', 'restaurant'],
  },
  {
    id: 'sup-4',
    name: 'Caraga Kitchen Equipment',
    category: 'kitchen equipment',
    barangay: 'San Vicente',
    location: { lat: 8.9425, lng: 125.547 },
    servesBusinessTypes: ['restaurant', 'coffee shop', 'bakery', 'food stall'],
  },
  {
    id: 'sup-5',
    name: 'One Stop Retail Wholesale',
    category: 'wholesale goods',
    barangay: 'Bayanihan',
    location: { lat: 8.9487, lng: 125.5445 },
    servesBusinessTypes: ['sari-sari store', 'pharmacy', 'clothing boutique', 'grocery'],
  },
  {
    id: 'sup-6',
    name: 'PrintPlus Supplies Depot',
    category: 'printing supplies',
    barangay: 'Libertad',
    location: { lat: 8.956, lng: 125.539 },
    servesBusinessTypes: ['printing services', 'tutorial center'],
  },
]

export const ESTABLISHMENTS: Establishment[] = [
  {
    id: 'est-1',
    name: 'Brew & Bean Café',
    category: 'coffee shop',
    barangay: 'Obrero',
    location: { lat: 8.9489, lng: 125.5421 },
    imageUrl: UNSPLASH('photo-1554118811-1e0d58224f24'),
  },
  {
    id: 'est-2',
    name: 'Highland Roast Coffee House',
    category: 'coffee shop',
    barangay: 'Libertad',
    location: { lat: 8.957, lng: 125.5368 },
    imageUrl: UNSPLASH('photo-1501339847302-ac426a4a7cbb'),
  },
  {
    id: 'est-3',
    name: 'Kapehan sa Riverside',
    category: 'coffee shop',
    barangay: 'Baan',
    location: { lat: 8.9447, lng: 125.5492 },
    imageUrl: UNSPLASH('photo-1495474472287-4d71bcdd2085'),
  },
  {
    id: 'est-4',
    name: 'Lutong Bahay Restaurant',
    category: 'restaurant',
    barangay: 'Bayanihan',
    location: { lat: 8.9498, lng: 125.5455 },
    imageUrl: UNSPLASH('photo-1517248135467-4c7edcad34c4'),
  },
  {
    id: 'est-5',
    name: 'Riverside Grill & Dine',
    category: 'restaurant',
    barangay: 'Baan',
    location: { lat: 8.9436, lng: 125.5498 },
    imageUrl: UNSPLASH('photo-1552566626-52f8b828add9'),
  },
  {
    id: 'est-6',
    name: 'Butuan City Department Store',
    category: 'department store',
    barangay: 'Obrero',
    location: { lat: 8.9502, lng: 125.5395 },
    imageUrl: UNSPLASH('photo-1519567241046-7f570eee3ce6'),
  },
  {
    id: 'est-7',
    name: 'Agusan Supermarket',
    category: 'grocery',
    barangay: 'Agusan Pequeño',
    location: { lat: 8.938, lng: 125.531 },
    imageUrl: UNSPLASH('photo-1542838132-92c53300491e'),
  },
  {
    id: 'est-8',
    name: 'Southside Pharmacy',
    category: 'pharmacy',
    barangay: 'San Vicente',
    location: { lat: 8.9418, lng: 125.5443 },
    imageUrl: UNSPLASH('photo-1587854692152-cbe660dbde88'),
  },
  {
    id: 'est-9',
    name: 'Gaisano Department Store',
    category: 'department store',
    barangay: 'Bayanihan',
    location: { lat: 8.9481, lng: 125.5448 },
    imageUrl: UNSPLASH('photo-1472851294608-062f824d29cc'),
  },
  {
    id: 'est-10',
    name: 'Morning Brew Kapehan',
    category: 'coffee shop',
    barangay: 'Ambago',
    location: { lat: 8.9595, lng: 125.5455 },
    imageUrl: UNSPLASH('photo-1447933601403-0c6688de566e'),
  },
]

export const REGISTRATION_TOPICS: RegistrationTopic[] = [
  {
    id: 'reg-1',
    keywords: ['dti', 'business name', 'register business name', 'registration', 'bnrs'],
    question: 'How do I register my business name with the DTI?',
    answer:
      'Register your business name with the DTI through the BNRS (bnrs.dti.gov.ph) or any DTI office. Bring a valid ID and your proposed business name. The certificate of business name registration is valid for 5 years and is required before securing a mayor\'s permit.',
  },
  {
    id: 'reg-2',
    keywords: ['mayor', 'mayors permit', "mayor's permit", 'business permit', 'city hall'],
    question: 'How do I get a mayor\'s / business permit?',
    answer:
      'Apply for a mayor\'s permit at the City Hall Business Permits and Licensing Office after DTI registration. Typical requirements: DTI certificate, barangay clearance, zoning clearance, occupancy permit, community tax certificate, and public liability insurance for certain businesses. Renew every January 20.',
  },
  {
    id: 'reg-3',
    keywords: ['barangay clearance', 'barangay requirement', 'brgy clearance'],
    question: 'How do I get a barangay clearance?',
    answer:
      'Go to the barangay hall where your business will operate. Bring your DTI certificate, a valid ID, and pay the clearance fee. Some barangays require a short inspection of the site before releasing the clearance.',
  },
  {
    id: 'reg-4',
    keywords: ['bir', 'tax', 'tin', 'official receipt', 'invoice'],
    question: 'What are the BIR requirements for a new business?',
    answer:
      'After getting your mayor\'s permit, register with the BIR RDO having jurisdiction over your location within 30 days. Requirements: filled-out BIR Form 1901, mayor\'s permit, DTI certificate, valid ID, and proof of address. You will receive your TIN, then register your books of accounts, official receipts/invoices, and pay the annual registration fee.',
  },
  {
    id: 'reg-5',
    keywords: ['zoning', 'location clearance', 'cenro', 'locational'],
    question: 'Do I need a zoning or locational clearance?',
    answer:
      'Yes. Secure a zoning/locational clearance from the City Planning and Development Office (or CENRO) to confirm your business activity is allowed in that area\'s land-use classification. This is required before the mayor\'s permit is released.',
  },
  {
    id: 'reg-6',
    keywords: ['sss', 'philhealth', 'pag-ibig', 'employees', 'hiring', 'benefits'],
    question: 'What should I do if I plan to hire employees?',
    answer:
      'Register your business with SSS, PhilHealth, and Pag-IBIG as an employer within 30 days of hiring your first employee. You and your employees contribute monthly; remittances are required to keep your permits in good standing.',
  },
  {
    id: 'reg-7',
    keywords: ['renew', 'renewal', 'penalty', 'deadline', 'january'],
    question: 'When and how do I renew my business permits?',
    answer:
      'Renew your mayor\'s permit and barangay clearance annually on or before January 20. Late renewal incurs surcharges and penalties that grow over time, so renew early. BIR registration renews via the annual registration fee every January 31.',
  },
  {
    id: 'reg-8',
    keywords: ['requirement', 'requirements', 'documents', 'checklist', 'start business'],
    question: 'What are the overall requirements to start a business?',
    answer:
      'General checklist: (1) DTI business name registration, (2) barangay clearance, (3) zoning/locational clearance, (4) mayor\'s/business permit, (5) BIR registration, and (6) SSS/PhilHealth/Pag-IBIG employer registration if hiring. Food businesses also need sanitary permits from the City Health Office.',
  },
]
