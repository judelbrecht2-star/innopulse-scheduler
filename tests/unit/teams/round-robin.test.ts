import { describe, expect, it } from "vitest";

import { selectRoundRobinHost } from "@/server/teams/select-round-robin-host";

describe("round-robin host selection", () => {
  it("assigns the least-loaded available host", () => {
    expect(selectRoundRobinHost(["host-a", "host-b"], { "host-a": 4, "host-b": 1 }, ["host-a", "host-b"])).toBe("host-b");
  });

  it("uses configured host order to break equal-load ties", () => {
    expect(selectRoundRobinHost(["host-b", "host-a"], { "host-a": 2, "host-b": 2 }, ["host-a", "host-b"])).toBe("host-a");
  });
});
