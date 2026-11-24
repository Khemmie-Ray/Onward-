import type { RecapTerm } from "@/lib/lessons/lesson-data";

export const squashWord = (text: string) =>
  text.toLowerCase().replace(/[^a-z0-9]/g, "");

export function recapMatches(term: RecapTerm, typed: string): boolean {
  const answer = squashWord(typed);
  if (!answer) return false;
  return [term.word, ...term.accept].some((w) => squashWord(w) === answer);
}
