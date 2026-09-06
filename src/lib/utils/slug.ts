export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export async function generateUniqueOrgSlug(
  name: string,
  isSlugTaken: (slug: string) => Promise<boolean>
): Promise<string> {
  const base = slugify(name) || 'store'
  let candidate = base
  let attempt = 0

  while (await isSlugTaken(candidate)) {
    attempt += 1
    candidate = `${base}-${attempt}`
  }

  return candidate
}
