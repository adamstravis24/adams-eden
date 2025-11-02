import { Plant } from '../types/plants';

// Utilities to find a local plant record that best matches a Plant.id suggestion

export function normalizeName(name?: string): string {
  return (name || '').trim().toLowerCase();
}

export function findBestLocalPlant(
  plantDatabase: Plant[],
  opts: { scientificName?: string; commonNames?: string[] }
): Plant | undefined {
  const sci = normalizeName(opts.scientificName);
  const commons = (opts.commonNames || []).map(normalizeName).filter(Boolean);

  // Exact scientific name match
  if (sci) {
    const bySci = plantDatabase.find(p => normalizeName(p.name) === sci);
    if (bySci) return bySci;
    // Try simple pluralization adjustments
    if (sci.endsWith('s')) {
      const singular = sci.replace(/s$/, '');
      const singularMatch = plantDatabase.find(p => normalizeName(p.name) === singular);
      if (singularMatch) return singularMatch;
    } else {
      const plural = `${sci}s`;
      const pluralMatch = plantDatabase.find(p => normalizeName(p.name) === plural);
      if (pluralMatch) return pluralMatch;
    }
  }

  // Match by common name
  for (const cn of commons) {
    const byCommon = plantDatabase.find(p => normalizeName(p.name) === cn);
    if (byCommon) return byCommon;
  }

  // Fallback: substring includes for common veggies (e.g., "bell peppers" -> "peppers")
  const tokens = new Set<string>();
  if (sci) sci.split(/\s|-/g).forEach(t => t && tokens.add(t));
  commons.forEach(c => c.split(/\s|-/g).forEach(t => t && tokens.add(t)));
  for (const t of tokens) {
    const byToken = plantDatabase.find(p => normalizeName(p.name).includes(t));
    if (byToken) return byToken;
  }

  return undefined;
}
