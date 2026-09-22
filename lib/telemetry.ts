import type { Actor } from "./seed";

export type TelemetryOutcome = "Scoped" | "Run" | "Pilot proposed" | "Pilot funded";
export type TelemetryPartner = "CDW" | "SoftwareOne" | "Insight" | "SHI";
export type TelemetryDelivery = "facilitated" | "self-service";
export type TelemetryMechanic = "value-sprint" | "ghost-ledger";

export type TelemetrySession = {
  id: string;
  quarter: string;
  partner: TelemetryPartner;
  industry: string;
  pattern: string;
  outcome: TelemetryOutcome;
  fundedValue: number;
  opportunityValue?: number;
  customer?: string;
  delivery: TelemetryDelivery;
  mechanic: TelemetryMechanic;
  qualified: boolean;
  converted: boolean;
  daysToFunded: number | null;
};

export const telemetryBenchmarks = {
  facilitatedSessions: 150,
  selfServiceSessions: 100,
  facilitatedConverted: 90,
  selfServiceConverted: 22,
  selfServiceQualified: 45,
  facilitatedConversionRate: 60,
  selfServiceConversionRate: 22,
  selfServiceQualificationRate: 45,
  valueSprintSessions: 205,
  valueSprintConverted: 82,
  ghostLedgerSessions: 45,
  ghostLedgerConverted: 30,
  valueSprintConversionRate: 58,
  ghostLedgerConversionRate: 67,
} as const;

const partners: TelemetryPartner[] = ["CDW", "SoftwareOne", "Insight", "SHI"];
const industries = ["Insurance", "Banking", "Healthcare", "Manufacturing", "Retail", "Public sector"];
const patterns = ["Document-heavy intake", "Contact-centre summarisation", "Knowledge retrieval", "Fraud triage"];
const quarters = ["Q4 2024", "Q1 2025", "Q2 2025", "Q3 2025", "Q4 2025", "Q1 2026", "Q2 2026", "Q3 2026"];

function row(
  index: number,
  delivery: TelemetryDelivery,
  converted: boolean,
  qualified: boolean,
  mechanic: TelemetryMechanic,
): TelemetrySession {
  const outcome: TelemetryOutcome = converted ? "Pilot funded" : qualified ? "Pilot proposed" : "Run";
  return {
    id: `session-${String(index + 1).padStart(3, "0")}`,
    quarter: quarters[index % quarters.length],
    partner: partners[index % partners.length],
    industry: industries[index % industries.length],
    pattern: patterns[index % patterns.length],
    outcome,
    fundedValue: converted ? 180_000 + (index % 9) * 55_000 : 0,
    delivery,
    mechanic,
    qualified,
    converted,
    daysToFunded: converted ? 21 + (index % 40) : null,
  };
}

export function buildTelemetrySessions(): TelemetrySession[] {
  const rows: TelemetrySession[] = [];
  for (let index = 0; index < 150; index += 1) {
    rows.push(row(index, "facilitated", index < 90, false, "value-sprint"));
  }
  for (let index = 0; index < 100; index += 1) {
    rows.push(row(150 + index, "self-service", index < 22, index < 45, "value-sprint"));
  }
  const convertedIndexes = rows.flatMap((item, index) => (item.converted ? [index] : []));
  const unconvertedIndexes = rows.flatMap((item, index) => (!item.converted ? [index] : []));
  const ghostIndexes = [...convertedIndexes.slice(0, 30), ...unconvertedIndexes.slice(0, 15)];
  for (const index of ghostIndexes) {
    rows[index] = { ...rows[index], mechanic: "ghost-ledger" };
  }
  return rows;
}

export function summarizeTelemetry(rows: TelemetrySession[]) {
  return {
    sessionsRun: rows.filter((item) => item.outcome !== "Scoped").length,
    pilotsProposed: rows.filter((item) => item.outcome === "Pilot proposed" || item.outcome === "Pilot funded").length,
    pilotsFunded: rows.filter((item) => item.outcome === "Pilot funded").length,
    fundedPipelineValue: rows.reduce((sum, item) => sum + item.fundedValue, 0),
  };
}

export function scopeTelemetry(
  rows: TelemetrySession[],
  opts: { actor: Actor; partnerName: string },
) {
  if (opts.actor === "partner") return rows.filter((item) => item.partner === opts.partnerName);
  return rows;
}

export const telemetrySeed = Object.freeze(buildTelemetrySessions());
