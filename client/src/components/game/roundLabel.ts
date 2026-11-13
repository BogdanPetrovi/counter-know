/** "Round 1 of 2". */
export function roundOf(number: number, total: number) {
  return `Round ${number} of ${total}`;
}

/** What the break after round `number` leads to. */
export function nextAfterRound(number: number, total: number) {
  if (number >= total) return "Final score";
  return number + 1 === total ? "Final round" : `Round ${number + 1}`;
}
