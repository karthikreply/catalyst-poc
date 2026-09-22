import { describe, expect, it } from "vitest";

import { brands } from "./brands";
import { initialSessionGraph } from "./seed";
import {
  agendaForSession,
  applyClaimsVolumeChoice,
  applyDeliveryMode,
  applyFundingRoute,
  applyMechanic,
  claimsArtifactCopy,
  claimsPayoffCopy,
  fundingAskCopy,
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

describe("applyMechanic", () => {
  it("changes only session.mechanic", () => {
    const edited = applyDeliveryMode(initialSessionGraph, "self-service");
    const ghost = applyMechanic(edited, "ghost-ledger");
    expect(ghost.session.mechanic).toBe("ghost-ledger");
    expect(ghost.session.delivery).toBe("self-service");
    expect(ghost.captures).toEqual(edited.captures);
    expect(ghost.agenda).toEqual(edited.agenda);
    expect(ghost.valueInputs).toEqual(edited.valueInputs);
    expect(ghost.costComponents).toEqual(edited.costComponents);
    expect(applyMechanic(ghost, "value-sprint").session.mechanic).toBe("value-sprint");
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
