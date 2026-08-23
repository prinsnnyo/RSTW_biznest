// Static candidate catalogue for the "Top 5 Best Businesses" analysis, grouped
// by investment scale so a micro budget never gets ranked against a hotel.
// Everything here is authored reference data for Butuan City — no live records.
import type {
  CompetitionLevel,
  DemandLevel,
  ReportMetric,
} from '@/types/smart-analysis.types'

export interface CatalogEntry {
  name: string
  categoryLabel: string
  /** Nudges the seeded score so obviously strong fits rank near the top. */
  baseScore: number
  demand: DemandLevel
  competition: CompetitionLevel
  rationale: string
  economics: ReportMetric[]
  poi: string[]
  competitors: string[]
  competitorNote: string
  spaceSizes: string[]
  suppliers: string[]
}

export const BUSINESS_CATALOG: Record<string, CatalogEntry[]> = {
  micro: [
    {
      name: 'Sari-sari Store / Mini Grocery',
      categoryLabel: 'Retail & Shopping',
      baseScore: 94,
      demand: 'Very High',
      competition: 'Moderate',
      rationale:
        'Highest demand in any residential-commercial mix area. Low startup cost, consistent daily revenue, and a very low competition threshold make this the most viable business in the drawn area.',
      economics: [
        { label: 'Startup capital', value: '₱25,000 – ₱90,000' },
        { label: 'Monthly revenue', value: '₱35,000 – ₱90,000' },
        { label: 'Break-even', value: '3 – 6 months' },
        { label: 'Staffing', value: 'Owner-operated, 0 – 1 helper' },
      ],
      poi: [
        'Residential clusters (within 200 m)',
        'Barangay hall or covered court (within 400 m)',
        'Tricycle terminal or jeepney stop',
        'Elementary school (within 500 m)',
      ],
      competitors: [
        'Existing neighbourhood sari-sari stores (3 – 6 within 300 m)',
        'Mini grocery on the main road',
        'Rolling vendors serving the same street',
      ],
      competitorNote:
        'Density is high but catchment is street-level — customers rarely walk past two corners. Stock depth and store hours differentiate more than price.',
      spaceSizes: [
        'Home frontage conversion (4 – 10 sqm)',
        'Detached kiosk (6 – 12 sqm)',
        'Inline unit with storage (12 – 25 sqm)',
      ],
      suppliers: [
        'Butuan City Public Market (dry goods)',
        'JC Trading (canned goods, condiments)',
        'Local softdrink and bread distributors (route delivery)',
      ],
    },
    {
      name: 'Food Stall / Carinderia',
      categoryLabel: 'Food & Beverage',
      baseScore: 91,
      demand: 'Very High',
      competition: 'Dense',
      rationale:
        'Food businesses consistently rank highest in Philippine urban districts. The area shows strong lunch and dinner foot traffic, proximity to workers and students, and limited sit-down dining options — all strong indicators of high carinderia viability.',
      economics: [
        { label: 'Startup capital', value: '₱40,000 – ₱100,000' },
        { label: 'Monthly revenue', value: '₱60,000 – ₱150,000' },
        { label: 'Break-even', value: '4 – 8 months' },
        { label: 'Staffing', value: '2 – 3 including cook' },
      ],
      poi: [
        'Public Market (within 500 m)',
        'Government office or school (within 400 m)',
        'Jeepney / tricycle terminal',
        'Commercial row',
      ],
      competitors: [
        'Public Market carinderia row (10+ stalls)',
        'Roadside food vendors within the area',
        'Local rice-meal and hotdog stalls',
      ],
      competitorNote:
        'Competition is dense but demand outpaces supply at peak meal hours (7–9 AM, 12–1 PM, 5–7 PM). A distinct menu or a visibly cleaner setup differentiates well.',
      spaceSizes: [
        'Market stall (6 – 20 sqm)',
        'Inline shophouse unit (20 – 40 sqm)',
        'Roadside awning extension (10 – 15 sqm)',
      ],
      suppliers: [
        'Butuan City Public Market (fresh produce, meat)',
        'Abattoir and cold storage nearby',
        'JC Trading (dry goods, condiments)',
      ],
    },
    {
      name: 'Loading / Bills Payment Station',
      categoryLabel: 'Services & Professional',
      baseScore: 86,
      demand: 'High',
      competition: 'Low',
      rationale:
        'With near-universal mobile phone usage and cashless adoption still growing in Butuan, loading and bills payment stations remain high-demand service businesses. The area shows a residential-commercial mix with limited bank and payment infrastructure nearby — a clear gap this business fills profitably.',
      economics: [
        { label: 'Startup capital', value: '₱15,000 – ₱60,000' },
        { label: 'Monthly revenue', value: '₱18,000 – ₱55,000' },
        { label: 'Break-even', value: '2 – 5 months' },
        { label: 'Staffing', value: 'Owner-operated' },
      ],
      poi: [
        'Residential clusters with no bank within 1 km',
        'Barangay hall (within 400 m)',
        'Transport terminal',
        'Sari-sari store cluster (walk-in spillover)',
      ],
      competitors: [
        'Sari-sari stores offering load as a sideline (4 – 8 nearby)',
        'One padala / remittance counter on the main road',
        'Mobile wallet cash-in agents',
      ],
      competitorNote:
        'Most competitors treat this as a sideline. A dedicated counter with reliable float and longer hours captures the overflow.',
      spaceSizes: [
        'Counter-only kiosk (3 – 6 sqm)',
        'Shared frontage with an existing store (4 – 8 sqm)',
        'Small inline unit (8 – 15 sqm)',
      ],
      suppliers: [
        'Telco distributor branches in Butuan City',
        'Payment aggregator partner onboarding',
        'Local bank cash-management counter',
      ],
    },
    {
      name: 'BBQ / Grill Stand',
      categoryLabel: 'Food & Beverage',
      baseScore: 83,
      demand: 'High',
      competition: 'Moderate',
      rationale:
        'Evening street food performs strongly where residential density meets a commercial strip. Low equipment cost and cash-only operation keep working capital light.',
      economics: [
        { label: 'Startup capital', value: '₱18,000 – ₱55,000' },
        { label: 'Monthly revenue', value: '₱30,000 – ₱80,000' },
        { label: 'Break-even', value: '2 – 4 months' },
        { label: 'Staffing', value: '1 – 2 including griller' },
      ],
      poi: [
        'Residential clusters (within 300 m)',
        'Videoke or beverage outlets nearby',
        'Evening commercial strip',
        'Transport terminal with late traffic',
      ],
      competitors: [
        'Evening BBQ vendors on the same strip (2 – 4)',
        'Carinderias serving takeout after 5 PM',
        'Convenience-store hot food counters',
      ],
      competitorNote:
        'Evening trade is fragmented. Consistent opening time and marinade quality drive repeat customers more than location.',
      spaceSizes: [
        'Pushcart or mobile stand (2 – 5 sqm)',
        'Fixed roadside stall (6 – 12 sqm)',
        'Awning extension with seating (10 – 20 sqm)',
      ],
      suppliers: [
        'Butuan City abattoir (pork, chicken)',
        'Public Market condiment wholesalers',
        'Local charcoal and LPG distributors',
      ],
    },
    {
      name: 'Fruit & Vegetable Stand',
      categoryLabel: 'Food & Beverage',
      baseScore: 78,
      demand: 'High',
      competition: 'Dense',
      rationale:
        'Fresh produce turns over daily in residential catchments. Caraga supply lines keep sourcing costs low, though spoilage discipline determines margin.',
      economics: [
        { label: 'Startup capital', value: '₱12,000 – ₱45,000' },
        { label: 'Monthly revenue', value: '₱25,000 – ₱65,000' },
        { label: 'Break-even', value: '2 – 4 months' },
        { label: 'Staffing', value: 'Owner-operated' },
      ],
      poi: [
        'Residential clusters (within 250 m)',
        'Public Market overflow traffic',
        'School gate traffic',
        'Church or covered court',
      ],
      competitors: [
        'Public Market produce section',
        'Roving vegetable vendors (2 – 5 daily)',
        'Mini grocery produce shelves',
      ],
      competitorNote:
        'Price is set by the market; convenience and freshness win. Morning-only operation lowers spoilage exposure.',
      spaceSizes: [
        'Table stand (3 – 6 sqm)',
        'Covered roadside stall (6 – 15 sqm)',
        'Market stall lease (6 – 12 sqm)',
      ],
      suppliers: [
        'Butuan City Public Market bagsakan',
        'Agusan del Norte farm consolidators',
        'Cold storage for short-hold stock',
      ],
    },
    {
      name: 'Barbershop / Basic Salon',
      categoryLabel: 'Health & Wellness',
      baseScore: 75,
      demand: 'Moderate',
      competition: 'Moderate',
      rationale:
        'Grooming is a recurring, recession-resistant service. Weekend peaks align with residential catchments and the fit-out cost is modest.',
      economics: [
        { label: 'Startup capital', value: '₱35,000 – ₱95,000' },
        { label: 'Monthly revenue', value: '₱25,000 – ₱60,000' },
        { label: 'Break-even', value: '5 – 9 months' },
        { label: 'Staffing', value: '1 – 3 barbers' },
      ],
      poi: [
        'Residential clusters (within 400 m)',
        'School or campus (within 600 m)',
        'Commercial row frontage',
        'Transport terminal',
      ],
      competitors: [
        'Neighbourhood barbershops (2 – 5 within 500 m)',
        'Home-based haircutting services',
        'Full salons on the main road',
      ],
      competitorNote:
        'Loyalty follows the barber, not the shop. Retaining skilled staff matters more than the location itself.',
      spaceSizes: [
        'Two-chair shop (10 – 18 sqm)',
        'Four-chair inline unit (18 – 35 sqm)',
        'Shared frontage arrangement (8 – 12 sqm)',
      ],
      suppliers: [
        'Butuan beauty-supply distributors',
        'Equipment dealers along J.C. Aquino Avenue',
        'Online consumables wholesalers',
      ],
    },
  ],

  small: [
    {
      name: 'Milk Tea / Beverage Shop',
      categoryLabel: 'Food & Beverage',
      baseScore: 92,
      demand: 'Very High',
      competition: 'Moderate',
      rationale:
        'The youth and working-age population in Butuan City drives consistent demand for trendy beverages. The area shows high student and young-professional foot traffic, a CLUP-permitted commercial zone, and available kiosk spaces below ₱12,000 per month — an ideal entry point for a beverage brand.',
      economics: [
        { label: 'Startup capital', value: '₱250,000 – ₱850,000' },
        { label: 'Monthly revenue', value: '₱120,000 – ₱380,000' },
        { label: 'Break-even', value: '8 – 14 months' },
        { label: 'Staffing', value: '3 – 5 crew' },
      ],
      poi: [
        'Campus or senior high school (within 400 m)',
        'Office and BPO cluster (within 600 m)',
        'Commercial row with evening traffic',
        'Cinema or mall entrance',
      ],
      competitors: [
        'National milk tea chains (1 – 3 within 800 m)',
        'Independent beverage kiosks (2 – 4)',
        'Coffee shops serving cold drinks',
      ],
      competitorNote:
        'The category is crowded but demand keeps expanding. Signature drinks, seating comfort and delivery-app presence separate the survivors.',
      spaceSizes: [
        'Mall or plaza kiosk (8 – 15 sqm)',
        'Inline shop with counter seating (25 – 45 sqm)',
        'Corner unit with outdoor seating (45 – 70 sqm)',
      ],
      suppliers: [
        'Manila-based tea and syrup importers (weekly freight)',
        'Local dairy and ice distributors',
        'Packaging wholesalers in Butuan City',
      ],
    },
    {
      name: 'Pharmacy / Drugstore',
      categoryLabel: 'Health & Wellness',
      baseScore: 89,
      demand: 'Very High',
      competition: 'Moderate',
      rationale:
        'Healthcare demand in Butuan is rising. Proximity to hospitals, clinics and a large residential population creates sustained daily demand. Pharmacies have low inventory spoilage and strong repeat-customer rates — one of the most recession-proof retail categories.',
      economics: [
        { label: 'Startup capital', value: '₱600,000 – ₱2,200,000' },
        { label: 'Monthly revenue', value: '₱250,000 – ₱700,000' },
        { label: 'Break-even', value: '12 – 20 months' },
        { label: 'Staffing', value: '2 – 4 incl. licensed pharmacist' },
      ],
      poi: [
        'Hospital or diagnostic centre (within 800 m)',
        'Medical and dental clinics (within 500 m)',
        'Dense residential catchment',
        'Public Market foot traffic',
      ],
      competitors: [
        'National drugstore chains (1 – 3 within 1 km)',
        'Independent botica outlets (2 – 4)',
        'Clinic-attached dispensaries',
      ],
      competitorNote:
        'Chains win on price; independents win on stock availability of maintenance medicines and on longer opening hours.',
      spaceSizes: [
        'Inline retail unit (25 – 45 sqm)',
        'Corner unit with consultation nook (45 – 80 sqm)',
        'Hospital-adjacent stall (15 – 30 sqm)',
      ],
      suppliers: [
        'Regional pharmaceutical distributors (Cagayan de Oro routes)',
        'Generic-medicine consolidators',
        'FDA-licensed local wholesalers',
      ],
    },
    {
      name: 'Water Refilling Station',
      categoryLabel: 'Manufacturing & Production',
      baseScore: 85,
      demand: 'High',
      competition: 'Low',
      rationale:
        'Piped-water quality concerns keep refilling demand steady across Butuan barangays. Recurring household subscriptions make revenue unusually predictable for the capital involved.',
      economics: [
        { label: 'Startup capital', value: '₱400,000 – ₱1,200,000' },
        { label: 'Monthly revenue', value: '₱90,000 – ₱220,000' },
        { label: 'Break-even', value: '10 – 18 months' },
        { label: 'Staffing', value: '2 – 4 incl. delivery rider' },
      ],
      poi: [
        'Dense residential subdivisions (within 800 m)',
        'Boarding houses and dormitories',
        'Small eateries and offices',
        'Barangay hall',
      ],
      competitors: [
        'Existing refilling stations (1 – 3 within 1.5 km)',
        'Branded bottled-water delivery',
        'Household filtration units',
      ],
      competitorNote:
        'Competition is thin outside the city core. Delivery reliability and container hygiene certification are the real differentiators.',
      spaceSizes: [
        'Standard station with delivery bay (35 – 60 sqm)',
        'Station plus storage yard (60 – 100 sqm)',
        'Compact inline station (25 – 40 sqm)',
      ],
      suppliers: [
        'Filtration equipment dealers in Butuan City',
        'Container and cap wholesalers',
        'Accredited water-testing laboratory',
      ],
    },
    {
      name: 'Printing / Photocopy Shop',
      categoryLabel: 'Services & Professional',
      baseScore: 81,
      demand: 'High',
      competition: 'Dense',
      rationale:
        'School and government document demand is constant in this catchment. Equipment is the main cost and it holds resale value, which lowers downside risk.',
      economics: [
        { label: 'Startup capital', value: '₱180,000 – ₱700,000' },
        { label: 'Monthly revenue', value: '₱70,000 – ₱190,000' },
        { label: 'Break-even', value: '8 – 15 months' },
        { label: 'Staffing', value: '2 – 3 operators' },
      ],
      poi: [
        'School or university (within 400 m)',
        'Government offices (within 600 m)',
        'Law and accounting offices',
        'Commercial row',
      ],
      competitors: [
        'Campus-adjacent photocopy shops (3 – 6)',
        'Full-service printing presses',
        'Online print-on-demand services',
      ],
      competitorNote:
        'Volume photocopying is commoditised. Layout, tarpaulin and same-day binding services carry the margin.',
      spaceSizes: [
        'Counter shop (12 – 25 sqm)',
        'Shop with layout station (25 – 45 sqm)',
        'Corner unit with tarpaulin printer (45 – 70 sqm)',
      ],
      suppliers: [
        'Toner and paper wholesalers in Butuan City',
        'Large-format ink distributors',
        'Equipment service contractors',
      ],
    },
    {
      name: 'Grocery / Minimart',
      categoryLabel: 'Retail & Shopping',
      baseScore: 79,
      demand: 'High',
      competition: 'Dense',
      rationale:
        'A residential-commercial mix supports a mid-sized grocery. Working capital is the binding constraint, not demand.',
      economics: [
        { label: 'Startup capital', value: '₱800,000 – ₱2,800,000' },
        { label: 'Monthly revenue', value: '₱350,000 – ₱900,000' },
        { label: 'Break-even', value: '14 – 24 months' },
        { label: 'Staffing', value: '4 – 8 crew' },
      ],
      poi: [
        'Residential subdivisions (within 700 m)',
        'Transport terminal',
        'School cluster',
        'Barangay commercial row',
      ],
      competitors: [
        'Convenience-store chains (1 – 3 within 800 m)',
        'Public Market dry-goods section',
        'Established neighbourhood groceries',
      ],
      competitorNote:
        'Chains set the price expectation. Bulk repacking, credit terms for regulars and extended hours are where independents hold ground.',
      spaceSizes: [
        'Inline minimart (60 – 120 sqm)',
        'Corner unit with stockroom (120 – 200 sqm)',
        'Standalone with parking (200 – 300 sqm)',
      ],
      suppliers: [
        'FMCG regional distributors',
        'Butuan City Public Market bagsakan',
        'Direct route-to-market delivery accounts',
      ],
    },
    {
      name: 'Gaming / Internet Café',
      categoryLabel: 'Entertainment & Recreation',
      baseScore: 74,
      demand: 'Moderate',
      competition: 'Moderate',
      rationale:
        'Student density supports afternoon and evening occupancy. Hardware depreciation and electricity cost are the main pressures on margin.',
      economics: [
        { label: 'Startup capital', value: '₱350,000 – ₱1,400,000' },
        { label: 'Monthly revenue', value: '₱80,000 – ₱200,000' },
        { label: 'Break-even', value: '12 – 22 months' },
        { label: 'Staffing', value: '2 – 4 attendants' },
      ],
      poi: [
        'Senior high school or college (within 500 m)',
        'Boarding houses and dormitories',
        'Residential clusters',
        'Food strip for spillover traffic',
      ],
      competitors: [
        'Existing gaming cafés (1 – 4 within 1 km)',
        'Home broadband and mobile gaming',
        'Co-working spaces with day passes',
      ],
      competitorNote:
        'Mobile gaming has eaten the casual segment. Competitive-title rigs, stable fibre and air-conditioning define who keeps the serious players.',
      spaceSizes: [
        '15 – 25 unit floor (45 – 80 sqm)',
        '30 – 45 unit floor (80 – 140 sqm)',
        'Two-level layout with lounge (140 – 200 sqm)',
      ],
      suppliers: [
        'PC hardware dealers in Butuan City',
        'Fibre internet business plans',
        'Air-conditioning and electrical contractors',
      ],
    },
  ],

  medium: [
    {
      name: 'Café / Coffee Shop',
      categoryLabel: 'Food & Beverage',
      baseScore: 90,
      demand: 'Very High',
      competition: 'Moderate',
      rationale:
        'Butuan office and student culture supports all-day café trade. A commercial-zoned corner with parking captures both the work-from-café segment and evening social traffic.',
      economics: [
        { label: 'Startup capital', value: '₱3,200,000 – ₱7,500,000' },
        { label: 'Monthly revenue', value: '₱450,000 – ₱1,200,000' },
        { label: 'Break-even', value: '18 – 30 months' },
        { label: 'Staffing', value: '8 – 14 crew' },
      ],
      poi: [
        'Office and BPO cluster (within 700 m)',
        'University campus (within 1 km)',
        'Hotel and events venues',
        'Main-road commercial frontage',
      ],
      competitors: [
        'National coffee chains (1 – 2 within 1.5 km)',
        'Independent specialty cafés (3 – 6)',
        'Milk tea shops competing for the same seats',
      ],
      competitorNote:
        'Seat-hours matter more than drink count. Reliable power, fast internet and a work-friendly layout are what pull the daytime crowd.',
      spaceSizes: [
        'Inline café (80 – 140 sqm)',
        'Corner unit with alfresco (140 – 220 sqm)',
        'Standalone with parking (220 – 350 sqm)',
      ],
      suppliers: [
        'Mindanao green-bean and roastery partners',
        'Dairy and bakery distributors',
        'Equipment dealers with local service coverage',
      ],
    },
    {
      name: 'Gym / Fitness Center',
      categoryLabel: 'Health & Wellness',
      baseScore: 86,
      demand: 'High',
      competition: 'Low',
      rationale:
        'Membership revenue is recurring and Butuan is under-served at the mid-tier price point. Equipment is the bulk of the capital and retains resale value.',
      economics: [
        { label: 'Startup capital', value: '₱4,000,000 – ₱11,000,000' },
        { label: 'Monthly revenue', value: '₱400,000 – ₱950,000' },
        { label: 'Break-even', value: '20 – 34 months' },
        { label: 'Staffing', value: '6 – 12 incl. trainers' },
      ],
      poi: [
        'Residential subdivisions (within 1 km)',
        'Office cluster (within 800 m)',
        'University campus',
        'Main road with parking access',
      ],
      competitors: [
        'Established gyms (1 – 3 within 2 km)',
        'Hotel fitness facilities',
        'Barangay outdoor fitness areas',
      ],
      competitorNote:
        'The mid-tier bracket is thin. Class programming and equipment upkeep decide retention far more than the joining fee.',
      spaceSizes: [
        'Single-floor gym (200 – 350 sqm)',
        'Gym with studio room (350 – 550 sqm)',
        'Full facility with locker rooms (550 – 800 sqm)',
      ],
      suppliers: [
        'Fitness equipment importers (Manila / Cebu)',
        'Local maintenance contractors',
        'Supplement and merchandise distributors',
      ],
    },
    {
      name: 'Medical / Diagnostic Clinic',
      categoryLabel: 'Health & Wellness',
      baseScore: 84,
      demand: 'Very High',
      competition: 'Low',
      rationale:
        'Referral volume from surrounding barangays exceeds current diagnostic capacity. Regulatory setup is the long pole, not demand.',
      economics: [
        { label: 'Startup capital', value: '₱5,000,000 – ₱14,000,000' },
        { label: 'Monthly revenue', value: '₱600,000 – ₱1,600,000' },
        { label: 'Break-even', value: '24 – 40 months' },
        { label: 'Staffing', value: '8 – 16 incl. licensed staff' },
      ],
      poi: [
        'Hospital referral catchment (within 1.5 km)',
        'Dense residential population',
        'Pharmacy cluster',
        'Public transport route',
      ],
      competitors: [
        'Hospital-attached laboratories (1 – 2)',
        'Independent diagnostic centres (1 – 3)',
        'Visiting mobile screening services',
      ],
      competitorNote:
        'Turnaround time and HMO accreditation drive referrals. Price competition is secondary in this category.',
      spaceSizes: [
        'Clinic suite (120 – 200 sqm)',
        'Clinic with imaging room (200 – 320 sqm)',
        'Multi-specialty floor (320 – 500 sqm)',
      ],
      suppliers: [
        'Medical equipment distributors (Cebu / Manila)',
        'Reagent and consumables suppliers',
        'Accredited calibration services',
      ],
    },
    {
      name: 'Events Place / Function Hall',
      categoryLabel: 'Entertainment & Recreation',
      baseScore: 80,
      demand: 'High',
      competition: 'Moderate',
      rationale:
        'Weddings, debuts and corporate functions book months ahead in Butuan. Weekend-heavy utilisation suits the selected schedule.',
      economics: [
        { label: 'Startup capital', value: '₱6,000,000 – ₱14,500,000' },
        { label: 'Monthly revenue', value: '₱450,000 – ₱1,300,000' },
        { label: 'Break-even', value: '26 – 42 months' },
        { label: 'Staffing', value: '6 – 15 incl. events crew' },
      ],
      poi: [
        'Church or cathedral (within 1.5 km)',
        'Hotel cluster',
        'Main road with parking capacity',
        'Catering and supplier row',
      ],
      competitors: [
        'Hotel function rooms (2 – 4)',
        'Independent events venues (1 – 3)',
        'Barangay covered courts for budget bookings',
      ],
      competitorNote:
        'Bookings follow capacity and parking. Venues with in-house catering partnerships convert enquiries at a much higher rate.',
      spaceSizes: [
        '100-pax hall (200 – 300 sqm)',
        '250-pax hall with prep kitchen (300 – 550 sqm)',
        '400-pax hall with parking (550 – 900 sqm)',
      ],
      suppliers: [
        'Catering partners in Butuan City',
        'Audio-visual and lighting rental',
        'Furniture and styling suppliers',
      ],
    },
    {
      name: 'Auto Repair & Service Center',
      categoryLabel: 'Automotive',
      baseScore: 77,
      demand: 'High',
      competition: 'Moderate',
      rationale:
        'Vehicle registrations in Agusan del Norte continue to climb while accredited service bays remain limited outside the city core.',
      economics: [
        { label: 'Startup capital', value: '₱3,500,000 – ₱9,000,000' },
        { label: 'Monthly revenue', value: '₱380,000 – ₱900,000' },
        { label: 'Break-even', value: '20 – 32 months' },
        { label: 'Staffing', value: '6 – 12 mechanics and service crew' },
      ],
      poi: [
        'National highway frontage',
        'Transport cooperative terminal',
        'Auto parts row (within 1 km)',
        'Fuel stations nearby',
      ],
      competitors: [
        'Casa service centres (1 – 2)',
        'Independent talyer clusters (4 – 8)',
        'Roadside vulcanising shops',
      ],
      competitorNote:
        'Casa pricing leaves a wide mid-market gap. Diagnostic equipment and warranty-safe servicing win fleet accounts.',
      spaceSizes: [
        'Two-bay shop (150 – 250 sqm)',
        'Four-bay shop with parts counter (250 – 450 sqm)',
        'Full service centre with yard (450 – 800 sqm)',
      ],
      suppliers: [
        'Auto parts distributors along J.C. Aquino Avenue',
        'Lubricant and battery brand accounts',
        'Diagnostic tool importers',
      ],
    },
  ],

  large: [
    {
      name: 'Supermarket',
      categoryLabel: 'Retail & Shopping',
      baseScore: 93,
      demand: 'Very High',
      competition: 'Moderate',
      rationale:
        'A large residential catchment with only mid-sized groceries nearby supports a full supermarket format. Anchor-tenant economics also lift adjacent rental value.',
      economics: [
        { label: 'Startup capital', value: '₱18,000,000 – ₱45,000,000' },
        { label: 'Monthly revenue', value: '₱6,000,000 – ₱18,000,000' },
        { label: 'Break-even', value: '30 – 48 months' },
        { label: 'Staffing', value: '45 – 90 across shifts' },
      ],
      poi: [
        'Dense residential subdivisions (within 2 km)',
        'Major road junction with parking capacity',
        'Transport terminal',
        'School and office clusters',
      ],
      competitors: [
        'Existing supermarket chains (1 – 2 within 3 km)',
        'Public Market dry-goods and produce sections',
        'Neighbourhood groceries and convenience chains',
      ],
      competitorNote:
        'Category is capital-defended rather than crowded. Fresh-section quality and parking capacity decide catchment share.',
      spaceSizes: [
        'Compact format (1,200 – 2,000 sqm)',
        'Standard format with parking (2,000 – 3,500 sqm)',
        'Anchor format with tenant strip (3,500 – 6,000 sqm)',
      ],
      suppliers: [
        'National FMCG distributor accounts',
        'Agusan del Norte farm consolidators',
        'Cold chain and abattoir partners',
      ],
    },
    {
      name: 'Business Hotel',
      categoryLabel: 'Entertainment & Recreation',
      baseScore: 88,
      demand: 'High',
      competition: 'Low',
      rationale:
        'Butuan is the administrative gateway to Caraga, generating steady government and corporate travel. Mid-scale business-hotel supply has not kept pace with arrivals.',
      economics: [
        { label: 'Startup capital', value: '₱45,000,000 – ₱140,000,000' },
        { label: 'Monthly revenue', value: '₱2,800,000 – ₱8,500,000' },
        { label: 'Break-even', value: '48 – 72 months' },
        { label: 'Staffing', value: '35 – 80 across departments' },
      ],
      poi: [
        'Regional government offices (within 2 km)',
        'Bancasi Airport access route',
        'Convention and events venues',
        'Central business district frontage',
      ],
      competitors: [
        'Established business hotels (2 – 4 in the city)',
        'Serviced apartments and condotels',
        'Short-stay rental listings',
      ],
      competitorNote:
        'Corporate rate agreements lock in occupancy. Function-room capacity and airport transfers are the usual tiebreakers.',
      spaceSizes: [
        '40 – 60 keys (2,500 – 4,000 sqm GFA)',
        '60 – 100 keys with function rooms (4,000 – 7,000 sqm GFA)',
        '100+ keys with amenities (7,000 – 12,000 sqm GFA)',
      ],
      suppliers: [
        'Hospitality FF&E suppliers (Manila / Cebu)',
        'Linen and amenity distributors',
        'Local food and beverage supply chain',
      ],
    },
    {
      name: 'Hospital / Multi-Specialty Center',
      categoryLabel: 'Health & Wellness',
      baseScore: 85,
      demand: 'Very High',
      competition: 'Low',
      rationale:
        'Caraga referral load routinely exceeds regional bed capacity. Demand is structural, though licensing and clinical staffing set a long runway.',
      economics: [
        { label: 'Startup capital', value: '₱80,000,000 – ₱300,000,000' },
        { label: 'Monthly revenue', value: '₱6,000,000 – ₱22,000,000' },
        { label: 'Break-even', value: '60 – 96 months' },
        { label: 'Staffing', value: '120 – 350 incl. clinical staff' },
      ],
      poi: [
        'Regional referral catchment',
        'Major road access for ambulances',
        'Pharmacy and diagnostic cluster',
        'Residential population base',
      ],
      competitors: [
        'Government regional hospital',
        'Private hospitals (2 – 3 in the city)',
        'Specialty clinics handling outpatient load',
      ],
      competitorNote:
        'Competition is capacity-limited, not price-limited. PhilHealth and HMO accreditation gate most of the addressable volume.',
      spaceSizes: [
        '50 – 80 beds (6,000 – 10,000 sqm GFA)',
        '80 – 150 beds (10,000 – 18,000 sqm GFA)',
        '150+ beds with specialty wings (18,000 – 30,000 sqm GFA)',
      ],
      suppliers: [
        'Medical equipment principals and service partners',
        'Pharmaceutical and reagent distributors',
        'Medical waste and laundry contractors',
      ],
    },
    {
      name: 'Cold Storage & Ice Plant',
      categoryLabel: 'Manufacturing & Production',
      baseScore: 82,
      demand: 'High',
      competition: 'Low',
      rationale:
        'Fisheries and agricultural output across Agusan del Norte need cold-chain capacity. Nasipit port access makes this area workable for bulk inbound and outbound freight.',
      economics: [
        { label: 'Startup capital', value: '₱25,000,000 – ₱70,000,000' },
        { label: 'Monthly revenue', value: '₱2,200,000 – ₱6,500,000' },
        { label: 'Break-even', value: '42 – 66 months' },
        { label: 'Staffing', value: '20 – 45 incl. plant crew' },
      ],
      poi: [
        'Port of Nasipit access route',
        'Public Market and abattoir',
        'Agricultural consolidation points',
        'National highway frontage',
      ],
      competitors: [
        'Existing cold storage operators (1 – 2 in the province)',
        'Ice plants serving the fishing fleet',
        'In-house cold rooms at large traders',
      ],
      competitorNote:
        'Supply is genuinely short. Reliability of power backup is the single biggest differentiator in this category.',
      spaceSizes: [
        'Compact plant (800 – 1,500 sqm)',
        'Plant with loading yard (1,500 – 3,000 sqm)',
        'Integrated facility (3,000 – 6,000 sqm)',
      ],
      suppliers: [
        'Refrigeration system integrators',
        'Generator and electrical contractors',
        'Packaging and pallet suppliers',
      ],
    },
    {
      name: 'BPO / Call Center Facility',
      categoryLabel: 'Technology & Digital',
      baseScore: 79,
      demand: 'High',
      competition: 'Low',
      rationale:
        'Butuan universities produce a steady English-proficient graduate pool, and provincial wage levels are attractive to locators. Fibre redundancy is the main site requirement.',
      economics: [
        { label: 'Startup capital', value: '₱20,000,000 – ₱60,000,000' },
        { label: 'Monthly revenue', value: '₱3,000,000 – ₱9,000,000' },
        { label: 'Break-even', value: '36 – 54 months' },
        { label: 'Staffing', value: '150 – 500 across shifts' },
      ],
      poi: [
        'University cluster (within 2 km)',
        'Central business district',
        'Public transport routes for shift changes',
        'Food strip for night-shift staff',
      ],
      competitors: [
        'Existing BPO locators (1 – 2 in the city)',
        'Home-based freelance outsourcing',
        'Larger Cagayan de Oro sites competing for talent',
      ],
      competitorNote:
        'Talent supply, not client demand, is the constraint. Proximity to campuses and shuttle logistics drive recruitment cost.',
      spaceSizes: [
        '150 seats (900 – 1,400 sqm)',
        '300 seats (1,400 – 2,600 sqm)',
        '500+ seats with training rooms (2,600 – 4,500 sqm)',
      ],
      suppliers: [
        'Redundant fibre providers',
        'UPS and generator contractors',
        'Workstation and headset distributors',
      ],
    },
  ],
}
