"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, Check, ChevronDown, Sparkles, TriangleAlert } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useSession } from "@/components/session-provider";
import {
  crmBadge,
  deriveKarenObservation,
  heartlandAccountRecord,
  prmBadge,
  type ScopeMode,
} from "@/lib/seed/accountRecord";
import {
  claimsPayoffCopy,
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

const coldQuestions = [
  { question: "Is there an active opportunity?", chips: ["Stage 2 opportunity", "Early discovery", "No opportunity yet"] },
  { question: "Roughly how many claims a day?", chips: ["~400 a day", "250–500 a day", "Not confirmed yet"] },
  { question: "Who’s likely to be in the room?", chips: ["Ops, supervisor, IT, compliance", "Claims and IT leads", "The full working team"] },
  { question: "Is compliance a factor?", chips: ["Audit trail required", "Compliance is joining", "Human review is mandatory"] },
  { question: "Has the CFO engaged?", chips: ["CFO aware", "Champion briefed the CFO", "Economic buyer not attending"] },
];

const coldPlaceholder = "Mid-size insurer in Iowa. Claims intake is slow — lots of manual PDF reading.";

export default function ScopePage() {
  const {
    brand,
    graph,
    canEditSession,
    applyClaimsChoice,
    applyFunding,
    applyPattern,
    applyReusePilot,
    setCustomerProfile,
  } = useSession();
  const [mode, setMode] = useState<ScopeMode>("seeded");
  const [coldStarted, setColdStarted] = useState(false);
  const [answers, setAnswers] = useState<string[]>([]);
  const [thinking, setThinking] = useState(false);
  const fundingRef = useRef<HTMLDivElement>(null);
  const doneRef = useRef<HTMLDivElement>(null);
  const complete = answers.length === coldQuestions.length;
  const observation = mode === "seeded" ? deriveKarenObservation(heartlandAccountRecord) : null;
  const currentQuestion = coldQuestions[answers.length];
  const claimsChoice = graph.session.claimsVolumeChoice;
  const fundingRoute = graph.session.fundingRoute;
  const seededComplete = Boolean(claimsChoice && fundingRoute);
  const customerName = graph.session.customerName;
  const context = graph.session.customerContext;

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

  function choose(answer: string) {
    if (!canEditSession) return;
    setAnswers((current) => [...current, answer]);
    setThinking(true);
    window.setTimeout(() => setThinking(false), 380);
  }

  function clearToColdMode() {
    if (!canEditSession) return;
    setMode("cold");
    setCustomerProfile({ name: "", context: "" });
    setAnswers([]);
    setThinking(false);
    setColdStarted(false);
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-8 lg:px-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-black/48">{mode === "seeded" ? "Seeded from the account record" : "Cold account"}</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Scope the value session</h1>
          <p className="mt-2 text-sm text-black/55">
            {mode === "seeded" ? "Two questions · about three minutes" : "Five questions · about five minutes"}
          </p>
          {mode === "seeded" && (
            <p className="mt-2 text-xs text-black/45">{crmBadge(brand.partnerName)}</p>
          )}
        </div>
        {mode === "seeded" && canEditSession && (
          <Button variant="outline" onClick={clearToColdMode}>
            Start without the record
          </Button>
        )}
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
              <div className="mt-3 flex flex-wrap gap-2">
                <ChoiceChip
                  selected={graph.session.patternId === "document-intake"}
                  disabled={!canEditSession}
                  onClick={() => applyPattern("document-intake")}
                >
                  Document-heavy intake
                </ChoiceChip>
                <ChoiceChip
                  selected={graph.session.patternId === "fraud-triage"}
                  disabled={!canEditSession}
                  onClick={() => applyPattern("fraud-triage")}
                >
                  Or closer to fraud triage?
                </ChoiceChip>
              </div>
            </section>

            <section className="rounded-sm border border-black/10 bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-semibold">Partner record</h2>
                <span className="rounded-sm border border-[var(--accent)]/30 bg-[color-mix(in_srgb,var(--accent)_8%,white)] px-2 py-0.5 text-[11px] text-black/70">
                  {prmBadge}
                </span>
              </div>
              <p className="mt-3 text-sm">{brand.partnerName} · AI & Data practice</p>
              <p className="mt-1 text-sm leading-6 text-black/62">
                Both prior pilots were document patterns — reuse that pilot spec?
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <ChoiceChip
                  selected={graph.session.reusePriorPilotSpec === true}
                  disabled={!canEditSession}
                  onClick={() => applyReusePilot(true)}
                >
                  Reuse the prior spec
                </ChoiceChip>
                <ChoiceChip
                  selected={graph.session.reusePriorPilotSpec === false}
                  disabled={!canEditSession}
                  onClick={() => applyReusePilot(false)}
                >
                  Start a fresh spec
                </ChoiceChip>
              </div>
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
              </div>
            </details>
          </div>

          <section className="rounded-sm border border-black/10 bg-white p-5 md:p-6 lg:sticky lg:top-24">
            <div className="flex items-center gap-2 border-b border-black/10 pb-4">
              <span className="grid size-7 place-items-center rounded-sm bg-black text-xs font-semibold text-white">AI</span>
              <div>
                <p className="text-sm font-semibold">Two things to confirm</p>
                <p className="text-xs text-black/45">The record supplies the rest</p>
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
                    Karen Whitfield, the economic buyer, has no logged activity. The close date has slipped twice. Those facts are likely related.
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
                </div>
              )}

              {seededComplete && (
                <div ref={doneRef} className="scroll-mt-24 rounded-sm border p-4" style={{ borderColor: "var(--accent)" }}>
                  <p className="flex items-center gap-2 text-sm font-semibold">
                    <Check className="size-4" style={{ color: "var(--accent)" }} /> Ready for the session plan
                  </p>
                  <p className="mt-2 text-sm leading-6 text-black/55">
                    Volume is on the case, and the funding route is explicit.
                  </p>
                  <Link
                    href="/plan"
                    className={cn(buttonVariants({ className: "mt-4 bg-[var(--accent)] hover:bg-[var(--accent-dark)]" }))}
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
            <label className="text-sm font-medium" htmlFor="customer-name">Customer account</label>
            <Input
              id="customer-name"
              value={customerName}
              readOnly={!canEditSession}
              onChange={(event) => setCustomerProfile({ name: event.target.value })}
              placeholder="Customer name"
              className="mt-2 rounded-sm"
            />
            <label className="mt-5 block text-sm font-medium" htmlFor="customer-context">What do you know so far?</label>
            <Textarea
              id="customer-context"
              value={context}
              readOnly={!canEditSession}
              onChange={(event) => setCustomerProfile({ context: event.target.value })}
              placeholder={coldPlaceholder}
              className="mt-2 min-h-44 resize-none rounded-sm bg-white leading-6"
            />
            {!coldStarted && (
              <Button
                onClick={() => canEditSession && setColdStarted(true)}
                className="mt-3 bg-[var(--accent)] hover:bg-[var(--accent-dark)]"
              >
                <Sparkles /> Start guided scope
              </Button>
            )}
          </section>

          {coldStarted ? (
            <QuestionPanel
              title="Guided scope"
              intro="Five fixed questions shape the session without turning this into an open-ended chat."
              questions={coldQuestions}
              answers={answers}
              currentQuestion={currentQuestion}
              complete={complete}
              thinking={thinking}
              canAnswer={canEditSession}
              onChoose={choose}
              completeHref="/plan"
            />
          ) : (
            <section className="grid min-h-96 place-items-center rounded-sm border border-black/10 bg-white p-6 text-center">
              <p className="max-w-xs text-sm leading-6 text-black/45">Enter the context you have, then start the guided scope.</p>
            </section>
          )}
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
      className={cn("rounded-full font-normal", selected && "border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_8%,white)]")}
    >
      {children}
    </Button>
  );
}

type Question = {
  question: string;
  reason?: string;
  chips: string[];
};

function QuestionPanel({
  title,
  intro,
  questions,
  answers,
  currentQuestion,
  complete,
  thinking,
  canAnswer,
  onChoose,
  completeHref,
}: {
  title: string;
  intro: string;
  questions: readonly Question[];
  answers: string[];
  currentQuestion: Question | undefined;
  complete: boolean;
  thinking: boolean;
  canAnswer: boolean;
  onChoose: (answer: string) => void;
  completeHref: string;
}) {
  const latestRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!answers.length) return;
    latestRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [answers.length, thinking, complete]);

  return (
    <section aria-live="polite" className="rounded-sm border border-black/10 bg-white p-5 md:p-7">
      <div className="flex items-center gap-2 border-b border-black/10 pb-4">
        <span className="grid size-7 place-items-center rounded-sm bg-black text-xs font-semibold text-white">AI</span>
        <div>
          <p className="text-sm font-semibold">{title}</p>
          <p className="text-xs text-black/45">Seeded responses · no live model</p>
        </div>
      </div>
      <p className="mt-5 max-w-2xl text-sm leading-6 text-black/58">{intro}</p>
      <div className="mt-5 space-y-5">
        {answers.map((answer, index) => (
          <div key={`${answer}-${index}`} className="space-y-2">
            <div className="max-w-[90%] rounded-sm bg-[#f5f5f2] p-3 text-sm">
              <p>{questions[index].question}</p>
            </div>
            <div className="ml-auto w-fit max-w-[90%] rounded-sm px-3 py-2 text-sm text-white" style={{ background: "var(--accent)" }}>{answer}</div>
          </div>
        ))}
        {!complete && !thinking && currentQuestion && (
          <div>
            <p className="mb-2 text-xs text-black/45">{answers.length + 1} of {questions.length}</p>
            <div className="max-w-[90%] rounded-sm bg-[#f5f5f2] p-3 text-sm">
              <p>{currentQuestion.question}</p>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {currentQuestion.chips.map((chip) => (
                <Button
                  key={chip}
                  variant="outline"
                  size="sm"
                  onClick={() => onChoose(chip)}
                  className="rounded-full font-normal"
                  aria-disabled={!canAnswer}
                >
                  {chip}
                </Button>
              ))}
            </div>
          </div>
        )}
        {thinking && <p className="text-xs text-black/42">Preparing the next question…</p>}
        {complete && !thinking && (
          <div className="rounded-sm border p-4" style={{ borderColor: "var(--accent)" }}>
            <p className="flex items-center gap-2 text-sm font-semibold"><Check className="size-4" style={{ color: "var(--accent)" }} /> Matched pattern: Document-heavy intake</p>
            <p className="mt-2 text-sm leading-6 text-black/55">The room has the right operating, technical, compliance, and funding voices. The plan is ready.</p>
            <Link href={completeHref} className={cn(buttonVariants({ className: "mt-4 bg-[var(--accent)] hover:bg-[var(--accent-dark)]" }))}>Review session plan <ArrowRight /></Link>
          </div>
        )}
        <div ref={latestRef} aria-hidden className="scroll-mt-24" />
      </div>
    </section>
  );
}
