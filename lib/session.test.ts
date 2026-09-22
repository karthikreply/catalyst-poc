import { describe, expect, it } from "vitest";

import { brands } from "./brands";
import { initialSessionGraph } from "./seed";
import {
  applyClaimsVolumeChoice,
  applyDeliveryMode,
  applyFundingRoute,
  applyMechanic,
  claimsPayoffCopy,
  fundingAskCopy,
  isQualified,
  isSessionReadOnly,
  shouldResetGraph,
  viewerForActor,
} from "./session";
import { calculateAnnualValue, calculateDailyValue } from "./value";

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
    expect(claimsPayoffCopy(next)).toContain(
      `${400}/day × 2 avoidable days × $38.75 → ${new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }).format(calculateDailyValue(400, 2, 38.75))}/day`,
    );
    expect(claimsPayoffCopy(next)).toContain("$7.75M a year");
    expect(claimsPayoffCopy(next)).toContain("Top of the library");
  });

  it("marks an unconfirmed volume as an estimate on the artifact", () => {
    const next = applyClaimsVolumeChoice(initialSessionGraph, "unconfirmed");
    expect(next.valueInputs.find((input) => input.id === "claims")?.confirmedBy).toBeNull();
    expect(next.outcome.partiallyEstimated).toBe(true);
    expect(claimsPayoffCopy(next)).toMatch(/unconfirmed estimate/i);
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
