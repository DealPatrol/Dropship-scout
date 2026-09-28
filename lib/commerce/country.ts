const COUNTRY_NAMES: Record<string, string> = {
  AU: 'Australia',
  CA: 'Canada',
  DE: 'Germany',
  FR: 'France',
  GB: 'United Kingdom',
  IE: 'Ireland',
  NL: 'Netherlands',
  NZ: 'New Zealand',
  US: 'United States',
}

export function countryName(code: string): string {
  const normalized = code.trim().toUpperCase()
  return COUNTRY_NAMES[normalized] ?? normalized
}
