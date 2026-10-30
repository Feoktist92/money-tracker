/** Названия считаются одинаковыми без учёта регистра и пробелов по краям. */
export function sameName(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

/**
 * Первое свободное название среди занятых: само, а если занято — «Название (2)», «Название (3)»…
 * Занятость проверяется по `sameName`.
 */
export function freeName(name: string, taken: readonly string[]): string {
  const isTaken = (candidate: string) => taken.some((other) => sameName(other, candidate));
  if (!isTaken(name)) return name;
  for (let n = 2; ; n += 1) {
    const candidate = `${name} (${n})`;
    if (!isTaken(candidate)) return candidate;
  }
}
