import { describe, expect, it } from "vitest";

import { brands } from "./brands";
import { freezeLedger, ledgerAnnualTotal } from "./cost-model";
import { initialSessionGraph } from "./seed";
import {
  agendaForSession,
  applyClaimsVolumeChoice,
  applyColdScope,
  applyDeliveryMode,
  applyFundingRoute,
  applyMechanic,
  artifactActions,
  artifactLimitsCopy,
  artifactPilotScopeCopy,
  claimsArtifactCopy,
  claimsPayoffCopy,
  fundingAskCopy,
  inputsConfirmedByCopy,
  missingColdRoles,
  isQualified,
  isSessionReadOnly,
  pdmPartnerInvitationCopy,
  preworkForMechanic,
  shouldResetGraph,
  viewerForActor,
} from "./session";
import { calculateAnnualValue } from "./value";

describe("applyDeliveryMode", () => {
  it("keeps edited values and captures when switching delivery", () => {
    const edited = {
      ...initialSessionGraph,
      valueInputs: initialSessionGraph.valueInputs.map((input) =>
        input.id === "handling" ? { ...input, quantity: 31 } : input,
      ),
      captures: [
        ...initialSessionGraph.captures,
        {
          id: "cap-extra",
          sessionId: initialSessionGraph.session.id,
          stepId: "constraints",
          attributedTo: "Dana Reyes",
          text: "Keep the overtime evidence.",
          capturedAt: "2026-09-21T10:50:00-05:00",
        },
      ],
    };
    const selfServe = applyDeliveryMode(edited, "self-service");
    expect(selfServe.session.delivery).toBe("self-service");
    expect(selfServe.session.facilitator).toBeNull();
    expect(selfServe.valueInputs.every((input) => input.confirmedBy === null)).toBe(true);
    expect(selfServe.valueInputs.find((input) => input.id === "handling")?.quantity).toBe(31);
    expect(selfServe.captures).toHaveLength(edited.captures.length);
    expect(isQualified(selfServe)).toBe(true);

    const back = applyDeliveryMode(selfServe, "facilitated");
    expect(back.session.facilitator?.name).toBe("Ravi Menon");
    expect(back.valueInputs.find((input) => input.id === "handling")?.quantity).toBe(31);
    expect(back.valueInputs.find((input) => input.id === "handling")?.confirmedBy).toBe("Michelle Dorsey");
    expect(back.captures).toHaveLength(edited.captures.length);
    expect(back.outcome.annualValue).toBe(calculateAnnualValue(400, 2, 31));
  });
});

describe("ghost-ledger annual value binding", () => {
  it("keeps delivery changes on the ledger annual rather than the sprint annual", () => {
    const frozen = freezeLedger(applyMechanic(initialSessionGraph, "ghost-ledger"));
    const changed = applyDeliveryMode(frozen, "self-service");

    expect(changed.session.ledgerFrozen).toBe(true);
    expect(changed.outcome.annualValue).toBe(ledgerAnnualTotal(changed.costComponents));
  });

  it("unfreezes and recomputes the ledger when a source quantity changes", () => {
    const frozen = freezeLedger(applyMechanic(initialSessionGraph, "ghost-ledger"));
    const changed = applyClaimsVolumeChoice(frozen, "range-250-500");

    expect(changed.session.ledgerFrozen).toBe(false);
    expect(changed.outcome.annualValue).toBe(ledgerAnnualTotal(changed.costComponents));
  });
});

describe("applyMechanic", () => {
  it("preserves session evidence while rebinding the active mechanic value", () => {
    const edited = applyDeliveryMode(initialSessionGraph, "self-service");
    const ghost = applyMechanic(edited, "ghost-ledger");
    expect(ghost.session.mechanic).toBe("ghost-ledger");
    expect(ghost.session.delivery).toBe("self-service");
    expect(ghost.captures).toEqual(edited.captures);
    expect(ghost.agenda).toEqual(edited.agenda);
    expect(ghost.valueInputs).toEqual(edited.valueInputs);
    expect(ghost.costComponents).toEqual(edited.costComponents);
    expect(ghost.outcome.annualValue).toBe(ledgerAnnualTotal(ghost.costComponents));
    const restored = applyMechanic(freezeLedger(ghost), "value-sprint");
    expect(restored.session.mechanic).toBe("value-sprint");
    expect(restored.session.ledgerFrozen).toBe(false);
    expect(restored.outcome.annualValue).toBe(calculateAnnualValue(400, 2, 38.75));
  });
});

describe("plan consequences", () => {
  it("turns agenda step 2 and pre-work into a ghost ledger plan", () => {
    const ghost = applyMechanic(initialSessionGraph, "ghost-ledger");
    const step = agendaForSession(ghost).find((item) => item.id === "volume-and-cost");

    expect(step?.title).toBe("Build the ledger");
    expect(step?.prompt).toMatch(/tool spend, overtime, rework rate, and review hours/i);
    expect(preworkForMechanic("ghost-ledger")).toEqual(expect.arrayContaining([
      expect.stringMatching(/tool spend/i),
      expect.stringMatching(/overtime/i),
      expect.stringMatching(/rework rate/i),
      expect.stringMatching(/review hours/i),
    ]));
    expect(preworkForMechanic("value-sprint")).not.toEqual(expect.arrayContaining([
      expect.stringMatching(/tool spend/i),
    ]));
  });

  it("removes ghost-ledger agenda and pre-work when value sprint is restored", () => {
    const ghost = applyMechanic(initialSessionGraph, "ghost-ledger");
    const restored = applyMechanic(ghost, "value-sprint");

    expect(agendaForSession(restored).find((item) => item.id === "volume-and-cost")?.title)
      .toBe("Volume and cost");
    expect(preworkForMechanic(restored.session.mechanic)).not.toEqual(expect.arrayContaining([
      expect.stringMatching(/tool spend|overtime|rework rate|review hours/i),
    ]));
  });

  it("carries the funding route into agenda step 5", () => {
    const invited = applyFundingRoute(initialSessionGraph, "invite-karen");
    const delegated = applyFundingRoute(initialSessionGraph, "brief-dana");

    expect(agendaForSession(invited).find((item) => item.id === "owner-and-ask")?.prompt)
      .toMatch(/asking Karen/i);
    expect(agendaForSession(delegated).find((item) => item.id === "owner-and-ask")?.prompt)
      .toMatch(/Dana carry the funding ask/i);
  });

  it("creates a vendor PDM invitation to the partner", () => {
    const invitation = pdmPartnerInvitationCopy(brands.cdw);

    expect(invitation).toMatch(/^Hi Ravi,/);
    expect(invitation).toContain("Heartland Mutual Insurance");
    expect(invitation).toMatch(/account you own/i);
    expect(invitation).toMatch(/funding available/i);
    expect(invitation).toMatch(/CDW('s)? brand/i);
    expect(invitation).toContain("Priya Raghavan · Platform vendor");
  });

  it("gives Softchoice its own document and invitation voice", () => {
    expect(brands.softchoice.partnerName).toBe("Softchoice");
    expect(brands.softchoice.emailIntro).not.toBe(brands.cdw.emailIntro);
    expect(brands.softchoice.artifactIntro).toMatch(/Softchoice/);
    expect(brands.softchoice.artifactClosing).toMatch(/Softchoice/);
    expect(pdmPartnerInvitationCopy(brands.softchoice)).toMatch(/Softchoice('s)? brand/);
    expect(viewerForActor("partner", brands.softchoice).org).toBe("Softchoice");
  });
});

describe("shouldResetGraph", () => {
  it("does not treat gate or scope as a graph reset", () => {
    expect(shouldResetGraph("/")).toBe(false);
    expect(shouldResetGraph("/scope")).toBe(false);
    expect(shouldResetGraph("/run")).toBe(false);
  });
});

describe("actor model", () => {
  it("maps the three authenticated actors without an end-customer viewer", () => {
    expect(viewerForActor("pdm", brands.cdw)).toEqual({
      actor: "pdm",
      name: "Priya Raghavan",
      org: "Platform vendor",
    });
    expect(viewerForActor("partner", brands.cdw)).toEqual({
      actor: "partner",
      name: "Ravi Menon",
      org: "CDW",
    });
    expect(viewerForActor("cpm", brands.cdw)).toEqual({
      actor: "cpm",
      name: "Marcus Hale",
      org: "Platform vendor",
    });
    expect(isSessionReadOnly("pdm")).toBe(false);
    expect(isSessionReadOnly("partner")).toBe(false);
    expect(isSessionReadOnly("cpm")).toBe(true);
  });

  it("restores facilitated handling cost to Michelle", () => {
    const facilitated = applyDeliveryMode(
      applyDeliveryMode(initialSessionGraph, "self-service"),
      "facilitated",
    );
    expect(facilitated.valueInputs.find((input) => input.id === "handling")?.confirmedBy)
      .toBe("Michelle Dorsey");
  });
});

describe("scope decisions", () => {
  it("turns ~400 claims into visible daily and annual arithmetic", () => {
    const next = applyClaimsVolumeChoice(initialSessionGraph, "about-400");
    const claims = next.valueInputs.find((input) => input.id === "claims");
    expect(claims?.quantity).toBe(400);
    expect(claims?.confirmedBy).toBe("Michelle Dorsey");
    expect(next.outcome.partiallyEstimated).toBeFalsy();
    expect(next.outcome.annualValue).toBe(calculateAnnualValue(400, 2, 38.75));
    expect(claimsPayoffCopy(next)).toBe(
      "400 × 2 × $38.75 → $31,000/day · $7.75M/year · top of the library range",
    );
  });

  it("marks an unconfirmed volume as an estimate on the artifact", () => {
    const next = applyClaimsVolumeChoice(initialSessionGraph, "unconfirmed");
    expect(next.valueInputs.find((input) => input.id === "claims")?.confirmedBy).toBeNull();
    expect(next.outcome.partiallyEstimated).toBe(true);
    expect(claimsPayoffCopy(next)).toMatch(/unconfirmed estimate/i);
    expect(claimsArtifactCopy(next).headline).toBe("Value pending volume confirmation");
    expect(claimsArtifactCopy(next).status).toBe("Unconfirmed estimate");
    expect(claimsArtifactCopy(next).headline).not.toContain("$7.75M");
  });

  it("carries a claims range into the artifact instead of collapsing it to a midpoint", () => {
    const next = applyClaimsVolumeChoice(initialSessionGraph, "range-250-500");
    const copy = claimsArtifactCopy(next);

    expect(next.outcome.partiallyEstimated).toBe(true);
    expect(claimsPayoffCopy(next)).toContain("$19,000–$39,000/day");
    expect(claimsPayoffCopy(next)).toContain("$4.8M–$9.7M/year");
    expect(claimsPayoffCopy(next)).toContain("spans the library range");
    expect(copy.headline).toBe("$19,000–$39,000 / day");
    expect(copy.detail).toContain("$4.8M–$9.7M per year");
    expect(copy.status).toBe("Range estimate · spans the library range");
    expect(copy.headline).not.toContain("$7.75M");
  });

  it("lists each confirmer once on the artifact", () => {
    expect(inputsConfirmedByCopy(initialSessionGraph)).toBe(
      "Inputs confirmed by Michelle Dorsey and Dana Reyes.",
    );
    expect(inputsConfirmedByCopy(initialSessionGraph)).not.toMatch(/Michelle Dorsey and Michelle Dorsey/);
  });

  it("names the case's unproven limits so the pilot is the next step", () => {
    expect(artifactLimitsCopy.heading).toBe("What this case does not yet prove");
    expect(artifactLimitsCopy.body).toMatch(/handwritten adjuster notes/i);
    expect(artifactLimitsCopy.body).toMatch(/15%/);
    expect(artifactLimitsCopy.body).toMatch(/review time/i);
    expect(artifactLimitsCopy.body).toMatch(/pilot exists to answer these/i);
  });

  it("carries reuse of the prior pilot spec into the artifact pilot section", () => {
    expect(artifactPilotScopeCopy(initialSessionGraph, brands.cdw)).toMatch(
      /reuses CDW's prior document-pattern pilot spec/i,
    );
  });
});

describe("cold scope", () => {
  const company = {
    name: "Northwind Insurance",
    industry: "Insurance",
    sizeBand: "$500M–$1B",
  };
  const attendees = [
    { name: "Dana Lee", role: "VP Claims Operations" },
    { name: "Mina Shah", role: "Claims Supervisor" },
    { name: "Alex Kim", role: "Senior Developer" },
    { name: "Sam Patel", role: "Infrastructure Director" },
  ];

  it("persists typed company and people without retaining Heartland attendees", () => {
    const next = applyColdScope(initialSessionGraph, company, attendees);

    expect(next.session.scopeMode).toBe("cold");
    expect(next.session.customerName).toBe("Northwind Insurance");
    expect(next.session.industry).toBe("Insurance");
    expect(next.coldCompany).toEqual(company);
    expect(next.coldAttendees).toEqual(attendees);
    expect(next.attendees.map((person) => person.name)).toEqual(
      ["Dana Lee", "Mina Shah", "Alex Kim", "Sam Patel"],
    );
    expect(next.attendees.some((person) => person.name === "Karen Whitfield")).toBe(false);
    expect(next.captures).toEqual([]);
    expect(next.valueInputs.every((input) => input.confirmedBy === null)).toBe(true);
    expect(next.costComponents.every((component) => component.confirmedBy === null)).toBe(true);
    expect(next.outcome.owner).toBe("Alex Kim");
    expect(fundingAskCopy(next)).not.toMatch(/Dana Reyes|Karen Whitfield|Alex Chen/);
    expect(applyDeliveryMode(next, "facilitated").valueInputs.every((input) => input.confirmedBy === null)).toBe(true);
  });

  it("uses the pattern to explain attendees and name missing roles", () => {
    const next = applyColdScope(initialSessionGraph, company, attendees);

    expect(next.attendees.find((person) => person.name === "Dana Lee")?.reason)
      .toMatch(/operating outcome/i);
    expect(missingColdRoles(next)).toEqual([
      expect.objectContaining({ role: "Compliance", reason: expect.stringMatching(/lose two weeks/i) }),
      expect.objectContaining({ role: "Economic buyer", reason: expect.stringMatching(/fund the pilot/i) }),
    ]);
  });
});

describe("artifact consequences", () => {
  it("does not assert the $7.75M point estimate when volume is a range", () => {
    const next = applyClaimsVolumeChoice(initialSessionGraph, "range-250-500");
    const copy = claimsArtifactCopy(next);
    expect(copy.headline).toBe("$19,000–$39,000 / day");
    expect(copy.headline).not.toContain("$31,000");
    expect(`${copy.headline} ${copy.detail}`).not.toContain("$7.75M");
  });

  it("labels the artifact unconfirmed when volume was not confirmed", () => {
    const next = applyClaimsVolumeChoice(initialSessionGraph, "unconfirmed");
    const copy = claimsArtifactCopy(next);
    expect(copy.status).toBe("Unconfirmed estimate");
    expect(copy.headline).toBe("Value pending volume confirmation");
    expect(`${copy.headline} ${copy.detail} ${copy.status}`).not.toContain("$7.75M");
  });

  it("switches the artifact cost section to the four-component ledger", () => {
    const ghost = applyMechanic(initialSessionGraph, "ghost-ledger");
    expect(ghost.session.mechanic).toBe("ghost-ledger");
    expect(ghost.costComponents.map((row) => row.label)).toEqual([
      "Handling labour",
      "Manual review hours",
      "Rework and leakage",
      "Overtime",
    ]);
  });

  it("gives the partner a path back to their PDM", () => {
    expect(artifactActions("partner", false, "facilitated").tertiary).toBe(
      "Contact my partner manager with this business case",
    );
    expect(artifactActions("pdm", false, "facilitated").tertiary).toBeNull();
  });

  it("leads a self-service artifact with facilitated verification", () => {
    expect(artifactActions("partner", true, "self-service").primary).toBe(
      "Request a facilitated session",
    );
    expect(artifactActions("partner", true, "self-service").secondary).toBe(
      "Start DAF funding request",
    );
  });

  it("inviting Karen keeps the artifact ask on her and lists her as invited", () => {
    const next = applyFundingRoute(initialSessionGraph, "invite-karen");
    const karen = next.attendees.find((person) => person.id === "karen");
    expect(karen?.reason).toBe("Economic buyer · invited");
    expect(fundingAskCopy(next)).toContain("Karen Whitfield");
    expect(fundingAskCopy(next)).not.toMatch(/^Dana Reyes/);
  });

  it("briefing Dana marks Karen not attending and addresses Dana on the artifact", () => {
    const next = applyFundingRoute(initialSessionGraph, "brief-dana");
    const karen = next.attendees.find((person) => person.id === "karen");
    expect(karen?.attendance).toBe("invited-not-attending");
    expect(karen?.reason).toBe("not attending — Dana carries the ask");
    expect(fundingAskCopy(next)).toContain("Dana Reyes");
    expect(fundingAskCopy(next)).not.toContain("Karen Whitfield, CFO:");
  });
});
