export function getInitials(
  firstName: string | null | undefined,
  lastName: string | null | undefined,
): string {
  const first = firstName?.trim() || ""
  const last = lastName?.trim() || ""

  if (!first && !last) {
    return "?"
  }

  if (first && last) {
    return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase()
  }

  if (first) {
    return first.length >= 2 ? first.substring(0, 2).toUpperCase() : first.charAt(0).toUpperCase()
  }

  if (last) {
    return last.length >= 2 ? last.substring(0, 2).toUpperCase() : last.charAt(0).toUpperCase()
  }

  return "?"
}
