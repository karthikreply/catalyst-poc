import type { Brand } from "./brands";
import type { Actor, Delivery, Mechanic, SessionGraph } from "./seed";
import { calculateAnnualValue, calculateDailyValue, formatCurrency, formatPreciseCurrency } from "./value";

export type Viewer = { actor: Actor; name: string; org: string };
export type ClaimsVolumeChoice = "about-400" | "range-250-500" | "unconfirmed";
export type FundingRoute = "invite-karen" | "brief-dana";

export function shouldResetGraph(_pathname: string) {
  return false;
}

export function isQualified(graph: SessionGraph) {
  return graph.valueInputs.every((input) => input.respondentConfirmed) && Boolean(graph.outcome.owner);
}

export function applyDeliveryMode(graph: SessionGraph, delivery: Delivery): SessionGraph {
  const valueInputs = graph.valueInputs.map((input) =>
    delivery === "self-service"
      ? { ...input, confirmedBy: null, respondentConfirmed: true }
      : {
          ...input,
          confirmedBy: input.id === "delay" ? "Dana Reyes" : "Michelle Dorsey",
          respondentConfirmed: true,
        },
  );
  const next = {
    ...graph,
    session: {
      ...graph.session,
      delivery,
      facilitator: delivery === "self-service" ? null : { name: "Ravi Menon", title: "Solution Specialist, AI & Data" },
      qualified: false,
    },
    valueInputs,
  };
  const qualified = delivery === "self-service" ? isQualified(next) : false;
  return bindAnnualValue({
    ...next,
    session: { ...next.session, qualified },
  });
}

export function applyMechanic(graph: SessionGraph, mechanic: Mechanic): SessionGraph {
  return { ...graph, session: { ...graph.session, mechanic } };
}

export function viewerForActor(actor: Actor, brand: Brand): Viewer {
  if (actor === "pdm") {
    return { actor, name: "Priya Raghavan", org: "Platform vendor" };
  }
  if (actor === "cpm") {
    return { actor, name: "Marcus Hale", org: "Platform vendor" };
  }
  return { actor, name: "Ravi Menon", org: brand.partnerName };
}

export function isSessionReadOnly(actor: Actor) {
  return actor === "cpm";
}

export function bindAnnualValue(graph: SessionGraph): SessionGraph {
  const claims = graph.valueInputs.find((input) => input.id === "claims")?.quantity ?? 0;
  const delay = graph.valueInputs.find((input) => input.id === "delay")?.quantity ?? 0;
  const handling = graph.valueInputs.find((input) => input.id === "handling")?.quantity ?? 0;
  return { ...graph, outcome: { ...graph.outcome, annualValue: calculateAnnualValue(claims, delay, handling) } };
}

export function applyClaimsVolumeChoice(graph: SessionGraph, choice: ClaimsVolumeChoice): SessionGraph {
  const quantity = choice === "range-250-500" ? 375 : 400;
  const confirmedBy = choice === "unconfirmed" ? null : graph.valueInputs.find((input) => input.id === "claims")?.confirmedBy ?? "Michelle Dorsey";
  const valueInputs = graph.valueInputs.map((input) =>
    input.id === "claims"
      ? { ...input, quantity, confirmedBy: choice === "unconfirmed" ? null : confirmedBy, respondentConfirmed: choice !== "unconfirmed" }
      : input,
  );
  const costComponents = graph.costComponents.map((component) => ({
    ...component,
    inputs: component.inputs.map((input) =>
      input.label === "Claims per day" ? { ...input, quantity } : input,
    ),
  }));
  return bindAnnualValue({
    ...graph,
    session: { ...graph.session, claimsVolumeChoice: choice },
    valueInputs,
    costComponents,
    outcome: { ...graph.outcome, partiallyEstimated: choice === "unconfirmed" },
  });
}

export function claimsPayoffCopy(graph: SessionGraph) {
  const claims = graph.valueInputs.find((input) => input.id === "claims");
  const delay = graph.valueInputs.find((input) => input.id === "delay");
  const handling = graph.valueInputs.find((input) => input.id === "handling");
  if (!claims || !delay || !handling) return "";
  if (!claims.confirmedBy) {
    return "Unconfirmed estimate. The artifact will carry that label until volume is confirmed.";
  }
  if (graph.session.claimsVolumeChoice === "range-250-500") {
    return "250–500/day × 2 avoidable days × $38.75 → about $19,000–$39,000/day, $4.8M–$9.7M a year.\nInside the library's $2M–$9M range for this pattern.";
  }
  const daily = formatCurrency(calculateDailyValue(claims.quantity, delay.quantity, handling.quantity));
  const millions = (calculateAnnualValue(claims.quantity, delay.quantity, handling.quantity) / 1_000_000).toFixed(2).replace(/\.00$/, "");
  return [
    `${claims.quantity}/day × ${delay.quantity} avoidable days × ${formatPreciseCurrency(handling.quantity)} → ${daily}/day, ~$${millions}M a year`,
    "Top of the library's $2M–$9M range for this pattern.",
  ].join("\n");
}

export function applyFundingRoute(graph: SessionGraph, route: FundingRoute): SessionGraph {
  return {
    ...graph,
    session: { ...graph.session, fundingRoute: route },
    attendees: graph.attendees.map((person) =>
      person.id === "karen"
        ? route === "invite-karen"
          ? { ...person, attendance: "attending", reason: "Economic buyer · invited" }
          : { ...person, attendance: "invited-not-attending", reason: "not attending — Dana carries the ask" }
        : person,
    ),
  };
}

export function fundingAskCopy(graph: SessionGraph) {
  if (graph.session.fundingRoute === "brief-dana") {
    return "Dana Reyes: carry the funding ask. Brief Karen so she can fund the six-week pilot and allow Alex Chen’s team to prepare 500 anonymised claims.";
  }
  return "Karen Whitfield, CFO: fund the six-week pilot and allow Alex Chen’s team to prepare 500 anonymised claims.";
}

export function applyPatternChoice(graph: SessionGraph, patternId: string): SessionGraph {
  return { ...graph, session: { ...graph.session, patternId } };
}

export function applyReusePriorPilotSpec(graph: SessionGraph, reuse: boolean): SessionGraph {
  return { ...graph, session: { ...graph.session, reusePriorPilotSpec: reuse } };
}
