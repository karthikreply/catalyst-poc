"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, ChevronDown, Pencil, Sparkles, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
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
import { formatCompactCurrency } from "@/lib/value";

const seededQuestions = [
  {
    question: "Roughly how many claims a day?",
    reason: "The record does not contain this number, and the business case depends on it.",
    chips: ["~400 a day", "250–500 a day", "Not confirmed yet"],
  },
  {
    question: "Karen Whitfield is listed as CFO with no logged activity. She funds the pilot. Invite her, or brief Dana to carry it?",
    reason: "The economic buyer and operating champion need an explicit route to the funding ask.",
    chips: ["Invite Karen", "Brief Dana to carry it", "Decide after the session"],
  },
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
  const router = useRouter();
  const { brand, canEditSession } = useSession();
  const [mode, setMode] = useState<ScopeMode>("seeded");
  const [customerName, setCustomerName] = useState(heartlandAccountRecord.account.name);
  const [context, setContext] = useState("");
  const [coldStarted, setColdStarted] = useState(false);
  const [answers, setAnswers] = useState<string[]>([]);
  const [thinking, setThinking] = useState(false);
  const questions = mode === "seeded" ? seededQuestions : coldQuestions;
  const complete = answers.length === questions.length;
  const observation = mode === "seeded" ? deriveKarenObservation(heartlandAccountRecord) : null;
  const currentQuestion = questions[answers.length];

  function choose(answer: string) {
    if (!canEditSession) return;
    setAnswers((current) => [...current, answer]);
    setThinking(true);
    window.setTimeout(() => setThinking(false), 380);
  }

  function clearToColdMode() {
    if (!canEditSession) return;
    setMode("cold");
    setCustomerName("");
    setContext("");
    setAnswers([]);
    setThinking(false);
    setColdStarted(false);
  }

  return (
    <div className="mx-auto max-w-5xl px-5 py-10 lg:px-8">
      <p className="text-sm text-black/48">{mode === "seeded" ? "Seeded from the account record" : "Cold account"}</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">Scope the value session</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-black/58">
        {mode === "seeded"
          ? `${brand.productName} starts with what the sales record already knows, then asks only for the gaps that change the room.`
          : "Start with the context you have. The guide will ask a short, fixed set of questions."}
      </p>

      {mode === "seeded" ? (
        <div className="mt-8 space-y-5">
          <section className="rounded-sm border border-black/10 bg-white p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-semibold">{heartlandAccountRecord.account.name}</h2>
                  <span className="rounded-sm border border-black/10 bg-[#fafaf8] px-2 py-0.5 text-[11px] text-black/52">
                    {crmBadge(brand.partnerName)}
                  </span>
                  {canEditSession && (
                    <button
                      type="button"
                      aria-label="Clear seeded account and enter it manually"
                      className="rounded-sm p-1 text-black/45 hover:bg-black/[.05] hover:text-black"
                      onClick={clearToColdMode}
                    >
                      <Pencil className="size-4" />
                    </button>
                  )}
                </div>
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
                <span className="mt-2 inline-block rounded-sm border border-black/10 bg-[#fafaf8] px-2 py-0.5 text-[11px] text-black/52">
                  {crmBadge(brand.partnerName)}
                </span>
              </div>
            </div>
          </section>

          <div className="grid gap-5 lg:grid-cols-[1.25fr_.75fr]">
            <section className="rounded-sm border border-black/10 bg-white p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-semibold">What we already know</h2>
                <span className="rounded-sm border border-black/10 bg-[#fafaf8] px-2 py-0.5 text-[11px] text-black/52">
                  {crmBadge(brand.partnerName)}
                </span>
              </div>
              <p className="mt-4 text-sm leading-7 text-black/70">
                Dana Reyes called the claims team “drowning” on 14 Jan while raising board pressure on AI. The team handles a document-heavy intake process with PDF claim forms and a six-day cycle to first decision. Heartland covered Q1 volume with overtime rather than hiring. Compliance was flagged early: Robert Osei requires an audit trail on anything automated.
              </p>
              <details className="group mt-5 border-t border-black/10 pt-4">
                <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-semibold">
                  <ChevronDown className="size-4 transition-transform group-open:rotate-180" />
                  Source notes
                </summary>
                <div className="mt-4 space-y-3">
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
              </details>
            </section>

            <div className="space-y-5">
              <section className="rounded-sm border border-black/10 bg-white p-5">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="font-semibold">Matched pattern</h2>
                  <span className="text-[11px] text-black/42">Curated library</span>
                </div>
                <p className="mt-3 text-sm font-semibold">Document-heavy intake</p>
                <p className="mt-1 text-sm text-black/55">Typically $2M–$9M annually</p>
              </section>

              <section className="rounded-sm border border-black/10 bg-white p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="font-semibold">Partner record</h2>
                  <span className="rounded-sm border border-black/10 bg-[#fafaf8] px-2 py-0.5 text-[11px] text-black/52">{prmBadge}</span>
                </div>
                <p className="mt-3 text-sm">{brand.partnerName} · AI & Data practice</p>
                <p className="mt-1 text-sm text-black/55">{heartlandAccountRecord.partnerProfile.fundingHistory} · {heartlandAccountRecord.partnerProfile.registeredDeals} registered deal</p>
              </section>

              <section className="rounded-sm border border-black/10 bg-white p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="font-semibold">Known contacts</h2>
                  <span className="rounded-sm border border-black/10 bg-[#fafaf8] px-2 py-0.5 text-[11px] text-black/52">{crmBadge(brand.partnerName)}</span>
                </div>
                <ul className="mt-3 space-y-2 text-sm">
                  {heartlandAccountRecord.contacts.map((contact) => (
                    <li key={contact.name}>
                      <span className="font-medium">{contact.name}</span>
                      <span className="text-black/48"> · {contact.role}{contact.relationship ? ` · ${contact.relationship}` : ""}</span>
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          </div>

          {observation && (
            <section className="rounded-sm border border-amber-300 bg-amber-50/60 p-5">
              <p className="flex items-center gap-2 text-sm font-semibold text-amber-950">
                <TriangleAlert className="size-4" /> Economic-buyer observation
              </p>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-amber-950/75">{observation}</p>
            </section>
          )}

          <QuestionPanel
            title="Two things to confirm"
            intro="The record supplies the context. These are the two gaps that change the business case or the room."
            questions={seededQuestions}
            answers={answers}
            currentQuestion={currentQuestion}
            complete={complete}
            thinking={thinking}
            canAnswer={canEditSession}
            onChoose={choose}
            onComplete={() => router.push("/plan")}
          />
        </div>
      ) : (
        <div className="mt-8 grid gap-8 lg:grid-cols-[.8fr_1.2fr]">
          <section className="rounded-sm border border-black/10 bg-white p-6">
            <label className="text-sm font-medium" htmlFor="customer-name">Customer account</label>
            <Input
              id="customer-name"
              value={customerName}
              readOnly={!canEditSession}
              onChange={(event) => setCustomerName(event.target.value)}
              placeholder="Customer name"
              className="mt-2 rounded-sm"
            />
            <label className="mt-5 block text-sm font-medium" htmlFor="customer-context">What do you know so far?</label>
            <Textarea
              id="customer-context"
              value={context}
              readOnly={!canEditSession}
              onChange={(event) => setContext(event.target.value)}
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
              onComplete={() => router.push("/plan")}
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
  onComplete,
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
  onComplete: () => void;
}) {
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
              {questions[index].reason && <p className="mt-1 text-xs leading-5 text-black/48">Why: {questions[index].reason}</p>}
            </div>
            <div className="ml-auto w-fit max-w-[90%] rounded-sm px-3 py-2 text-sm text-white" style={{ background: "var(--accent)" }}>{answer}</div>
          </div>
        ))}
        {!complete && !thinking && currentQuestion && (
          <div>
            <div className="max-w-[90%] rounded-sm bg-[#f5f5f2] p-3 text-sm">
              <p>{currentQuestion.question}</p>
              {currentQuestion.reason && <p className="mt-1 text-xs leading-5 text-black/48">Why: {currentQuestion.reason}</p>}
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
            <Button onClick={onComplete} className="mt-4 bg-[var(--accent)] hover:bg-[var(--accent-dark)]">Review session plan <ArrowRight /></Button>
          </div>
        )}
      </div>
    </section>
  );
}
