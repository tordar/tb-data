export function parseNum(s: string): number | null {
  if (!s || s === "") return null;
  if (s.includes("+")) return s.split("+").reduce((a, b) => a + (parseFloat(b) || 0), 0);
  if (/^\d+:\d+$/.test(s)) { const [h, m] = s.split(":").map(Number); return h * 60 + m; }
  const normalised = s.replace(",", ".");
  const n = parseFloat(normalised.replace(/[^0-9.\-]/g, ""));
  return isNaN(n) ? null : n;
}

export function isNumericCol(rows: string[][], colIdx: number): boolean {
  if (colIdx === 0) return false;
  const vals = rows.slice(0, 20).map((r) => r[colIdx] ?? "");
  const nonEmpty = vals.filter((v) => v !== "");
  if (nonEmpty.length === 0) return false;
  return nonEmpty.filter((v) => parseNum(v) !== null).length / nonEmpty.length > 0.7;
}

export function colMax(rows: string[][], colIdx: number): number {
  let max = 0;
  for (const row of rows) { const n = parseNum(row[colIdx] ?? ""); if (n !== null && n > max) max = n; }
  return max;
}
