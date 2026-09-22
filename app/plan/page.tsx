"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Clipboard, Clock, TriangleAlert } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { UnavailableControl } from "@/components/unavailable-control";
import { useSession } from "@/components/session-provider";
import { withBrandPeople } from "@/lib/brands";
import { patterns, prework, type Delivery, type Mechanic } from "@/lib/seed";
import { cn } from "@/lib/utils";

export default function PlanPage() {
  const { graph, brand, setDelivery, setMechanic, canEditSession } = useSession();
  const people = withBrandPeople(brand);
  const [copied, setCopied] = useState<"facilitated" | "self-service" | null>(null);
  const pattern = patterns.find((item) => item.id === graph.session.patternId)!;

  const facilitatedEmail = `Hi Dana,

Thanks for bringing the Heartland team together. ${brand.emailIntro}

In three hours, we’ll map the claims-intake bottleneck, agree the cost inputs, set the compliance boundary, and shape a six-week pilot on 500 anonymised claims. Please bring the claims supervisor, a developer, compliance, and infrastructure.

We’ll leave with a business case that shows its arithmetic and credits every decision to the room.

Regards,
${people.signoff}`;

  const selfServiceEmail = `Hi Dana,

${brand.emailIntro}

I’m sending a guided walkthrough of the Heartland claims-intake case. Please confirm daily volume, handling cost, and a named owner so we can leave with a qualification-grade business case.

If the numbers hold, we can request a facilitated session next.

Regards,
${people.signoff}`;

  async function copyEmail(kind: "facilitated" | "self-service") {
    await navigator.clipboard.writeText(kind === "facilitated" ? facilitatedEmail : selfServiceEmail);
    setCopied(kind);
    window.setTimeout(() => setCopied(null), 1600);
  }

  return (
    <div className="mx-auto max-w-5xl px-5 py-10 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-black/48">Heartland Mutual Insurance</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Session plan</h1>
          <p className="mt-2 text-sm text-black/55">
            Three hours · Tuesday, 9:00 AM · {graph.session.delivery === "self-service" ? "Self-service · no facilitator present" : `Facilitated by Ravi Menon · ${people.facilitatorOrg}`}
          </p>
        </div>
        <Link href="/run" className={buttonVariants({ className: "bg-[var(--accent)] hover:bg-[var(--accent-dark)]" })}>Open live session <ArrowRight /></Link>
      </div>

      {!canEditSession && (
        <p className="mt-4 rounded-sm border border-black/10 bg-[#fafaf8] px-4 py-3 text-sm text-black/58">Historical session record. Delivery and mechanic were set by the partner before the session ran.</p>
      )}

      <div className="mt-8 space-y-5">
        <section className="rounded-sm border border-black/10 bg-white p-6">
          <h2 className="text-lg font-semibold">How this session runs</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div>
              <p className="text-xs font-medium text-black/45">Delivery</p>
              <div className="mt-2 grid gap-2">
                {([
                  ["facilitated", "Facilitated", "A partner specialist is in the room."],
                  ["self-service", "Self-service", "Dana confirms the numbers without a facilitator."],
                ] as [Delivery, string, string][]).map(([value, label, hint]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setDelivery(value)}
                    className={cn("rounded-sm border p-3 text-left text-sm", graph.session.delivery === value ? "border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_6%,white)]" : "border-black/10")}
                  >
                    <span className="font-semibold">{label}</span>
                    <span className="mt-1 block text-xs text-black/50">{hint}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-black/45">Mechanic</p>
              <div className="mt-2 grid gap-2">
                {([
                  ["value-sprint", "Value sprint", "Agree the cost of the problem and commit to a next step."],
                  ["ghost-ledger", "Ghost ledger", "The room watches the cost accumulate in real time. Needs their real numbers."],
                ] as [Mechanic, string, string][]).map(([value, label, hint]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setMechanic(value)}
                    className={cn("rounded-sm border p-3 text-left text-sm", graph.session.mechanic === value ? "border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_6%,white)]" : "border-black/10")}
                  >
                    <span className="font-semibold">{label}</span>
                    <span className="mt-1 block text-xs text-black/50">{hint}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <p className="mt-4 text-sm text-black/55">Practice sponsor: {people.sponsorLine}</p>
        </section>

        <section className="rounded-sm border border-black/10 bg-white p-6">
          <h2 className="text-lg font-semibold">Three-hour agenda</h2>
          <ol className="mt-5 divide-y divide-black/10 border-y border-black/10">
            {graph.agenda.map((step) => (
              <li key={step.id} className="grid gap-2 py-4 md:grid-cols-[36px_180px_90px_1fr] md:items-start">
                <span className="grid size-6 place-items-center rounded-full text-xs font-semibold text-white" style={{ background: brand.accent }}>{step.order}</span>
                <span className="font-semibold">{step.title}</span>
                <span className="flex items-center gap-1 text-sm text-black/48"><Clock className="size-3.5" />{step.durationMinutes} min</span>
                <span className="text-sm leading-6 text-black/62">“{step.prompt}”</span>
              </li>
            ))}
          </ol>
          <p className="mt-4 text-xs text-black/45">{pattern.name} typically surfaces a {pattern.typicalValueRange.toLowerCase()}. Source: curated pattern library.</p>
        </section>

        <section className="rounded-sm border border-black/10 bg-white p-6">
          <h2 className="text-lg font-semibold">Who needs to be in the room</h2>
          <div className="mt-5 grid gap-px overflow-hidden rounded-sm border border-black/10 bg-black/10 md:grid-cols-2">
            {graph.attendees.map((person) => (
              <div key={person.id} className={cn("bg-white p-4", person.attendance === "invited-not-attending" && "bg-[#fafaf8]")}>
                <p className="font-semibold">{person.name}</p>
                <p className="text-xs text-black/45">{person.role}</p>
                <p className="mt-2 flex items-start gap-2 text-sm leading-6 text-black/62">
                  {person.name === "Robert Osei" && <TriangleAlert className="mt-1 size-4 shrink-0 text-amber-600" />}
                  {person.reason}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-sm border border-black/10 bg-white p-6">
          <h2 className="text-lg font-semibold">Pre-work</h2>
          <ul className="mt-4 space-y-3">{prework.map((item) => <li key={item} className="flex gap-3 text-sm leading-6"><Check className="mt-1 size-4 shrink-0" style={{ color: brand.accent }} />{item}</li>)}</ul>
        </section>

        <section className="rounded-sm border border-black/10 bg-white p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">Draft invitation to Dana</h2>
              <p className="mt-1 text-sm text-black/48">Written in {brand.partnerName}’s voice. Copy either draft; delivery does not rewrite the other.</p>
            </div>
          </div>
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {([
              ["facilitated", "Facilitated session", facilitatedEmail],
              ["self-service", "Self-service walkthrough", selfServiceEmail],
            ] as const).map(([kind, title, body]) => (
              <div key={kind} className="rounded-sm border border-black/10 p-4">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold">{title}</h3>
                  <Button variant="outline" size="sm" onClick={() => copyEmail(kind)}>{copied === kind ? <Check /> : <Clipboard />}{copied === kind ? "Copied" : "Copy"}</Button>
                </div>
                <div className="mt-3 whitespace-pre-wrap text-sm leading-7 text-black/70">{body}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-sm border border-black/10 bg-white p-6">
          <h2 className="text-lg font-semibold">CRM</h2>
          <p className="mt-2 text-sm text-black/55">Attendees and economic-buyer status came from CRM. Pushing updates back is a partner-owned seam.</p>
          <div className="mt-4">
            <UnavailableControl label="Push to CRM" owner={brand.partnerName} explanation="Would write attendance and next-step status back to the partner CRM." />
          </div>
        </section>
      </div>
    </div>
  );
}
