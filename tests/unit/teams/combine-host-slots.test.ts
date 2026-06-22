import { describe, expect, it } from "vitest";

import { combineHostSlots } from "@/server/teams/combine-host-slots";

const nine = { start: "2026-07-01T07:00:00.000Z", end: "2026-07-01T07:30:00.000Z" };
const ten = { start: "2026-07-01T08:00:00.000Z", end: "2026-07-01T08:30:00.000Z" };

describe("team slot combination", () => {
  it("returns the union for round-robin scheduling", () => {
    const result = combineHostSlots([{ hostId: "a", slots: [nine] }, { hostId: "b", slots: [ten] }]);
    expect(result.slots).toEqual([nine, ten]);
  });

  it("returns only the intersection for collective scheduling", () => {
    const result = combineHostSlots([{ hostId: "a", slots: [nine, ten] }, { hostId: "b", slots: [nine] }], true);
    expect(result.slots).toEqual([nine]);
    expect(result.slotHosts[nine.start]).toEqual(["a", "b"]);
  });
});
