/**
 * Lenient answer matching. Both the guess and each accepted answer are
 * normalized, then compared exactly:
 *   lowercase -> strip accents -> "&" becomes "and" -> drop punctuation ->
 *   drop a leading "the" / "a" / "an" -> remove all whitespace.
 * So "The D.C. Library", "dc library" and "DC-Library!" all become "dclibrary".
 */
export function normalizeAnswer(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/\p{M}/gu, "") // combining accent marks left by NFKD
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^\p{L}\p{N}\s]/gu, " ") // punctuation -> space, so "d.c." splits cleanly
    .trim()
    .replace(/^(the|a|an)\s+/, "")
    .replace(/\s+/g, "");
}

/** True when the guess matches any accepted answer after normalization. */
export function matchesAnswer(guess: string, accepted: readonly string[]): boolean {
  const normalizedGuess = normalizeAnswer(guess);
  if (!normalizedGuess) return false;
  return accepted.some((answer) => normalizeAnswer(answer) === normalizedGuess);
}
