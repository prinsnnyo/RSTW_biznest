import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type {
  NearestSpacesReport,
  NearestSuppliersReport,
  ReportMetric,
  SuitabilityReport,
  TopBusinessesReport,
} from '@/views/(user)/map/types/smart-analysis.types'

/** Brand colours as RGB triples — jsPDF cannot read CSS custom properties. */
const INK: [number, number, number] = [26, 50, 99]
const MUTED: [number, number, number] = [110, 116, 128]
const BAND: [number, number, number] = [231, 234, 236]

const PAGE_MARGIN = 12

interface CursorDoc {
  doc: jsPDF
  y: number
}

function lastTableBottom(doc: jsPDF, fallback: number): number {
  const table = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable
  return table ? table.finalY : fallback
}

function sectionTitle(state: CursorDoc, title: string): void {
  state.doc.setFontSize(11)
  state.doc.setTextColor(...INK)
  state.doc.text(title, PAGE_MARGIN, state.y)
  state.y += 5
}

interface HeaderInput {
  title: string
  areaSummary: string
  generatedAt: string
  disclaimer: string
  badgeValue?: string
  badgeLabel?: string
}

function drawHeader(state: CursorDoc, input: HeaderInput): void {
  const { doc } = state
  const pageWidth = doc.internal.pageSize.getWidth()

  doc.setFillColor(...INK)
  doc.rect(0, 0, pageWidth, 26, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(16)
  doc.text(input.title, PAGE_MARGIN, 12)

  doc.setFontSize(9)
  doc.text(input.areaSummary, PAGE_MARGIN, 19)

  if (input.badgeValue) {
    doc.setFontSize(22)
    doc.text(input.badgeValue, pageWidth - PAGE_MARGIN, 13, { align: 'right' })
  }

  if (input.badgeLabel) {
    doc.setFontSize(9)
    doc.text(input.badgeLabel, pageWidth - PAGE_MARGIN, 19, { align: 'right' })
  }

  state.y = 34
  doc.setTextColor(...MUTED)
  doc.setFontSize(8)
  doc.text(`Generated ${input.generatedAt} · ${input.disclaimer}`, PAGE_MARGIN, state.y)
  state.y += 7
}

function drawMetricTable(state: CursorDoc, title: string, rows: ReportMetric[]): void {
  sectionTitle(state, title)

  autoTable(state.doc, {
    startY: state.y,
    margin: { left: PAGE_MARGIN, right: PAGE_MARGIN },
    head: [['Item', 'Value', 'Note']],
    body: rows.map((row) => [row.label, row.value, row.hint ?? '—']),
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: INK, textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: BAND },
  })

  state.y = lastTableBottom(state.doc, state.y) + 8
}

function drawList(state: CursorDoc, title: string, items: string[]): void {
  sectionTitle(state, title)

  state.doc.setFontSize(8)
  state.doc.setTextColor(...MUTED)

  const width = state.doc.internal.pageSize.getWidth() - PAGE_MARGIN * 2 - 4

  items.forEach((item) => {
    const lines = state.doc.splitTextToSize(`•  ${item}`, width)
    state.doc.text(lines, PAGE_MARGIN, state.y)
    state.y += lines.length * 4 + 1
  })

  state.y += 5
}

function ensureRoom(state: CursorDoc, needed: number): void {
  const limit = state.doc.internal.pageSize.getHeight() - 14

  if (state.y + needed <= limit) {
    return
  }

  state.doc.addPage()
  state.y = 16
}

export interface UseAnalysisReportExportReturn {
  exportSuitabilityToPdf: (report: SuitabilityReport) => void
  exportTopBusinessesToPdf: (report: TopBusinessesReport) => void
  exportNearestSuppliersToPdf: (report: NearestSuppliersReport) => void
  exportNearestSpacesToPdf: (report: NearestSpacesReport) => void
}

export function useAnalysisReportExport(): UseAnalysisReportExportReturn {
  // Landscape throughout: both reports read as wide dashboards on screen, and
  // the tables below carry three or more columns each.
  function exportSuitabilityToPdf(report: SuitabilityReport): void {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
    const state: CursorDoc = { doc, y: 0 }

    drawHeader(state, {
      title: 'Business Suitability Analysis',
      areaSummary: report.areaSummary,
      generatedAt: report.generatedAt,
      disclaimer: report.disclaimer,
      badgeValue: `${report.verdict.score}/100`,
      badgeLabel: report.verdict.label,
    })

    drawMetricTable(state, 'Business Profile', report.selection)
    ensureRoom(state, 45)
    drawMetricTable(state, 'Area Demographics', report.demographics)
    ensureRoom(state, 45)
    drawMetricTable(state, 'Market & Purchasing Power', report.market)

    ensureRoom(state, 50)
    sectionTitle(state, 'Suitability Score Breakdown')
    autoTable(doc, {
      startY: state.y,
      margin: { left: PAGE_MARGIN, right: PAGE_MARGIN },
      head: [['Factor', 'Score', 'Basis']],
      body: report.scoreRows.map((row) => [row.label, `${row.score}/100`, row.detail]),
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: INK, textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: BAND },
      columnStyles: { 1: { halign: 'center', cellWidth: 22 } },
    })
    state.y = lastTableBottom(doc, state.y) + 8

    ensureRoom(state, 55)
    sectionTitle(state, `Foot Traffic by Time of Day — peak at ${report.footTraffic.peakWindow}`)
    autoTable(doc, {
      startY: state.y,
      margin: { left: PAGE_MARGIN, right: PAGE_MARGIN },
      head: [['Time window', 'Level', 'Estimated volume', 'Share of day']],
      body: report.footTraffic.bands.map((band) => [
        band.window,
        band.level,
        band.volume,
        `${band.share}%`,
      ]),
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: INK, textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: BAND },
    })
    state.y = lastTableBottom(doc, state.y) + 8

    ensureRoom(state, 60)
    sectionTitle(state, 'Analysis Basis')
    autoTable(doc, {
      startY: state.y,
      margin: { left: PAGE_MARGIN, right: PAGE_MARGIN },
      head: [['Factor', 'Finding', 'Supporting points']],
      body: report.basis.map((item) => [
        item.title,
        item.body,
        item.bullets.map((bullet) => `• ${bullet}`).join('\n'),
      ]),
      styles: { fontSize: 8, cellPadding: 2, valign: 'top' },
      headStyles: { fillColor: INK, textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: BAND },
      columnStyles: { 0: { cellWidth: 46, fontStyle: 'bold' } },
    })
    state.y = lastTableBottom(doc, state.y) + 8

    ensureRoom(state, 40)
    drawList(state, 'Recommendations', report.recommendations)
    ensureRoom(state, 40)
    drawList(state, 'Risks & Watch-outs', report.risks)

    doc.save(`business-suitability-${report.id}.pdf`)
  }

  function exportTopBusinessesToPdf(report: TopBusinessesReport): void {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
    const state: CursorDoc = { doc, y: 0 }

    drawHeader(state, {
      title: 'Top 5 Best Businesses in this Area',
      areaSummary: report.areaSummary,
      generatedAt: report.generatedAt,
      disclaimer: report.disclaimer,
      badgeValue: `${report.opportunities.length}`,
      badgeLabel: 'ranked opportunities',
    })

    drawMetricTable(state, 'Search Criteria', report.criteria)
    ensureRoom(state, 45)
    drawMetricTable(state, 'Area Profile', report.areaProfile)

    ensureRoom(state, 50)
    sectionTitle(state, 'Ranking Methodology')
    autoTable(doc, {
      startY: state.y,
      margin: { left: PAGE_MARGIN, right: PAGE_MARGIN },
      head: [['Criterion', 'Score', 'Basis']],
      body: report.methodology.map((row) => [row.label, `${row.score}/100`, row.detail]),
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: INK, textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: BAND },
      columnStyles: { 1: { halign: 'center', cellWidth: 22 } },
    })
    state.y = lastTableBottom(doc, state.y) + 8

    ensureRoom(state, 60)
    sectionTitle(state, 'Ranked Opportunities')
    autoTable(doc, {
      startY: state.y,
      margin: { left: PAGE_MARGIN, right: PAGE_MARGIN },
      head: [['#', 'Business', 'Category', 'Score', 'Demand', 'Competition', 'Why it ranks here']],
      body: report.opportunities.map((item) => [
        `${item.rank}`,
        item.name,
        item.categoryLabel,
        `${item.score}/100`,
        item.demand,
        item.competition,
        item.rationale,
      ]),
      styles: { fontSize: 8, cellPadding: 2, valign: 'top' },
      headStyles: { fillColor: INK, textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: BAND },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },
        1: { cellWidth: 42, fontStyle: 'bold' },
        2: { cellWidth: 30 },
        3: { cellWidth: 16, halign: 'center' },
        4: { cellWidth: 18 },
        5: { cellWidth: 20 },
      },
    })
    state.y = lastTableBottom(doc, state.y) + 8

    // One full-analysis block per ranked business, each on a fresh page so the
    // seven sections are never split awkwardly.
    report.opportunities.forEach((item) => {
      doc.addPage()
      state.y = 16

      sectionTitle(
        state,
        `#${item.rank} — ${item.name} (${item.categoryLabel}) · ${item.score}/100`,
      )

      autoTable(doc, {
        startY: state.y,
        margin: { left: PAGE_MARGIN, right: PAGE_MARGIN },
        head: [['Metric', 'Value']],
        body: item.economics.map((metric) => [metric.label, metric.value]),
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: INK, textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: BAND },
        columnStyles: { 0: { cellWidth: 45 } },
        tableWidth: 110,
      })
      state.y = lastTableBottom(doc, state.y) + 6

      autoTable(doc, {
        startY: state.y,
        margin: { left: PAGE_MARGIN, right: PAGE_MARGIN },
        head: [['Factor', 'Findings', 'Note']],
        body: item.sections.map((section) => [
          section.title,
          section.bullets.map((bullet) => `• ${bullet}`).join('\n'),
          section.note,
        ]),
        styles: { fontSize: 8, cellPadding: 2, valign: 'top' },
        headStyles: { fillColor: INK, textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: BAND },
        columnStyles: { 0: { cellWidth: 46, fontStyle: 'bold' } },
      })
      state.y = lastTableBottom(doc, state.y) + 6
    })

    doc.save(`top-businesses-${report.id}.pdf`)
  }

  function exportNearestSuppliersToPdf(report: NearestSuppliersReport): void {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
    const state: CursorDoc = { doc, y: 0 }

    drawHeader(state, {
      title: 'Nearest Suppliers',
      areaSummary: report.areaSummary,
      generatedAt: report.generatedAt,
      disclaimer: report.disclaimer,
      badgeValue: `${report.suppliers.length}`,
      badgeLabel: 'suppliers matched',
    })

    drawMetricTable(state, 'Search Criteria', report.criteria)
    ensureRoom(state, 45)
    drawMetricTable(state, 'Supply Chain Profile', report.supplyProfile)

    ensureRoom(state, 60)
    sectionTitle(state, 'Ranked Suppliers')
    autoTable(doc, {
      startY: state.y,
      margin: { left: PAGE_MARGIN, right: PAGE_MARGIN },
      head: [['#', 'Supplier', 'Trade', 'Distance', 'Match', 'Address', 'Contact', 'Coordinates']],
      body: report.suppliers.map((match) => [
        `${match.rank}`,
        match.record.name,
        match.record.trade,
        `${match.distanceKm} km`,
        `${match.matchScore}/100`,
        `${match.record.address}
Brgy. ${match.record.barangay}`,
        `${match.record.phone}
${match.record.email}`,
        `${match.record.lat.toFixed(4)}, ${match.record.lng.toFixed(4)}`,
      ]),
      styles: { fontSize: 7.5, cellPadding: 2, valign: 'top' },
      headStyles: { fillColor: INK, textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: BAND },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },
        1: { cellWidth: 44, fontStyle: 'bold' },
        2: { cellWidth: 40 },
        3: { cellWidth: 18, halign: 'center' },
        4: { cellWidth: 16, halign: 'center' },
        7: { cellWidth: 30 },
      },
    })
    state.y = lastTableBottom(doc, state.y) + 8

    // Terms and specialties get their own page — the summary table above is
    // already at the width limit for landscape A4.
    doc.addPage()
    state.y = 16
    sectionTitle(state, 'Supplier Terms & Specialties')
    autoTable(doc, {
      startY: state.y,
      margin: { left: PAGE_MARGIN, right: PAGE_MARGIN },
      head: [
        [
          'Supplier',
          'Specialties',
          'Minimum order',
          'Payment terms',
          'Delivery',
          'Lead time',
          'Hours',
        ],
      ],
      body: report.suppliers.map((match) => [
        match.record.name,
        match.record.specialties.join(', '),
        match.record.minimumOrder,
        match.record.paymentTerms,
        match.record.delivery,
        match.record.leadTime,
        match.record.operatingHours,
      ]),
      styles: { fontSize: 7.5, cellPadding: 2, valign: 'top' },
      headStyles: { fillColor: INK, textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: BAND },
      columnStyles: { 0: { cellWidth: 40, fontStyle: 'bold' } },
    })
    state.y = lastTableBottom(doc, state.y) + 8

    ensureRoom(state, 40)
    drawList(
      state,
      'Why each supplier ranks here',
      report.suppliers.map((match) => `${match.record.name} — ${match.matchReason}`),
    )

    doc.save(`nearest-suppliers-${report.id}.pdf`)
  }

  function exportNearestSpacesToPdf(report: NearestSpacesReport): void {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
    const state: CursorDoc = { doc, y: 0 }

    drawHeader(state, {
      title: 'Nearest Space for Rent / Sale',
      areaSummary: report.areaSummary,
      generatedAt: report.generatedAt,
      disclaimer: report.disclaimer,
      badgeValue: `${report.listings.length}`,
      badgeLabel: 'listings matched',
    })

    drawMetricTable(state, 'Search Criteria', report.criteria)
    ensureRoom(state, 45)
    drawMetricTable(state, 'Market Profile', report.marketProfile)

    ensureRoom(state, 60)
    sectionTitle(state, 'Ranked Listings')
    autoTable(doc, {
      startY: state.y,
      margin: { left: PAGE_MARGIN, right: PAGE_MARGIN },
      head: [
        ['#', 'Space', 'Type', 'Price', 'Floor area', 'Units', 'Distance', 'Address', 'Coordinates'],
      ],
      body: report.listings.map((match) => [
        `${match.rank}`,
        match.listing.name,
        match.listing.spaceType,
        match.priceLabel,
        match.listing.areaSqmMin === match.listing.areaSqmMax
          ? `${match.listing.areaSqmMin} sqm`
          : `${match.listing.areaSqmMin}-${match.listing.areaSqmMax} sqm`,
        match.unitsInBand > 0
          ? `${match.listing.unitsAvailable} (${match.unitsInBand} in band)`
          : `${match.listing.unitsAvailable}`,
        `${match.distanceKm} km`,
        `${match.listing.address}, Brgy. ${match.listing.barangay}`,
        `${match.listing.lat.toFixed(4)}, ${match.listing.lng.toFixed(4)}`,
      ]),
      styles: { fontSize: 7.5, cellPadding: 2, valign: 'top' },
      headStyles: { fillColor: INK, textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: BAND },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },
        1: { cellWidth: 38, fontStyle: 'bold' },
        2: { cellWidth: 20 },
        3: { cellWidth: 34 },
        4: { cellWidth: 24 },
        5: { cellWidth: 24 },
        6: { cellWidth: 17, halign: 'center' },
        8: { cellWidth: 28 },
      },
    })
    state.y = lastTableBottom(doc, state.y) + 8

    // Terms and amenities get their own page — the summary table above is
    // already at the width limit for landscape A4.
    doc.addPage()
    state.y = 16
    sectionTitle(state, 'Listing Terms & Amenities')
    autoTable(doc, {
      startY: state.y,
      margin: { left: PAGE_MARGIN, right: PAGE_MARGIN },
      head: [['Space', 'Contact', 'Amenities', 'Terms', 'Why it ranks here']],
      body: report.listings.map((match) => [
        match.listing.name,
        match.listing.contactNumber ?? 'Enquire through the LGU business desk',
        match.listing.amenities.join(', '),
        match.listing.terms.map((term) => `${term.label}: ${term.value}`).join('\n'),
        match.matchReason,
      ]),
      styles: { fontSize: 7.5, cellPadding: 2, valign: 'top' },
      headStyles: { fillColor: INK, textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: BAND },
      columnStyles: { 0: { cellWidth: 38, fontStyle: 'bold' }, 1: { cellWidth: 34 } },
    })

    doc.save(`nearest-spaces-${report.id}.pdf`)
  }

  return {
    exportSuitabilityToPdf,
    exportTopBusinessesToPdf,
    exportNearestSuppliersToPdf,
    exportNearestSpacesToPdf,
  }
}
