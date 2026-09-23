import type { Brand } from "./brands";
import { ledgerAnnualTotal } from "./cost-model";
import {
  initialSessionGraph,
  patterns,
  prework,
  type Actor,
  type ColdAttendee,
  type ColdCompany,
  type Delivery,
  type Mechanic,
  type SessionGraph,
} from "./seed";
import { calculateAnnualValue, calculateDailyValue, formatCurrency, formatPreciseCurrency } from "./value";

export type Viewer = { actor: Actor; name: string; org: string };
export type ClaimsVolumeChoice = "about-400" | "range-250-500" | "unconfirmed";
export type FundingRoute = "invite-karen" | "brief-dana";

const coldRoleRules = [
  { role: "Operations owner", matches: ["operations", "claims ops", "vp claims", "head of claims"], reason: "Owns the operating outcome and can sponsor the pilot." },
  { role: "Frontline supervisor", matches: ["supervisor", "frontline", "team lead", "claims manager"], reason: "Brings the frontline workflow and handling-cost evidence." },
  { role: "Developer", matches: ["developer", "engineer", "technical lead"], reason: "Can confirm integration constraints and own the pilot." },
  { role: "Compliance", matches: ["compliance", "risk", "audit"], reason: "Sessions that invite compliance late lose two weeks." },
  { role: "Infrastructure", matches: ["infrastructure", "platform", "cloud", "architect"], reason: "Confirms data access, security, and deployment boundaries." },
  { role: "Economic buyer", matches: ["cfo", "finance", "economic buyer", "executive sponsor"], reason: "Can fund the pilot." },
] as const;

function matchedColdRole(role: string) {
  const normalized = role.toLowerCase();
  return coldRoleRules.find((rule) => rule.matches.some((term) => normalized.includes(term)));
}

export function coldRoleMatch(role: string) {
  return matchedColdRole(role)?.role ?? null;
}

export const coldScopeDefaults: { company: ColdCompany; attendees: ColdAttendee[] } = {
  company: { name: "Northwind Insurance", industry: "Insurance", sizeBand: "$500M–$1B" },
  attendees: [
    { name: "Laura Beckett", role: "VP Claims Operations" },
    { name: "Sam Ortiz", role: "Claims Supervisor" },
    { name: "Devin Cole", role: "Senior Developer" },
  ],
};

export function restoreSeededGraph(saved: SessionGraph | null) {
  return saved?.session.scopeMode === "seeded" ? saved : initialSessionGraph;
}

function patternForIndustry(industry: string) {
  const normalized = industry.toLowerCase();
  if (/(bank|financial|fraud)/.test(normalized)) return "fraud-triage";
  if (/(contact|call centre|telecom|retail)/.test(normalized)) return "contact-centre-summarisation";
  if (/(knowledge|professional services)/.test(normalized)) return "knowledge-retrieval";
  return "document-intake";
}

export function applyColdScope(
  graph: SessionGraph,
  company: ColdCompany,
  attendees: ColdAttendee[],
): SessionGraph {
  return {
    ...graph,
    session: {
      ...graph.session,
      scopeMode: "cold",
      customerName: company.name,
      customerContext: `${company.sizeBand} ${company.industry}`,
      industry: company.industry,
      patternId: patternForIndustry(company.industry),
    },
    coldCompany: company,
    coldAttendees: attendees,
    captures: [],
    valueInputs: graph.valueInputs.map((input) => ({
      ...input,
      confirmedBy: null,
      respondentConfirmed: false,
    })),
    costComponents: graph.costComponents.map((component) => ({
      ...component,
      confirmedBy: null,
    })),
    outcome: {
      ...graph.outcome,
      owner: attendees.find((person) => matchedColdRole(person.role)?.role === "Developer")?.name ?? null,
      partiallyEstimated: true,
    },
    attendees: attendees.filter((person) => person.name.trim() && person.role.trim()).map((person, index) => {
      const match = matchedColdRole(person.role);
      return {
        id: `cold-attendee-${index + 1}`,
        name: person.name,
        role: person.role,
        reason: match?.reason ?? "Participant named during cold scope.",
        source: "typed",
        attendance: "attending",
      };
    }),
  };
}

export function missingColdRoles(graph: SessionGraph) {
  if (graph.session.scopeMode !== "cold") return [];
  const pattern = patterns.find((item) => item.id === graph.session.patternId);
  if (!pattern) return [];
  const matched = new Set<string>(
    graph.coldAttendees.flatMap((person) => {
      const role = matchedColdRole(person.role);
      return role ? [role.role] : [];
    }),
  );
  return pattern.requiredRoles
    .filter((role) => !matched.has(role))
    .map((role) => ({
      role,
      reason: coldRoleRules.find((rule) => rule.role === role)?.reason ?? `Add a ${role.toLowerCase()} for this pattern.`,
    }));
}

export function shouldResetGraph(_pathname: string) {
  void _pathname;
  return false;
}

export function isQualified(graph: SessionGraph) {
  return graph.valueInputs.every((input) => input.respondentConfirmed) && Boolean(graph.outcome.owner);
}

export function applyDeliveryMode(graph: SessionGraph, delivery: Delivery): SessionGraph {
  const valueInputs = graph.valueInputs.map((input) =>
    delivery === "self-service"
      ? { ...input, confirmedBy: null, respondentConfirmed: true }
      : graph.session.scopeMode === "cold"
        ? { ...input, confirmedBy: null }
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
  return bindAnnualValue({
    ...graph,
    session: { ...graph.session, mechanic, ledgerFrozen: false },
  });
}

export function agendaForSession(graph: SessionGraph) {
  return graph.agenda.map((step) => {
    if (step.id === "volume-and-cost" && graph.session.mechanic === "ghost-ledger") {
      return {
        ...step,
        title: "Build the ledger",
        prompt: "What do tool spend, overtime, rework rate, and review hours cost today?",
      };
    }
    if (step.id === "owner-and-ask" && graph.session.fundingRoute === "brief-dana") {
      return {
        ...step,
        prompt: "Who owns this, and can Dana carry the funding ask to Karen?",
      };
    }
    return step;
  });
}

export function preworkForMechanic(mechanic: Mechanic) {
  if (mechanic !== "ghost-ledger") return prework;
  return [
    ...prework,
    "Bring the current tool spend for claims intake.",
    "Bring recent overtime spend tied to intake volume.",
    "Estimate the current rework rate.",
    "Estimate weekly review hours for low-confidence claims.",
  ];
}

export function pdmPartnerInvitationCopy(brand: Brand, customerName = "Heartland Mutual Insurance") {
  return `Hi Ravi,

${customerName} looks ready for a focused value session on an account you own. Run it with the customer team to turn the opportunity into a scoped six-week pilot.

There is partner development funding available if the evidence supports the pilot, and the resulting business case carries ${brand.partnerName}'s brand. You keep the customer relationship and the next step.

Regards,
Priya Raghavan · Platform vendor`;
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
  const annualValue = graph.session.mechanic === "ghost-ledger"
    ? ledgerAnnualTotal(graph.costComponents)
    : calculateAnnualValue(claims, delay, handling);
  return { ...graph, outcome: { ...graph.outcome, annualValue } };
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
    confirmedBy: component.id === "handling"
      ? choice === "unconfirmed"
        ? null
        : component.confirmedBy ?? "Michelle Dorsey"
      : component.confirmedBy,
    inputs: component.inputs.map((input) =>
      input.label === "Claims per day" ? { ...input, quantity } : input,
    ),
  }));
  return bindAnnualValue({
    ...graph,
    session: { ...graph.session, claimsVolumeChoice: choice, ledgerFrozen: false },
    valueInputs,
    costComponents,
    outcome: { ...graph.outcome, partiallyEstimated: choice !== "about-400" },
  });
}

export function claimsPayoffCopy(graph: SessionGraph) {
  const claims = graph.valueInputs.find((input) => input.id === "claims");
  const delay = graph.valueInputs.find((input) => input.id === "delay");
  const handling = graph.valueInputs.find((input) => input.id === "handling");
  if (!claims || !delay || !handling) return "";
  if (!claims.confirmedBy) {
    return "Artifact will label this an unconfirmed estimate.";
  }
  if (graph.session.claimsVolumeChoice === "range-250-500") {
    return "250–500 × 2 × $38.75 → $19,000–$39,000/day · $4.8M–$9.7M/year · spans the library range";
  }
  const daily = formatCurrency(calculateDailyValue(claims.quantity, delay.quantity, handling.quantity));
  const millions = (calculateAnnualValue(claims.quantity, delay.quantity, handling.quantity) / 1_000_000).toFixed(2).replace(/\.00$/, "");
  return `${claims.quantity} × ${delay.quantity} × ${formatPreciseCurrency(handling.quantity)} → ${daily}/day · $${millions}M/year · top of the library range`;
}

export function inputsConfirmedByCopy(graph: SessionGraph) {
  const names = [...new Set(graph.valueInputs.flatMap((input) => (input.confirmedBy ? [input.confirmedBy] : [])))];
  if (names.length === 0) return "Volume is an unconfirmed estimate from scope.";
  if (names.length === 1) return `Inputs confirmed by ${names[0]}.`;
  if (names.length === 2) return `Inputs confirmed by ${names[0]} and ${names[1]}.`;
  return `Inputs confirmed by ${names.slice(0, -1).join(", ")}, and ${names.at(-1)}.`;
}

export const artifactLimitsCopy = {
  heading: "What this case does not yet prove",
  body: "Extraction accuracy on Heartland's own forms, including handwritten adjuster notes. Whether the 15% Michelle flagged behaves as her team expects. Actual review time once fields are pre-filled. The pilot exists to answer these.",
};

export function artifactPilotScopeCopy(graph: SessionGraph, brand: Brand) {
  const base = "AI-assisted extraction from 500 anonymised claims";
  if (graph.session.reusePriorPilotSpec === false) return `${base}; starts a fresh pilot spec`;
  return `${base}; reuses ${brand.partnerName}'s prior document-pattern pilot spec`;
}

export function canFlagReferenceStory(actor: Actor) {
  return actor !== "partner";
}

export function artifactActions(actor: Actor, qualified: boolean, delivery: Delivery) {
  if (actor === "partner") {
    if (delivery === "self-service") {
      return {
        primary: "Request a facilitated session",
        secondary: "Start DAF funding request",
        tertiary: "Contact my partner manager with this business case",
      };
    }
    return {
      primary: "Start DAF funding request",
      secondary: qualified ? "Request a facilitated session" : "Schedule pilot kickoff",
      tertiary: "Contact my partner manager with this business case",
    };
  }
  return {
    primary: "Review funding request",
    secondary: null,
    tertiary: null,
  };
}

export function claimsArtifactCopy(graph: SessionGraph) {
  const claims = graph.valueInputs.find((input) => input.id === "claims");
  const delay = graph.valueInputs.find((input) => input.id === "delay");
  const handling = graph.valueInputs.find((input) => input.id === "handling");
  if (!claims || !delay || !handling) {
    return { headline: "", detail: "", status: null };
  }
  if (graph.session.claimsVolumeChoice === "unconfirmed") {
    return {
      headline: "Value pending volume confirmation",
      detail: "Claims volume was not confirmed in Scope. Confirm it before using a point estimate in the funding case.",
      status: "Unconfirmed estimate",
    };
  }
  if (graph.session.claimsVolumeChoice === "range-250-500") {
    return {
      headline: "$19,000–$39,000 / day",
      detail: "250–500 claims per day × 2 avoidable days × $38.75 handling cost. At 250 working days, that is $4.8M–$9.7M per year.",
      status: "Range estimate · spans the library range",
    };
  }
  const daily = formatCurrency(calculateDailyValue(claims.quantity, delay.quantity, handling.quantity));
  return {
    headline: `${claims.quantity} × ${delay.quantity} × ${formatPreciseCurrency(handling.quantity)} = ${daily} / day`,
    detail: `${claims.quantity} claims per day × ${delay.quantity} avoidable days × ${formatPreciseCurrency(handling.quantity)} handling cost. At 250 working days, that is ${formatCurrency(graph.outcome.annualValue)} per year.`,
    status: null,
  };
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
  if (graph.session.scopeMode === "cold") {
    const economicBuyer = graph.attendees.find((attendee) => /cfo|finance|economic buyer|executive sponsor/i.test(attendee.role));
    const technicalOwner = graph.attendees.find((attendee) => /developer|engineer|technical lead/i.test(attendee.role));
    if (!economicBuyer) {
      return "Confirm an economic buyer before requesting funding for the six-week pilot.";
    }
    return `${economicBuyer.name}: fund the six-week pilot${technicalOwner ? ` and allow ${technicalOwner.name} to prepare the pilot data` : ""}.`;
  }
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
