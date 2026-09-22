import { describe, expect, it } from "vitest";

import { initialSessionGraph } from "./seed";
import {
  annualFromMonthly,
  componentMonthlyTotal,
  freezeLedger,
  ledgerMonthlyTotal,
  perSecondRate,
} from "./cost-model";
import { calculateDailyValue } from "./value";

describe("ghost ledger cost model", () => {
  it("derives monthly totals from inputs only", () => {
    const handling = initialSessionGraph.costComponents.find((row) => row.id === "handling")!;
    expect(componentMonthlyTotal(handling)).toBe(calculateDailyValue(400, 2, 38.75) * 30);
    expect(ledgerMonthlyTotal(initialSessionGraph.costComponents)).toBe(1_219_004);
    expect(perSecondRate(1_219_004)).toBeCloseTo(1_219_004 / (30 * 24 * 3600), 6);
  });

  it("freeze writes annual into outcome and does not edit inputs", () => {
    const frozen = freezeLedger(initialSessionGraph);
    expect(frozen.session.ledgerFrozen).toBe(true);
    expect(frozen.outcome.annualValue).toBe(annualFromMonthly(1_219_004));
    expect(frozen.costComponents).toEqual(initialSessionGraph.costComponents);
  });

  it("partial estimate when any confirmedBy is null", () => {
    const partial = {
      ...initialSessionGraph,
      costComponents: initialSessionGraph.costComponents.map((row) =>
        row.id === "overtime" ? { ...row, confirmedBy: null } : row,
      ),
    };
    expect(freezeLedger(partial).outcome.partiallyEstimated).toBe(true);
  });
});
