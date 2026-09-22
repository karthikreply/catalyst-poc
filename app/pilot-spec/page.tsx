"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Clipboard, Check } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { UnavailableControl } from "@/components/unavailable-control";
import { useSession } from "@/components/session-provider";
import { patterns } from "@/lib/seed";

const enableList = `# Enable list — customer cloud account
# This is a briefing, not a provisioner.
services:
  - document-store    # hold 500 anonymised claim packets
  - identity          # named owners and review roles
  - logging           # audit trail for assisted decisions
  - review-queue      # human review for low-confidence fields
  - extraction-worker # run extraction against the sample set
`;

const services = [
  ["Document store", "Holds the 500 anonymised claim packets for the six-week window."],
  ["Identity", "Names the Heartland owners who can confirm and review extractions."],
  ["Logging", "Keeps an audit trail for every assisted decision."],
  ["Review queue", "Routes low-confidence fields to a human, as Robert required."],
  ["Extraction worker", "Runs the intake extraction against the agreed sample."],
];

export default function PilotSpecPage() {
  const { graph } = useSession();
  const [copied, setCopied] = useState(false);
  const pattern = patterns.find((item) => item.id === graph.session.patternId)!;
  const compliance = graph.captures.find((capture) => capture.attributedTo === "Robert Osei");

  async function copySnippet() {
    await navigator.clipboard.writeText(enableList);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className="mx-auto max-w-5xl px-5 py-10 lg:px-8">
      <p className="text-sm text-black/48">{graph.session.customerName}</p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight">What the funded pilot consists of</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-black/58">The six-week funded slice, not a workshop agenda. Heartland’s team would stand this up in their own account.</p>

      <div className="mt-8 space-y-5">
        <section className="rounded-sm border border-black/10 bg-white p-6">
          <h2 className="text-lg font-semibold">Inherited from the session</h2>
          <dl className="mt-4 grid gap-px overflow-hidden rounded-sm border border-black/10 bg-black/10 sm:grid-cols-2">
            {[
              ["Use case", graph.outcome.useCase],
              ["Owner", graph.outcome.owner ?? "Alex Chen"],
              ["Constraint", `${compliance?.text ?? graph.outcome.constraint} (Robert Osei, 12 Feb)`],
              ["Next step", graph.outcome.nextStep],
              ...(graph.session.reusePriorPilotSpec == null
                ? []
                : [[
                    "Spec source",
                    graph.session.reusePriorPilotSpec
                      ? "Reused from prior funded document-pattern pilots"
                      : "New spec from this session",
                  ]]),
            ].map(([term, detail]) => (
              <div key={term} className="bg-white p-4"><dt className="text-xs font-medium text-black/45">{term}</dt><dd className="mt-1 text-sm leading-6">{detail}</dd></div>
            ))}
          </dl>
          <p className="mt-4 text-sm text-amber-800">Readiness: data owner identified. Security review needed — allow 5 days.</p>
        </section>

        <section className="rounded-sm border border-black/10 bg-white p-6">
          <h2 className="text-lg font-semibold">Environment</h2>
          <ul className="mt-4 space-y-3">
            {services.map(([name, reason]) => (
              <li key={name} className="text-sm leading-6"><span className="font-semibold">{name}.</span> {reason}</li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-black/58">Data: 500 anonymised claims with handwritten notes redacted from production identifiers.</p>
          <p className="mt-2 text-sm text-black/58">Provisioning happens in the customer&apos;s own cloud account, not here.</p>
          <div className="mt-4">
            <div className="mb-2 flex justify-end">
              <Button variant="outline" size="sm" onClick={copySnippet}>{copied ? <Check /> : <Clipboard />}{copied ? "Copied" : "Copy enable list"}</Button>
            </div>
            <pre className="overflow-x-auto rounded-sm border border-black/10 bg-[#fafaf8] p-4 text-xs leading-6">{enableList}</pre>
          </div>
        </section>

        <section className="rounded-sm border border-black/10 bg-white p-6">
          <h2 className="text-lg font-semibold">Starter kit · {pattern.name}</h2>
          <p className="mt-2 text-sm text-black/55">What the pattern already covers, and where it will still fail.</p>
          <p className="mt-4 text-xs font-medium text-black/45">Known gaps</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-black/70">
            {pattern.knownGaps.map((gap) => <li key={gap}>{gap}</li>)}
          </ul>
        </section>

        <section className="flex flex-wrap items-start gap-4 rounded-sm border border-black/10 bg-white p-6">
          <UnavailableControl label="Provision environment" owner="Heartland Mutual Insurance" explanation="Environment create would run in Heartland’s account after security review." />
          <UnavailableControl label="Fork repository" owner="Heartland build team" explanation="The starter kit would be handed to the customer's build team." />
        </section>
      </div>

      <div className="mt-6 flex justify-end">
        <Link href="/telemetry" className={buttonVariants({ variant: "outline" })}>View program telemetry <ArrowRight /></Link>
      </div>
    </div>
  );
}
