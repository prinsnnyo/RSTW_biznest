import type { Tab, TableRow } from '@/types/reports.types'

const businessSuitability: TableRow[] = [
  {
    label: 'Business Suitability',
    businessOwner: 'Maria Santos',
    contactNumber: '0917-234-5678',
    businessLocation: 'Zone 2, Purok 5, Butuan City',
    zoningClassification: 'Commercial',
    geotag: '8.9475, 125.5406',
  },
  {
    label: 'Business Suitability',
    businessOwner: 'Ricardo Dela Cruz',
    contactNumber: '0918-345-6789',
    businessLocation: 'Barangay Doongan, Butuan City',
    zoningClassification: 'Mixed-Use',
    geotag: '8.9502, 125.5361',
  },
  {
    label: 'Business Suitability',
    businessOwner: 'Angela Reyes',
    contactNumber: '0920-456-7890',
    businessLocation: 'Barangay Libertad, Butuan City',
    zoningClassification: 'Commercial',
    geotag: '8.9440, 125.5478',
  },
]

const nearestSuppliers: TableRow[] = [
  {
    label: 'Nearest Suppliers',
    businessOwner: 'Butuan Hardware Supply Co.',
    contactNumber: '0921-567-8901',
    businessLocation: 'J.C. Aquino Avenue, Butuan City',
    zoningClassification: 'Industrial',
    geotag: '8.9491, 125.5433',
  },
  {
    label: 'Nearest Suppliers',
    businessOwner: 'Caraga Fresh Produce Traders',
    contactNumber: '0922-678-9012',
    businessLocation: 'Langihan Road, Butuan City',
    zoningClassification: 'Commercial',
    geotag: '8.9459, 125.5397',
  },
  {
    label: 'Nearest Suppliers',
    businessOwner: 'Northmin Packaging Supplies',
    contactNumber: '0923-789-0123',
    businessLocation: 'Barangay Ambago, Butuan City',
    zoningClassification: 'Industrial',
    geotag: '8.9531, 125.5342',
  },
]

const topFiveBusinesses: TableRow[] = [
  {
    label: 'Top 5 Businesses',
    businessOwner: 'Golden Harvest Grocery',
    contactNumber: '0924-890-1234',
    businessLocation: 'Montilla Boulevard, Butuan City',
    zoningClassification: 'Commercial',
    geotag: '8.9487, 125.5419',
  },
  {
    label: 'Top 5 Businesses',
    businessOwner: 'Riverside Eatery & Catering',
    contactNumber: '0925-901-2345',
    businessLocation: 'Barangay Baan Km 3, Butuan City',
    zoningClassification: 'Commercial',
    geotag: '8.9412, 125.5455',
  },
  {
    label: 'Top 5 Businesses',
    businessOwner: 'Caraga Auto Repair Shop',
    contactNumber: '0926-012-3456',
    businessLocation: 'Barangay Tiniwisan, Butuan City',
    zoningClassification: 'Mixed-Use',
    geotag: '8.9524, 125.5388',
  },
]

const availableSpaces: TableRow[] = [
  {
    label: 'Available Spaces',
    businessOwner: 'Butuan Commercial Complex',
    contactNumber: '0927-123-4567',
    businessLocation: 'A.D. Curato Street, Butuan City',
    zoningClassification: 'Commercial',
    geotag: '8.9468, 125.5411',
  },
  {
    label: 'Available Spaces',
    businessOwner: 'Riverfront Retail Spaces',
    contactNumber: '0928-234-5678',
    businessLocation: 'Barangay Bonbon, Butuan City',
    zoningClassification: 'Mixed-Use',
    geotag: '8.9399, 125.5470',
  },
]

const allReports: TableRow[] = [
  ...businessSuitability,
  ...nearestSuppliers,
  ...topFiveBusinesses,
  ...availableSpaces,
]

export const REPORT_TABS: Tab[] = [
  {
    label: 'All Reports',
    content: 'No Reports Found',
    tableData: allReports,
  },
  {
    label: 'Business Suitability',
    content: 'No Reports Found for "Business Suitability"',
    tableData: businessSuitability,
  },
  {
    label: 'Nearest Suppliers',
    content: 'No Reports Found for "Nearest Suppliers"',
    tableData: nearestSuppliers,
  },
  {
    label: 'Top 5 Businesses',
    content: 'No Reports Found for "Top 5 Businesses"',
    tableData: topFiveBusinesses,
  },
  {
    label: 'Available Spaces',
    content: 'No Reports Found for "Available Spaces"',
    tableData: availableSpaces,
  },
]
