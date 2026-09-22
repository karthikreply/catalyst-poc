import { describe, expect, it } from "vitest";

import { breadcrumbForPath, isBrandFlowPath, vendorNavItems } from "./vendor-shell";

describe("vendor shell routing", () => {
  it("keeps only value sessions, funding, and telemetry live", () => {
    expect(vendorNavItems.filter((item) => item.href).map((item) => item.label)).toEqual([
      "Value sessions",
      "Funding",
      "Telemetry",
    ]);
    expect(vendorNavItems.filter((item) => !item.href).every((item) => item.illustrative)).toBe(true);
  });

  it("marks only the partner workflow as brand-led", () => {
    expect(isBrandFlowPath("/scope")).toBe(true);
    expect(isBrandFlowPath("/artifact")).toBe(true);
    expect(isBrandFlowPath("/pilot-spec")).toBe(true);
    expect(isBrandFlowPath("/")).toBe(false);
    expect(isBrandFlowPath("/funding")).toBe(false);
    expect(isBrandFlowPath("/telemetry")).toBe(false);
  });

  it("produces vendor breadcrumbs for dashboard, flow, funding, and telemetry", () => {
    expect(breadcrumbForPath("/")).toEqual(["Partner network", "Dashboard"]);
    expect(breadcrumbForPath("/plan")).toEqual(["Partner network", "Value sessions", "Plan"]);
    expect(breadcrumbForPath("/funding")).toEqual(["Partner network", "Funding"]);
    expect(breadcrumbForPath("/telemetry")).toEqual(["Partner network", "Telemetry"]);
  });
});
