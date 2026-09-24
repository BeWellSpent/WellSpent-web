/** Focused View's ownership rule: mine, or unattributed (0n) — never someone else's. */
export function isMineOrUnattributed(personId: bigint, myPersonId: bigint | undefined): boolean {
  return personId === 0n || personId === myPersonId
}
