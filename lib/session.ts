import type { Brand } from "./brands";
import type { Actor, Delivery, Mechanic, SessionGraph } from "./seed";
import { calculateAnnualValue } from "./value";

export type Viewer = { actor: Actor; name: string; org: string };

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
