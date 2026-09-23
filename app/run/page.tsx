"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Lightbulb, Plus } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { GhostLedgerPanel } from "@/components/ghost-ledger-panel";
import { Input } from "@/components/ui/input";
import { useSession } from "@/components/session-provider";
import { ValueSprintPanel } from "@/components/value-sprint-panel";
import { nextQuestionSuggestion } from "@/lib/facilitation";
import { agendaForSession } from "@/lib/session";
import { cn } from "@/lib/utils";

export default function RunPage() {
  const { graph, brand, addCapture, setActiveStep, canEditSession, viewer } = useSession();
  const agenda = agendaForSession(graph);
  const activeStep = agenda.find((step) => step.state === "active") ?? agenda[2];
  const capturePeople = graph.attendees.map((attendee) => attendee.name);
  const [captureText, setCaptureText] = useState("");
  const [person, setPerson] = useState(capturePeople[0] ?? "Participant");
  const [suggesting, setSuggesting] = useState(false);
  const [suggestion, setSuggestion] = useState<{ stepId: string; text: string } | null>(null);
  const selfService = graph.session.delivery === "self-service";
  const selectedPerson = capturePeople.includes(person) ? person : capturePeople[0] ?? "Participant";
  const capturePerson = selfService ? capturePeople[0] ?? "Respondent" : selectedPerson;

  function submitCapture(event: FormEvent) {
    event.preventDefault();
    if (!captureText.trim() || !canEditSession) return;
    addCapture({ stepId: activeStep.id, attributedTo: capturePerson, text: captureText.trim() });
    setCaptureText("");
  }

  function suggestQuestion() {
    if (!canEditSession) return;
    setSuggesting(true);
    window.setTimeout(() => {
      const previous = suggestion?.stepId === activeStep.id ? suggestion.text : null;
      setSuggestion({
        stepId: activeStep.id,
        text: nextQuestionSuggestion(graph, activeStep.id, previous),
      });
      setSuggesting(false);
    }, 450);
  }

  return (
    <div className="mx-auto max-w-[1440px]">
      {selfService && (
        <p className="border-b border-black/10 bg-[#fafaf8] px-5 py-2 text-xs text-black/55 lg:px-8">Customer self-service — no partner facilitator present. Output is a qualification-grade business case.</p>
      )}
      {viewer.actor === "cpm" && (
        <p className="border-b border-black/10 bg-[#fafaf8] px-5 py-2 text-xs text-black/55 lg:px-8">Historical session record — the platform vendor sees completed evidence shared by the partner, not live session activity.</p>
      )}

      <div className="grid min-h-[calc(100vh-181px)] md:grid-cols-[180px_1fr]">
        <aside className="border-b border-black/10 bg-white p-4 md:border-b-0 md:border-r">
          <div className="grid grid-cols-5 gap-2 md:block md:space-y-1">
            {agenda.map((step) => (
              <div key={step.id}>
                <button
                  onClick={() => setActiveStep(step.id)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-sm px-2 py-2.5 text-left text-xs transition-colors hover:bg-black/[.04] focus-visible:outline-2",
                    step.state === "active" && "bg-black/[.05] font-semibold",
                    step.state === "upcoming" && "text-black/45",
                  )}
                >
                  <span
                    className="grid size-5 shrink-0 place-items-center rounded-full border border-black/15 text-[10px]"
                    style={step.state !== "upcoming" ? { background: brand.accent, borderColor: brand.accent, color: "white" } : undefined}
                  >
                    {step.state === "done" ? <Check className="size-3" /> : step.order}
                  </span>
                  <span className="hidden md:block">{step.title}</span>
                </button>
              </div>
            ))}
          </div>
        </aside>

        <section className="p-5 lg:p-8">
          <div className="mx-auto max-w-5xl">
            <p className="mb-2 text-sm font-medium text-black/45">{activeStep.title} · {activeStep.durationMinutes} min</p>
            <h2 className="max-w-4xl text-2xl font-semibold leading-tight tracking-tight md:text-3xl">{activeStep.prompt}</h2>
            {!selfService && (
              <div className="mt-4 max-w-4xl">
                {suggestion?.stepId === activeStep.id ? (
                  <aside className="border-l-4 border-[var(--brand-accent)] bg-black/[.035] px-4 py-3" aria-live="polite">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-black/50">
                        <Lightbulb className="size-4" /> Ask next
                      </p>
                      <Button variant="outline" size="sm" onClick={suggestQuestion} disabled={suggesting || !canEditSession}>
                        <Lightbulb />{suggesting ? "Thinking…" : "Suggest another"}
                      </Button>
                    </div>
                    <p className="mt-1 text-sm leading-6 text-black/75">{suggestion.text}</p>
                  </aside>
                ) : (
                  <Button variant="outline" onClick={suggestQuestion} disabled={suggesting || !canEditSession}>
                    <Lightbulb />{suggesting ? "Thinking…" : "Suggest a question to ask"}
                  </Button>
                )}
              </div>
            )}

            {graph.session.mechanic === "ghost-ledger" ? <GhostLedgerPanel /> : <ValueSprintPanel />}

            <div className="mt-7">
              <div className="mb-3 flex items-end justify-between">
                <div>
                  <h3 className="font-semibold">What we heard</h3>
                  <p className="text-sm text-black/50">Every note stays attributed to someone in the room.</p>
                </div>
                <span className="text-xs text-black/40">{graph.captures.length} captures</span>
              </div>
              <div className="divide-y divide-black/10 rounded-sm border border-black/10 bg-white">
                {graph.captures.length === 0 && (
                  <p className="p-4 text-sm text-black/55">No captures yet. Attribute each note to someone in the room.</p>
                )}
                {graph.captures.slice(-5).map((capture) => (
                  <div key={capture.id} className="grid gap-1 p-4 sm:grid-cols-[150px_1fr]">
                    <p className="text-sm font-semibold">{capture.attributedTo}</p>
                    <p className="text-sm leading-6 text-black/70">{capture.text}</p>
                  </div>
                ))}
                {canEditSession && (
                  <form onSubmit={submitCapture} className="flex flex-wrap items-center gap-2 p-3">
                    {!selfService && (
                      <label>
                        <span className="sr-only">Attribute capture to</span>
                        <select value={selectedPerson} onChange={(event) => setPerson(event.target.value)} className="h-9 rounded-sm border border-black/15 bg-white px-2 text-sm outline-none focus:border-[var(--brand-accent)]">
                          {capturePeople.map((name) => <option key={name}>{name}</option>)}
                        </select>
                      </label>
                    )}
                    <label className="min-w-[220px] flex-1">
                      <span className="sr-only">Capture what was agreed</span>
                      <Input value={captureText} onChange={(event) => setCaptureText(event.target.value)} placeholder="Capture what was agreed…" className="rounded-sm" />
                    </label>
                    <Button type="submit" variant="outline" size="sm"><Plus /> Add capture</Button>
                  </form>
                )}
              </div>
            </div>

            <footer className="mt-7 flex flex-wrap items-center justify-end gap-3 border-t border-black/10 pt-5">
              <Link href="/artifact" className={buttonVariants({ className: "bg-[var(--brand-accent)] text-white hover:bg-[var(--brand-accent-dark)]" })}>Generate business case <ArrowRight /></Link>
            </footer>
          </div>
        </section>
      </div>
    </div>
  );
}
