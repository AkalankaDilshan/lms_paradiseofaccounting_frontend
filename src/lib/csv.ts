export type CsvCell = string | number | null | undefined;

/** One CSV field: quoted when needed, and formula-looking text neutralised. */
export function csvCell(value: CsvCell): string {
  const text = value === null || value === undefined ? '' : String(value);
  // Spreadsheet formula injection: user-entered text starting with = + - @ would
  // run as a formula in Excel. Numbers are left alone (a real -5 stays -5).
  const safe = typeof value !== 'number' && /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

/** Whole CSV document (CRLF line endings, as Excel expects). */
export function toCsv(header: string[], rows: CsvCell[][]): string {
  return [header, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n');
}

/** Build a CSV file from rows and hand it to the browser as a download. */
export function downloadCsv(filename: string, header: string[], rows: CsvCell[][]) {
  const body = toCsv(header, rows);
  // BOM so Excel opens Sinhala names as UTF-8
  const blob = new Blob(['﻿', body], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
