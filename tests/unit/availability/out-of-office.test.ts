import { describe, expect, it } from "vitest";

import { datesInRange, groupOutOfOfficeOverrides } from "@/server/availability/out-of-office";

describe("out-of-office helpers", () => {
  it("expands an inclusive date range", () => {
    expect(datesInRange("2026-06-19", "2026-06-21").map((date) => date.toISOString().slice(0, 10))).toEqual(["2026-06-19", "2026-06-20", "2026-06-21"]);
  });

  it("groups consecutive dates with the same note", () => {
    const periods = groupOutOfOfficeOverrides([
      { date: new Date("2026-06-19T00:00:00.000Z"), note: "Conference" },
      { date: new Date("2026-06-20T00:00:00.000Z"), note: "Conference" },
      { date: new Date("2026-06-22T00:00:00.000Z"), note: null },
    ]);
    expect(periods).toEqual([
      { startDate: "2026-06-19", endDate: "2026-06-20", note: "Conference" },
      { startDate: "2026-06-22", endDate: "2026-06-22", note: "" },
    ]);
  });
});
