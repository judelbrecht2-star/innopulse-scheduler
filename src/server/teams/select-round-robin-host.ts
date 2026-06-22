export function selectRoundRobinHost(candidateIds: string[], bookingCounts: Record<string, number>, orderedHostIds: string[]) {
  const order = new Map(orderedHostIds.map((id, index) => [id, index]));
  return [...candidateIds].sort((left, right) =>
    (bookingCounts[left] ?? 0) - (bookingCounts[right] ?? 0) || (order.get(left) ?? 999) - (order.get(right) ?? 999),
  )[0];
}
