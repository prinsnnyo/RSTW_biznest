export interface DatabaseRow {
  businessowner: string
  contactnumber: string
  businesslocation: string
  zoningclassification: string
  geotag: string
  label: string
  created_at: string
}

export interface TableRow {
  label?: string
  businessOwner?: string
  contactNumber?: string
  businessLocation?: string
  zoningClassification?: string
  geotag?: string
}

export interface Tab {
  label: string
  content: string
  tableData?: TableRow[]
}

export interface ReportHeaderProps {
  loading?: boolean
  error?: string | null
}

export interface ReportsTableProps {
  tableData?: TableRow[]
  content?: string
}

export interface TabAndExportButtonsProps {
  tabs: Tab[]
  value: number
  canExport: boolean
  hideExport?: boolean
}

export interface ReportProps {
  loading?: boolean
  error?: string | null
  tableData?: TableRow[]
  content?: string
  tabs: Tab[]
  value: number
  canExport: boolean
}
