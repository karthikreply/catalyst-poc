"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Lightbulb, Plus } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { GhostLedgerPanel } from "@/components/ghost-ledger-panel";
import { Input } from "@/components/ui/input";
import { useSession } from "@/components/session-provider";
import { ValueSprintPanel } from "@/components/value-sprint-panel";
import { withBrandPeople } from "@/lib/brands";
import { cn } from "@/lib/utils";
import type { Mechanic } from "@/lib/seed";

const suggestions = [
  { attributedTo: "Robert Osei", text: "A reviewer must be able to see the source field beside every extracted value." },
  { attributedTo: "Alex Chen", text: "We can isolate 500 anonymised claims without changing the claims platform." },
];

export default function RunPage() {
  const { graph, brand, addCapture, setActiveStep, setMechanic, canEditSession, viewer } = useSession();
  const people = withBrandPeople(brand);
  const activeStep = graph.agenda.find((step) => step.state === "active") ?? graph.agenda[2];
  const [captureText, setCaptureText] = useState("");
  const [person, setPerson] = useState("Dana Reyes");
  const [suggesting, setSuggesting] = useState(false);
  const [suggestionIndex, setSuggestionIndex] = useState(0);
  const selfService = graph.session.delivery === "self-service";
  const capturePerson = selfService ? "Dana Reyes" : person;

  function submitCapture(event: FormEvent) {
    event.preventDefault();
    if (!captureText.trim() || !canEditSession) return;
    addCapture({ stepId: activeStep.id, attributedTo: capturePerson, text: captureText.trim() });
    setCaptureText("");
  }

  function suggestFollowUp() {
    if (!canEditSession) return;
    setSuggesting(true);
    window.setTimeout(() => {
      const suggestion = suggestions[suggestionIndex % suggestions.length];
      addCapture({ stepId: activeStep.id, ...suggestion });
      setSuggestionIndex((index) => index + 1);
      setSuggesting(false);
    }, 450);
  }

  return (
    <div className="mx-auto max-w-[1440px]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/10 bg-white px-5 py-4 lg:px-8">
        <div>
          <h1 className="text-lg font-semibold">Heartland Mutual · value session</h1>
          <p className="mt-0.5 text-xs text-black/50">
            {brand.productName} · {selfService ? "Self-service · no facilitator present" : `Facilitated by ${graph.session.facilitator?.name ?? "Ravi Menon"} · ${people.facilitatorOrg}`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <label className="flex items-center gap-2 text-xs">
            <span className="text-black/45">Mechanic</span>
            <select
              value={graph.session.mechanic}
              disabled={!canEditSession}
              onChange={(event) => setMechanic(event.target.value as Mechanic)}
              className="h-8 rounded-sm border border-black/15 bg-white px-2 text-xs"
            >
              <option value="value-sprint">Value sprint</option>
              <option value="ghost-ledger">Ghost ledger</option>
            </select>
          </label>
          <span className="font-mono font-semibold tabular-nums">10:42</span>
          <span className="rounded-sm border border-black/10 bg-[#f7f7f5] px-2.5 py-1 text-xs font-medium">Step {activeStep.order} of 5</span>
        </div>
      </div>

      {selfService && (
        <p className="border-b border-black/10 bg-[#fafaf8] px-5 py-2 text-xs text-black/55 lg:px-8">Self-service — no facilitator present. Output is a qualification-grade business case.</p>
      )}
      {viewer.actor === "cpm" && (
        <p className="border-b border-black/10 bg-[#fafaf8] px-5 py-2 text-xs text-black/55 lg:px-8">Historical session record — the platform vendor sees completed evidence shared by the partner, not live session activity.</p>
      )}

      <div className="grid min-h-[calc(100vh-129px)] md:grid-cols-[180px_1fr]">
        <aside className="border-b border-black/10 bg-white p-4 md:border-b-0 md:border-r">
          <ol className="grid grid-cols-5 gap-2 md:block md:space-y-1">
            {graph.agenda.map((step) => (
              <li key={step.id}>
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
              </li>
            ))}
          </ol>
        </aside>

        <section className="p-5 lg:p-8">
          <div className="mx-auto max-w-5xl">
            <p className="mb-2 text-sm font-medium text-black/45">{activeStep.title} · {activeStep.durationMinutes} min</p>
            <h2 className="max-w-4xl text-2xl font-semibold leading-tight tracking-tight md:text-3xl">{activeStep.prompt}</h2>

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
                        <select value={person} onChange={(event) => setPerson(event.target.value)} className="h-9 rounded-sm border border-black/15 bg-white px-2 text-sm outline-none focus:border-[var(--accent)]">
                          {["Dana Reyes", "Michelle Dorsey", "Alex Chen", "Robert Osei", "Sandeep Nair"].map((name) => <option key={name}>{name}</option>)}
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

            <footer className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t border-black/10 pt-5">
              <Button variant="outline" onClick={suggestFollowUp} disabled={suggesting || !canEditSession}><Lightbulb />{suggesting ? "Thinking…" : "Suggest follow-up"}</Button>
              <Link href="/artifact" className={buttonVariants({ className: "bg-[var(--accent)] text-white hover:bg-[var(--accent-dark)]" })}>Generate business case <ArrowRight /></Link>
            </footer>
          </div>
        </section>
      </div>
    </div>
  );
}
