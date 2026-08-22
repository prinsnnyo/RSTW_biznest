import { usePdfExport } from './usePdfExport'
import type { Tab, TableRow } from '@/types/reports.types'

const COLUMNS: { key: keyof TableRow; label: string }[] = [
  { key: 'businessOwner', label: 'Business Owner' },
  { key: 'contactNumber', label: 'Contact Number' },
  { key: 'businessLocation', label: 'Business Location' },
  { key: 'zoningClassification', label: 'Zoning Classification' },
  { key: 'geotag', label: 'GeoTag' },
]

function buildFileName(tabLabel: string, extension: string): string {
  const dateString = new Date().toISOString().split('T')[0]
  return `${tabLabel.replace(/\s+/g, '_')}_${dateString}.${extension}`
}

function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

function escapeCsvValue(value: string): string {
  if (/["\n,]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

export function useReportExport() {
  const { exportToPdf } = usePdfExport()

  function exportToCsv(tab: Tab, tabLabel: string): void {
    if (!tab.tableData || tab.tableData.length === 0) {
      return
    }

    const headerRow = COLUMNS.map((column) => escapeCsvValue(column.label)).join(',')
    const rows = tab.tableData.map((row) =>
      COLUMNS.map((column) => escapeCsvValue(row[column.key] ?? '-')).join(','),
    )

    downloadBlob(
      new Blob([[headerRow, ...rows].join('\r\n')], { type: 'text/csv;charset=utf-8;' }),
      buildFileName(tabLabel, 'csv'),
    )
  }

  function exportToText(tab: Tab, tabLabel: string): void {
    if (!tab.tableData || tab.tableData.length === 0) {
      return
    }

    const lines = [`Report: ${tabLabel}`, `Generated on: ${new Date().toLocaleString()}`, '']

    tab.tableData.forEach((row, index) => {
      lines.push(`#${index + 1}`)
      COLUMNS.forEach((column) => {
        lines.push(`${column.label}: ${row[column.key] ?? '-'}`)
      })
      lines.push('')
    })

    downloadBlob(
      new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8;' }),
      buildFileName(tabLabel, 'txt'),
    )
  }

  function exportToWord(tab: Tab, tabLabel: string): void {
    if (!tab.tableData || tab.tableData.length === 0) {
      return
    }

    const headerCells = COLUMNS.map(
      (column) => `<th style="border:1px solid #ccc;padding:4px;">${escapeHtml(column.label)}</th>`,
    ).join('')

    const bodyRows = tab.tableData
      .map((row) => {
        const cells = COLUMNS.map(
          (column) =>
            `<td style="border:1px solid #ccc;padding:4px;">${escapeHtml(row[column.key] ?? '-')}</td>`,
        ).join('')
        return `<tr>${cells}</tr>`
      })
      .join('')

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>
      <h2>Report: ${escapeHtml(tabLabel)}</h2>
      <p>Generated on: ${escapeHtml(new Date().toLocaleString())}</p>
      <table style="border-collapse:collapse;width:100%;">
        <thead><tr>${headerCells}</tr></thead>
        <tbody>${bodyRows}</tbody>
      </table>
    </body></html>`

    downloadBlob(
      new Blob(['﻿', html], { type: 'application/msword' }),
      buildFileName(tabLabel, 'doc'),
    )
  }

  return {
    exportToPdf,
    exportToCsv,
    exportToText,
    exportToWord,
  }
}
