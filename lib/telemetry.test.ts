import { describe, expect, it } from "vitest";

import { buildTelemetrySessions, scopeTelemetry, telemetryBenchmarks } from "./telemetry";

describe("telemetryBenchmarks", () => {
  it("exports the pinned rates and counts", () => {
    expect(telemetryBenchmarks.facilitatedSessions).toBe(150);
    expect(telemetryBenchmarks.selfServiceSessions).toBe(100);
    expect(telemetryBenchmarks.facilitatedConverted).toBe(90);
    expect(telemetryBenchmarks.selfServiceConverted).toBe(22);
    expect(telemetryBenchmarks.selfServiceQualified).toBe(45);
    expect(telemetryBenchmarks.facilitatedConversionRate).toBe(60);
    expect(telemetryBenchmarks.selfServiceConversionRate).toBe(22);
    expect(telemetryBenchmarks.selfServiceQualificationRate).toBe(45);
    expect(telemetryBenchmarks.ghostLedgerSessions).toBe(45);
    expect(telemetryBenchmarks.ghostLedgerConverted).toBe(30);
    expect(telemetryBenchmarks.valueSprintConversionRate).toBe(58);
    expect(telemetryBenchmarks.ghostLedgerConversionRate).toBe(67);
  });

  it("seeds exact cohort sizes", () => {
    const rows = buildTelemetrySessions();
    expect(rows).toHaveLength(250);
    expect(rows.filter((item) => item.delivery === "facilitated")).toHaveLength(150);
    expect(rows.filter((item) => item.delivery === "self-service")).toHaveLength(100);
    expect(rows.filter((item) => item.delivery === "facilitated" && item.converted)).toHaveLength(90);
    expect(rows.filter((item) => item.delivery === "self-service" && item.converted)).toHaveLength(22);
    expect(rows.filter((item) => item.delivery === "self-service" && item.qualified)).toHaveLength(45);
    expect(rows.filter((item) => item.mechanic === "value-sprint")).toHaveLength(205);
    expect(rows.filter((item) => item.mechanic === "ghost-ledger")).toHaveLength(45);
    expect(rows.filter((item) => item.mechanic === "ghost-ledger" && item.converted)).toHaveLength(30);
  });

  it("filters partner view to the active brand only", () => {
    const rows = buildTelemetrySessions();
    const scoped = scopeTelemetry(rows, { actor: "partner", partnerName: "SoftwareOne" });
    expect(scoped.every((item) => item.partner === "SoftwareOne")).toBe(true);
    expect(scoped.some((item) => item.partner === "CDW")).toBe(false);
    expect(scopeTelemetry(rows, { actor: "pdm", partnerName: "SoftwareOne" }).map((item) => item.partner)).toEqual(
      expect.arrayContaining(["CDW", "SoftwareOne", "Insight", "SHI"]),
    );
    expect(scopeTelemetry(rows, { actor: "cpm", partnerName: "SoftwareOne" }).map((item) => item.partner)).toEqual(
      expect.arrayContaining(["CDW", "SoftwareOne", "Insight", "SHI"]),
    );
  });
});
