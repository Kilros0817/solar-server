// ─── Throughput calculation ───────────────────────────────────────────────────

/**
 * Get ISO week key (YYYY-Www) from timestamp
 */
function getWeekKey(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  const year = date.getUTCFullYear();
  
  // Simple week calculation: week of year starting from Jan 1
  const janFirst = new Date(Date.UTC(year, 0, 1));
  const diffMs = date.getTime() - janFirst.getTime();
  const week = Math.floor(diffMs / (7 * 24 * 3600 * 1000)) + 1;
  
  return `${year}-W${String(week).padStart(2, '0')}`;
}

export function buildThroughput(
  completedDocs: { cycleTime: number | null; esignDate: number }[],
): Record<string, number> {
  // Group completed docs by ISO week (YYYY-Www)
  const weekly: Record<string, number> = {};
  
  for (const doc of completedDocs) {
    const key = getWeekKey(doc.esignDate);
    weekly[key] = (weekly[key] ?? 0) + 1;
  }
  
  return weekly;
}