/**
 * Generates RFC 4180 compliant CSV string from tabular rows and triggers download when running in browser.
 */
export function buildCSVContent(
  headers: string[],
  rows: Array<Array<string | number | boolean | null | undefined>>
): string {
  const escapeCell = (val: string | number | boolean | null | undefined): string => {
    const str = val === null || val === undefined ? '' : String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const lines = [
    headers.map(escapeCell).join(','),
    ...rows.map((row) => row.map(escapeCell).join(',')),
  ];

  return lines.join('\n');
}

export function downloadCSVFile(
  filename: string,
  headers: string[],
  rows: Array<Array<string | number | boolean | null | undefined>>
): string {
  const csv = buildCSVContent(headers, rows);

  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return csv;
}
