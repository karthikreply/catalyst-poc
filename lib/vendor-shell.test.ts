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
    expect(isBrandFlowPath("/scope", "partner")).toBe(true);
    expect(isBrandFlowPath("/artifact", "cpm")).toBe(true);
    expect(isBrandFlowPath("/pilot-spec", "pdm")).toBe(true);
    expect(isBrandFlowPath("/", "partner")).toBe(false);
    expect(isBrandFlowPath("/funding", "partner")).toBe(true);
    expect(isBrandFlowPath("/funding", "pdm")).toBe(false);
    expect(isBrandFlowPath("/funding", "cpm")).toBe(false);
    expect(isBrandFlowPath("/telemetry", "partner")).toBe(false);
  });

  it("produces vendor breadcrumbs for dashboard, flow, funding, and telemetry", () => {
    expect(breadcrumbForPath("/")).toEqual(["Partner network", "Dashboard"]);
    expect(breadcrumbForPath("/plan")).toEqual(["Partner network", "Value sessions", "Plan"]);
    expect(breadcrumbForPath("/funding")).toEqual(["Partner network", "Funding"]);
    expect(breadcrumbForPath("/telemetry")).toEqual(["Partner network", "Telemetry"]);
  });
});
