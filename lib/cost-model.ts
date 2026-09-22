import type { CostComponent, SessionGraph } from "./seed";
import { calculateDailyValue } from "./value";

function qty(component: CostComponent, label: string) {
  const input = component.inputs.find((row) => row.label === label);
  if (!input) throw new Error(`${component.id} is missing ${label}`);
  return input.quantity;
}

export function componentMonthlyTotal(component: CostComponent): number {
  switch (component.id) {
    case "handling":
      return calculateDailyValue(qty(component, "Claims per day"), qty(component, "Avoidable delay"), qty(component, "Handling cost")) * 30;
    case "review":
      return Math.round(qty(component, "Hours per week") * 4.33 * qty(component, "Loaded rate"));
    case "rework":
      return Math.round(qty(component, "Claims per day") * 30 * qty(component, "Reopen rate") * qty(component, "Cost each"));
    case "overtime":
      return Math.round(qty(component, "Monthly overtime"));
    default:
      throw new Error(`Unknown component ${component.id}`);
  }
}

export function ledgerMonthlyTotal(components: CostComponent[]) {
  return components.reduce((sum, row) => sum + componentMonthlyTotal(row), 0);
}

export function perSecondRate(monthlyTotal: number) {
  return monthlyTotal / (30 * 24 * 3600);
}

export function annualFromMonthly(monthlyTotal: number) {
  return Math.round(monthlyTotal * 12);
}

export function freezeLedger(graph: SessionGraph): SessionGraph {
  const monthly = ledgerMonthlyTotal(graph.costComponents);
  return {
    ...graph,
    session: { ...graph.session, ledgerFrozen: true },
    outcome: {
      ...graph.outcome,
      annualValue: annualFromMonthly(monthly),
      partiallyEstimated: graph.costComponents.some((row) => row.confirmedBy === null),
    },
  };
}
