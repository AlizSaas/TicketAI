const MAX_SKILLS = 12
const MAX_SKILL_LENGTH = 40

const toDisplayName = (value: string) =>
  value
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_\-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

/**
 * Cleans a list of skills (from the AI or the database): trims, splits camelCase,
 * drops empty / overly long / duplicate entries and caps the list size.
 */
export function normalizeSkills(skills: unknown, limit: number = MAX_SKILLS): string[] {
  if (!Array.isArray(skills)) return []

  const seen = new Set<string>()
  const result: string[] = []

  for (const skill of skills) {
    if (typeof skill !== 'string') continue
    const name = toDisplayName(skill)
    if (!name || name.length > MAX_SKILL_LENGTH) continue
    const key = name.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    result.push(name)
    if (result.length >= limit) break
  }

  return result
}
