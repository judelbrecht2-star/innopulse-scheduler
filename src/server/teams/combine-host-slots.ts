import type { GeneratedSlot } from "@/server/availability/types";

export function combineHostSlots(hostAvailability: Array<{ hostId: string; slots: GeneratedSlot[] }>, collective = false) {
  const slotsByStart = new Map<string, { start: string; end: string; hostIds: string[] }>();
  for (const availability of hostAvailability) {
    for (const slot of availability.slots) {
      const existing = slotsByStart.get(slot.start);
      if (existing) existing.hostIds.push(availability.hostId);
      else slotsByStart.set(slot.start, { ...slot, hostIds: [availability.hostId] });
    }
  }
  const required = collective ? hostAvailability.length : 1;
  const combined = [...slotsByStart.values()].filter((slot) => slot.hostIds.length >= required).sort((left, right) => left.start.localeCompare(right.start));
  return {
    slots: combined.map(({ start, end }) => ({ start, end })),
    slotHosts: Object.fromEntries(combined.map((slot) => [slot.start, slot.hostIds])),
  };
}
