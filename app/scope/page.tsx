"use client";

import { useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, Check, ChevronDown, Plus, TriangleAlert } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSession } from "@/components/session-provider";
import {
  crmBadge,
  deriveKarenObservation,
  heartlandAccountRecord,
  prmBadge,
} from "@/lib/seed/accountRecord";
import {
  canViewPartnerScope,
  claimsPayoffCopy,
  coldRoleMatch,
  coldScopeDefaults,
  missingColdRoles,
  type ClaimsVolumeChoice,
  type FundingRoute,
} from "@/lib/session";
import { formatCompactCurrency } from "@/lib/value";
import { cn } from "@/lib/utils";

const claimsChoices: { label: string; value: ClaimsVolumeChoice }[] = [
  { label: "~400 a day", value: "about-400" },
  { label: "250–500 a day", value: "range-250-500" },
  { label: "Not confirmed yet", value: "unconfirmed" },
];

const roleExamples = [
  "Operations owner",
  "Frontline supervisor",
  "Developer",
  "Compliance",
  "Infrastructure",
  "Economic buyer",
];

export default function ScopePage() {
  const {
    brand,
    graph,
    viewer,
    canEditSession,
    applyClaimsChoice,
    applyFunding,
    applyPattern,
    applyReusePilot,
    setColdScope,
    restoreSeededScope,
  } = useSession();
  const mode = graph.session.scopeMode;
  const [adjusting, setAdjusting] = useState<"pattern" | "spec" | null>(null);
  const fundingRef = useRef<HTMLDivElement>(null);
  const doneRef = useRef<HTMLDivElement>(null);
  const observation = mode === "seeded" ? deriveKarenObservation(heartlandAccountRecord) : null;
  const claimsChoice = graph.session.claimsVolumeChoice;
  const fundingRoute = graph.session.fundingRoute;
  const seededComplete = Boolean(claimsChoice && fundingRoute);
  const coldCompany = graph.coldCompany ?? coldScopeDefaults.company;
  const coldAttendees = graph.coldAttendees.length ? graph.coldAttendees : coldScopeDefaults.attendees;
  const companyComplete = Boolean(coldCompany.name.trim() && coldCompany.industry.trim() && coldCompany.sizeBand.trim());
  const completeAttendees = coldAttendees.filter((person) => person.name.trim() && person.role.trim());
  const coldComplete = companyComplete && completeAttendees.length >= 3;
  const coldGaps = missingColdRoles(graph);

  function revealNext(target: "funding" | "done") {
    requestAnimationFrame(() => {
      const node = target === "done" ? doneRef.current : fundingRef.current;
      node?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }

  function chooseClaims(choice: ClaimsVolumeChoice) {
    applyClaimsChoice(choice);
    revealNext(fundingRoute ? "done" : "funding");
  }

  function chooseFunding(route: FundingRoute) {
    applyFunding(route);
    if (claimsChoice) revealNext("done");
  }

  function clearToColdMode() {
    if (!canEditSession) return;
    setColdScope(coldScopeDefaults.company, coldScopeDefaults.attendees);
  }

  if (!canViewPartnerScope(viewer.actor)) {
    const patternName = graph.session.patternId === "fraud-triage"
      ? "Fraud triage"
      : graph.session.patternId === "contact-centre-summarisation"
        ? "Contact-centre summarisation"
        : graph.session.patternId === "knowledge-retrieval"
          ? "Knowledge retrieval"
          : "Document-heavy intake";

    return (
      <div className="mx-auto max-w-5xl px-5 py-8 lg:px-8">
        <p className="text-sm text-black/48">Read-only vendor view</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Scope the value session</h1>
        <p className="mt-5 rounded-sm border border-black/10 bg-[#fafaf8] px-5 py-4 text-sm leading-6 text-black/65">
          Account record is partner-held. The vendor sees the session outcome, not the CRM.
        </p>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <section className="rounded-sm border border-black/10 bg-white p-6">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-semibold">Matched pattern</h2>
              <span className="text-[11px] text-black/42">Curated library</span>
            </div>
            <p className="mt-3 text-lg font-semibold">{patternName}</p>
          </section>

          <section className="rounded-sm border border-black/10 bg-white p-6">
            <h2 className="font-semibold">Session outcome</h2>
            <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
              <div><dt className="text-xs text-black/45">Use case</dt><dd className="mt-1 font-medium">{graph.outcome.useCase || "Not captured"}</dd></div>
              <div><dt className="text-xs text-black/45">Annual value</dt><dd className="mt-1 font-medium">{graph.outcome.annualValue ? formatCompactCurrency(graph.outcome.annualValue) : "Pending session inputs"}</dd></div>
              <div><dt className="text-xs text-black/45">Owner</dt><dd className="mt-1 font-medium">{graph.outcome.owner ?? "Not confirmed"}</dd></div>
              <div><dt className="text-xs text-black/45">Next step</dt><dd className="mt-1 font-medium">{graph.outcome.nextStep || "Not captured"}</dd></div>
            </dl>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-8 lg:px-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-black/48">{mode === "seeded" ? "Seeded from the account record" : "Cold account"}</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Scope the value session</h1>
          <p className="mt-2 text-sm text-black/55">
            {mode === "seeded" ? "Two questions · about three minutes" : "Company and attendees · about five minutes"}
          </p>
          {mode === "seeded" && (
            <p className="mt-1 text-sm text-black/55">You&apos;ve already done this work — it&apos;s in your CRM.</p>
          )}
          {mode === "seeded" && (
            <p className="mt-2 text-xs text-black/45">{crmBadge(brand.partnerName)}</p>
          )}
        </div>
        {mode === "seeded" && canEditSession ? (
          <Button variant="outline" onClick={clearToColdMode}>
            Start without the record
          </Button>
        ) : mode === "cold" && canEditSession ? (
          <Button variant="outline" onClick={restoreSeededScope}>
            Use account record instead
          </Button>
        ) : null}
      </div>

      {mode === "seeded" ? (
        <div className="mt-8 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(22rem,24rem)]">
          <div className="space-y-4">
            <section className="rounded-sm border border-black/10 bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold">{heartlandAccountRecord.account.name}</h2>
                  <p className="mt-1 text-sm text-black/50">
                    {heartlandAccountRecord.account.industry} · {heartlandAccountRecord.account.revenue}
                  </p>
                </div>
                <div className="text-right text-sm">
                  <p className="font-medium">{heartlandAccountRecord.opportunity.name}</p>
                  <p className="mt-1 text-black/52">
                    {heartlandAccountRecord.opportunity.stage} · {formatCompactCurrency(heartlandAccountRecord.opportunity.value)}
                  </p>
                  <p className="mt-1 text-xs font-medium text-amber-800">
                    Close date pushed twice · last updated {heartlandAccountRecord.opportunity.weeksSinceUpdate} weeks ago
                  </p>
                </div>
              </div>
              <p className="mt-4 text-sm leading-7 text-black/70">
                Dana Reyes called the claims team “drowning” on 14 Jan while raising board pressure on AI. The team handles a document-heavy intake process with PDF claim forms and a six-day cycle to first decision. Heartland covered Q1 volume with overtime rather than hiring. Compliance was flagged early: Robert Osei requires an audit trail on anything automated.
              </p>
            </section>

            <section className="rounded-sm border border-black/10 bg-white p-5">
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-semibold">Matched pattern</h2>
                <span className="text-[11px] text-black/42">Curated library</span>
              </div>
              <p className="mt-3 text-sm leading-6 text-black/68">
                Matched on document volume and manual review. Typically $2M–$9M annually.
              </p>
              <p className="mt-3 text-sm font-semibold">
                {graph.session.patternId === "fraud-triage" ? "Fraud triage" : "Document-heavy intake"}
              </p>
            </section>

            <section className="rounded-sm border border-black/10 bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-semibold">Partner record</h2>
                <span className="rounded-sm border border-[var(--brand-accent)]/30 bg-[color-mix(in_srgb,var(--brand-accent)_8%,white)] px-2 py-0.5 text-[11px] text-black/70">
                  {prmBadge}
                </span>
              </div>
              <p className="mt-3 text-sm">{brand.partnerName} · AI & Data practice</p>
              <p className="mt-1 text-sm leading-6 text-black/62">
                Both prior pilots were document patterns — reuse that pilot spec?
              </p>
              <p className="mt-3 text-sm font-semibold">
                {graph.session.reusePriorPilotSpec === false ? "Starting a fresh pilot spec" : "Reusing the prior pilot spec"}
              </p>
            </section>

            <p className="px-1 text-sm leading-6 text-black/55">
              Not in the record: claim volume, current handling cost, whether Karen has seen anything.
            </p>

            <details className="group rounded-sm border border-black/10 bg-white p-5">
              <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-semibold">
                <ChevronDown className="size-4 transition-transform group-open:rotate-180" />
                Evidence behind the questions
              </summary>
              <div className="mt-4 space-y-4">
                <div>
                  <p className="text-xs font-medium text-black/45">Source notes</p>
                  <div className="mt-2 space-y-3">
                    {heartlandAccountRecord.notes.map((note) => (
                      <article key={`${note.date}-${note.author}`} className="rounded-sm bg-[#fafaf8] p-4">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-black/48">
                          <span>{note.date} · {note.author} · {note.kind}</span>
                          {note.partial && (
                            <span className="rounded-sm border border-amber-300 bg-amber-50 px-1.5 py-0.5 text-amber-800">
                              Note incomplete
                            </span>
                          )}
                        </div>
                        <p className="mt-2 text-sm leading-6 text-black/68">{note.text}</p>
                      </article>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-black/45">Known contacts</p>
                  <ul className="mt-2 space-y-2 text-sm">
                    {heartlandAccountRecord.contacts.map((contact) => (
                      <li key={contact.name}>
                        <span className="font-medium">{contact.name}</span>
                        <span className="text-black/48"> · {contact.role}{contact.relationship ? ` · ${contact.relationship}` : ""}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="border-t border-black/10 pt-4">
                  <p className="text-xs font-medium text-black/45">Record-derived defaults</p>
                  <div className="mt-3 space-y-4 text-sm">
                    <div>
                      <div className="flex items-center justify-between gap-3">
                        <p>Pattern: <span className="font-medium">{graph.session.patternId === "fraud-triage" ? "Fraud triage" : "Document-heavy intake"}</span></p>
                        {canEditSession && (
                          <button type="button" className="text-xs font-medium underline underline-offset-4" onClick={() => setAdjusting(adjusting === "pattern" ? null : "pattern")}>adjust</button>
                        )}
                      </div>
                      {adjusting === "pattern" && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          <ChoiceChip selected={graph.session.patternId === "document-intake"} disabled={!canEditSession} onClick={() => applyPattern("document-intake")}>Document-heavy intake</ChoiceChip>
                          <ChoiceChip selected={graph.session.patternId === "fraud-triage"} disabled={!canEditSession} onClick={() => applyPattern("fraud-triage")}>Fraud triage</ChoiceChip>
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center justify-between gap-3">
                        <p>Pilot spec: <span className="font-medium">{graph.session.reusePriorPilotSpec === false ? "Start fresh" : "Reuse prior spec"}</span></p>
                        {canEditSession && (
                          <button type="button" className="text-xs font-medium underline underline-offset-4" onClick={() => setAdjusting(adjusting === "spec" ? null : "spec")}>adjust</button>
                        )}
                      </div>
                      {adjusting === "spec" && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          <ChoiceChip selected={graph.session.reusePriorPilotSpec !== false} disabled={!canEditSession} onClick={() => applyReusePilot(true)}>Reuse prior spec</ChoiceChip>
                          <ChoiceChip selected={graph.session.reusePriorPilotSpec === false} disabled={!canEditSession} onClick={() => applyReusePilot(false)}>Start fresh</ChoiceChip>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </details>
          </div>

          <section className="rounded-sm border border-black/10 bg-white p-5 md:p-6 lg:sticky lg:top-24">
            <div className="flex items-center gap-2 border-b border-black/10 pb-4">
              <span className="grid size-7 place-items-center rounded-sm bg-black text-xs font-semibold text-white">AI</span>
              <div>
                <p className="text-sm font-semibold">Two things to confirm</p>
                <p className="text-xs text-black/45">The record supplies the rest · Seeded responses, no live model</p>
              </div>
            </div>

            <div className="mt-5 space-y-6">
              <div>
                <p className="text-xs font-medium text-black/45">1 of 2</p>
                <p className="mt-2 text-sm font-medium">Roughly how many claims a day?</p>
                <p className="mt-1 text-xs leading-5 text-black/48">The business case depends on this number, and it is not in the record.</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {claimsChoices.map((chip) => (
                    <ChoiceChip
                      key={chip.value}
                      selected={claimsChoice === chip.value}
                      disabled={!canEditSession}
                      onClick={() => chooseClaims(chip.value)}
                    >
                      {chip.label}
                    </ChoiceChip>
                  ))}
                </div>
                {claimsChoice && (
                  <p className="mt-3 whitespace-pre-line rounded-sm bg-[#fafaf8] p-3 text-sm leading-6 text-black/72">
                    {claimsPayoffCopy(graph)}
                  </p>
                )}
              </div>

              {observation && (
                <div ref={fundingRef} className="scroll-mt-24">
                  <p className="text-xs font-medium text-black/45">2 of 2</p>
                  <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-amber-950">
                    <TriangleAlert className="size-4" /> Economic-buyer observation
                  </p>
                  <p className="mt-2 text-sm leading-6 text-black/68">
                    Karen Whitfield, the economic buyer, has no logged activity. The close date has slipped twice. Those facts are likely related. I&apos;d get her in the room.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <ChoiceChip
                      selected={fundingRoute === "invite-karen"}
                      disabled={!canEditSession}
                      onClick={() => chooseFunding("invite-karen")}
                    >
                      Invite Karen
                    </ChoiceChip>
                    <ChoiceChip
                      selected={fundingRoute === "brief-dana"}
                      disabled={!canEditSession}
                      onClick={() => chooseFunding("brief-dana")}
                    >
                      Brief Dana to carry it
                    </ChoiceChip>
                  </div>
                  {fundingRoute && (
                    <p className="mt-3 text-xs font-medium text-black/58">
                      {fundingRoute === "invite-karen" ? "Karen is in the room" : "Dana carries the ask"} · step 5 updated
                    </p>
                  )}
                </div>
              )}

              {seededComplete && (
                <div ref={doneRef} className="scroll-mt-24 rounded-sm border p-4" style={{ borderColor: "var(--brand-accent)" }}>
                  <p className="flex items-center gap-2 text-sm font-semibold">
                    <Check className="size-4" style={{ color: "var(--brand-accent)" }} /> Ready for the session plan
                  </p>
                  <p className="mt-2 text-sm leading-6 text-black/55">
                    Volume is on the case, and the funding route is explicit.
                  </p>
                  <Link
                    href="/plan"
                    className={cn(buttonVariants({ className: "mt-4 bg-[var(--brand-accent)] hover:bg-[var(--brand-accent-dark)]" }))}
                  >
                    Review session plan <ArrowRight />
                  </Link>
                </div>
              )}
            </div>
          </section>
        </div>
      ) : (
        <div className="mt-8 grid gap-8 lg:grid-cols-[.8fr_1.2fr]">
          <section className="rounded-sm border border-black/10 bg-white p-6">
            <h2 className="text-lg font-semibold">Company</h2>
            {([
              ["name", "Company name", "Northwind Insurance"],
              ["industry", "Industry", "Insurance"],
              ["sizeBand", "Size band", "$500M–$1B"],
            ] as const).map(([field, label, placeholder]) => (
              <label key={field} className="mt-4 block text-sm font-medium">
                {label}
                <Input
                  value={coldCompany[field]}
                  readOnly={!canEditSession}
                  onChange={(event) => setColdScope({ ...coldCompany, [field]: event.target.value }, coldAttendees)}
                  placeholder={placeholder}
                  className="mt-2 rounded-sm"
                />
              </label>
            ))}
            <p className="mt-4 text-xs leading-5 text-black/48">Prefilled with an example — select any field and type over it. Industry drives pattern matching. Size stays coarse; exact revenue is not required.</p>
          </section>

          <section className="rounded-sm border border-black/10 bg-white p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">Who is likely to be in the room?</h2>
                <p className="mt-1 text-sm text-black/48">Three to six people, prefilled with an example — type over any name or role. The pattern supplies why each role matters.</p>
                <p className="mt-3 max-w-xl text-xs leading-5 text-black/55">
                  Recognised role examples: {roleExamples.join(", ")}. Job titles are fine; we match them to these responsibilities.
                </p>
              </div>
              {coldAttendees.length < 6 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setColdScope(coldCompany, [...coldAttendees, { name: "", role: "" }])}
                >
                  <Plus /> Add person
                </Button>
              )}
            </div>

            <div className="mt-5 space-y-3">
              {coldAttendees.map((person, index) => {
                const matchedRole = coldRoleMatch(person.role);
                return (
                <div key={index} className="grid items-start gap-3 sm:grid-cols-2">
                  <Input
                    aria-label={`Attendee ${index + 1} name`}
                    value={person.name}
                    readOnly={!canEditSession}
                    placeholder="Name"
                    onChange={(event) => setColdScope(
                      coldCompany,
                      coldAttendees.map((row, rowIndex) => rowIndex === index ? { ...row, name: event.target.value } : row),
                    )}
                  />
                  <div>
                    <Input
                      aria-label={`Attendee ${index + 1} role`}
                      aria-describedby={person.role.trim() ? `attendee-${index + 1}-role-status` : undefined}
                      value={person.role}
                      readOnly={!canEditSession}
                      placeholder={roleExamples[index] ?? "Role"}
                      onChange={(event) => setColdScope(
                        coldCompany,
                        coldAttendees.map((row, rowIndex) => rowIndex === index ? { ...row, role: event.target.value } : row),
                      )}
                    />
                    {person.role.trim() && (
                      <p
                        id={`attendee-${index + 1}-role-status`}
                        role="status"
                        aria-live="polite"
                        className={cn("mt-1 text-xs", matchedRole ? "text-emerald-700" : "text-amber-800")}
                      >
                        {matchedRole ? `Matched as ${matchedRole}` : "Not matched to a required pattern role"}
                      </p>
                    )}
                  </div>
                </div>
                );
              })}
            </div>

            {graph.attendees.length >= 3 && coldGaps.length > 0 && (
              <div className="mt-5 rounded-sm border border-amber-300 bg-amber-50 p-4">
                <p className="text-sm font-semibold">Roles missing for this pattern</p>
                <ul className="mt-2 space-y-2 text-sm">
                  {coldGaps.map((gap) => <li key={gap.role}><strong>{gap.role}</strong> — {gap.reason}</li>)}
                </ul>
              </div>
            )}

          </section>
          <div className="sticky bottom-4 z-10 rounded-sm border border-black/15 bg-white p-4 shadow-lg lg:col-span-2">
            <div className="flex flex-wrap items-center gap-4">
              <div className="min-w-64 flex-1">
                <p className="text-sm font-semibold">Next: review the session plan</p>
                <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-black/58">
                  <p>{companyComplete ? "✓" : "○"} Company details complete</p>
                  <p>{completeAttendees.length >= 3 ? "✓" : "○"} Three attendees complete ({completeAttendees.length}/3)</p>
                </div>
              </div>
              {coldComplete ? (
                <Link href="/plan" className={cn(buttonVariants({ className: "bg-[var(--brand-accent)] hover:bg-[var(--brand-accent-dark)]" }))}>
                  Review session plan <ArrowRight />
                </Link>
              ) : (
                <Button type="button" disabled>
                  {!companyComplete
                    ? "Complete company details"
                    : `Add ${3 - completeAttendees.length} more complete ${3 - completeAttendees.length === 1 ? "attendee" : "attendees"}`}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
function ChoiceChip({
  selected,
  disabled,
  onClick,
  children,
}: {
  selected: boolean;
  disabled: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => {
        if (disabled) return;
        onClick();
      }}
      aria-pressed={selected}
      aria-disabled={disabled}
      className={cn("rounded-full font-normal", selected && "border-[var(--brand-accent)] bg-[color-mix(in_srgb,var(--brand-accent)_8%,white)]")}
    >
      {children}
    </Button>
  );
}
