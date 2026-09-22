"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Download } from "lucide-react";
import html2canvas from "html2canvas-pro";
import jsPDF from "jspdf";

import { Button, buttonVariants } from "@/components/ui/button";
import { UnavailableControl } from "@/components/unavailable-control";
import { useSession } from "@/components/session-provider";
import { withBrandPeople } from "@/lib/brands";
import { componentMonthlyTotal, ledgerMonthlyTotal } from "@/lib/cost-model";
import type { CostComponent } from "@/lib/seed";
import { calculateDailyValue, formatCurrency, formatPreciseCurrency } from "@/lib/value";

function componentArithmetic(component: CostComponent) {
  switch (component.id) {
    case "handling": {
      const claims = component.inputs[0].quantity;
      const delay = component.inputs[1].quantity;
      const cost = component.inputs[2].quantity;
      return `${claims} × ${delay} × ${formatPreciseCurrency(cost)} × 30 = ${formatCurrency(componentMonthlyTotal(component))} / month`;
    }
    case "review": {
      const hours = component.inputs[0].quantity;
      const rate = component.inputs[1].quantity;
      return `${hours} × 4.33 × ${formatPreciseCurrency(rate)} = ${formatCurrency(componentMonthlyTotal(component))} / month`;
    }
    case "rework": {
      const claims = component.inputs[0].quantity;
      const reopen = component.inputs[1].quantity;
      const each = component.inputs[2].quantity;
      return `${claims} × 30 × ${reopen} × ${formatCurrency(each)} = ${formatCurrency(componentMonthlyTotal(component))} / month`;
    }
    case "overtime":
      return `${formatCurrency(component.inputs[0].quantity)} / month`;
    default:
      return formatCurrency(componentMonthlyTotal(component));
  }
}

export default function ArtifactPage() {
  const { graph, brand, viewer } = useSession();
  const people = withBrandPeople(brand);
  const [dafOpen, setDafOpen] = useState(false);
  const claims = graph.valueInputs.find((input) => input.id === "claims")!;
  const delay = graph.valueInputs.find((input) => input.id === "delay")!;
  const handling = graph.valueInputs.find((input) => input.id === "handling")!;
  const daily = calculateDailyValue(claims.quantity, delay.quantity, handling.quantity);
  const problemQuotes = graph.captures.filter((capture) => ["Michelle Dorsey", "Dana Reyes", "Alex Chen"].includes(capture.attributedTo)).slice(0, 3);
  const compliance = graph.captures.find((capture) => capture.attributedTo === "Robert Osei");
  const selfService = graph.session.delivery === "self-service";
  const ghost = graph.session.mechanic === "ghost-ledger";
  const partial = graph.outcome.partiallyEstimated || graph.costComponents.some((row) => row.confirmedBy === null);
  const qualified = graph.session.qualified;

  const actions = {
    partner: {
      primary: "Start DAF funding request",
      secondary: qualified ? "Request a facilitated session" : "Schedule pilot kickoff",
    },
    pdm: { primary: "Review funding request", secondary: "Flag as reference story" },
    cpm: { primary: "Review funding request", secondary: "Flag as reference story" },
  }[viewer.actor];

  async function downloadPdf() {
    const artifact = document.getElementById("business-case");
    if (!artifact) return;
    const canvas = await html2canvas(artifact, {
      scale: 2,
      backgroundColor: "#ffffff",
      useCORS: true,
      logging: false,
    });
    const pdf = new jsPDF({ unit: "pt", format: "letter" });
    const margin = 28;
    const pageWidth = pdf.internal.pageSize.getWidth() - margin * 2;
    const pageHeight = pdf.internal.pageSize.getHeight() - margin * 2;
    const imageHeight = (canvas.height * pageWidth) / canvas.width;
    const image = canvas.toDataURL("image/jpeg", 0.94);
    for (let offset = 0; offset < imageHeight; offset += pageHeight) {
      if (offset > 0) pdf.addPage();
      pdf.addImage(image, "JPEG", margin, margin - offset, pageWidth, imageHeight);
    }
    pdf.save("heartland-mutual-business-case.pdf");
  }

  return (
    <div className="px-5 py-8 lg:px-8">
      <div className="mx-auto mb-4 flex max-w-4xl flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Business case</h1>
          <p className="text-sm text-black/50">Ready for Dana to take to Karen.</p>
        </div>
        <Button onClick={downloadPdf} className="bg-[var(--accent)] hover:bg-[var(--accent-dark)]"><Download /> Download PDF</Button>
      </div>

      <article id="business-case" className="mx-auto max-w-4xl rounded-sm border border-black/10 bg-white">
        <header className="border-b border-black/10 p-7 md:p-10" style={{ borderTop: `5px solid ${brand.accent}` }}>
          <div className="flex items-center justify-between gap-4">
            <span className="text-base font-black tracking-[-0.08em]" style={{ color: brand.accent }}>{brand.mark}</span>
            <span className="text-xs text-black/45">{brand.productName}</span>
          </div>
          <h2 className="mt-12 text-3xl font-semibold tracking-tight">A grounded case for assisted claims intake</h2>
          <p className="mt-3 text-base text-black/58">{brand.artifactIntro}</p>
        </header>

        <div className="space-y-10 p-7 md:p-10">
          <section>
            <h3 className="text-lg font-semibold">The problem, in Heartland’s words</h3>
            <div className="mt-4 space-y-3">
              {problemQuotes.map((quote) => (
                <blockquote key={quote.id} className="border-l-2 pl-4 text-[15px] leading-7" style={{ borderColor: brand.accent }}>
                  “{quote.text}” <cite className="not-italic text-black/48">— {quote.attributedTo}</cite>
                </blockquote>
              ))}
            </div>
          </section>

          <section className="rounded-sm border border-black/10 bg-[#fafaf8] p-5">
            <h3 className="text-lg font-semibold">What it costs</h3>
            {ghost ? (
              <>
                <p className="mt-3 text-2xl font-semibold tabular-nums">{formatCurrency(graph.outcome.annualValue)} / year</p>
                {partial && <p className="mt-1 text-sm font-medium text-amber-800">Partially estimated</p>}
                <ul className="mt-4 space-y-3">
                  {graph.costComponents.map((component) => (
                    <li key={component.id} className="text-sm leading-6">
                      <p className="font-semibold">{component.label}</p>
                      <p className="tabular-nums text-black/70">{componentArithmetic(component)}</p>
                      <p className="text-xs text-black/45">
                        {selfService
                          ? "Respondent-confirmed · not facilitator-verified"
                          : component.confirmedBy
                            ? `Confirmed by ${component.confirmedBy}`
                            : "Unconfirmed · estimate"}
                      </p>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-sm text-black/58">
                  Monthly total {formatCurrency(ledgerMonthlyTotal(graph.costComponents))}. At twelve months, {formatCurrency(graph.outcome.annualValue)} per year.
                </p>
              </>
            ) : (
              <>
                <p className="mt-3 text-2xl font-semibold tabular-nums">{claims.quantity} × {delay.quantity} × {formatPreciseCurrency(handling.quantity)} = {formatCurrency(daily)} / day</p>
                <p className="mt-2 text-sm leading-6 text-black/58">
                  {claims.quantity} claims per day × {delay.quantity} avoidable days × {formatPreciseCurrency(handling.quantity)} handling cost. At 250 working days, that is <strong className="text-black">{formatCurrency(graph.outcome.annualValue)} per year</strong>.
                </p>
                <p className="mt-2 text-xs text-black/42">
                  {selfService
                    ? "Respondent-confirmed · not facilitator-verified"
                    : `Inputs confirmed by ${claims.confirmedBy} and ${handling.confirmedBy}.`}
                </p>
              </>
            )}
          </section>

          <section>
            <h3 className="text-lg font-semibold">The agreed constraint</h3>
            <p className="mt-3 leading-7">“{compliance?.text ?? graph.outcome.constraint}” <span className="text-black/48">— Robert Osei, Compliance Officer</span></p>
            <p className="mt-2 text-sm text-black/58">The pilot keeps human review on low-confidence extractions.</p>
          </section>

          <section>
            <h3 className="text-lg font-semibold">The proposed pilot</h3>
            <dl className="mt-4 grid gap-px overflow-hidden rounded-sm border border-black/10 bg-black/10 sm:grid-cols-2">
              {[
                ["Scope", "AI-assisted extraction from 500 anonymised claims"],
                ["Duration", "Six weeks"],
                ["Owner", graph.outcome.owner],
                ["Success", "Process 500 anonymised claims with an audit trail and human review for low-confidence fields"],
              ].map(([term, detail]) => (
                <div key={term} className="bg-white p-4"><dt className="text-xs font-medium text-black/45">{term}</dt><dd className="mt-1 text-sm leading-6">{detail}</dd></div>
              ))}
            </dl>
          </section>

          <section className="border-t border-black/10 pt-8">
            <h3 className="text-lg font-semibold">The ask</h3>
            <p className="mt-3 max-w-2xl text-[15px] leading-7">Karen Whitfield, CFO: fund the six-week pilot and allow Alex Chen’s team to prepare 500 anonymised claims.</p>
            <p className="mt-8 text-sm font-semibold">{people.signoff}</p>
          </section>
        </div>
      </article>

      <div className="mx-auto mt-5 flex max-w-4xl flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {viewer.actor === "partner" ? (
            <Button type="button" className="bg-[var(--accent)] hover:bg-[var(--accent-dark)]" onClick={() => setDafOpen((value) => !value)}>
              {actions.primary}
            </Button>
          ) : (
            <UnavailableControl
              label={actions.primary}
              owner="Platform vendor"
              explanation="Funding review happens in the partner portal after a claim is submitted."
            />
          )}
          <UnavailableControl
            label={actions.secondary}
            owner={brand.partnerName}
            explanation={qualified ? "A qualified self-service case can request a facilitated follow-up; this demo does not book it." : "Scheduling the next operational step lives with the partner, not this screen."}
          />
        </div>

        {dafOpen && viewer.actor === "partner" && (
          <section className="rounded-sm border border-black/10 bg-white p-5">
            <p className="text-sm leading-6 text-black/70">Partner development funding is claimed by the partner using the session evidence.</p>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div><dt className="text-xs text-black/45">Session</dt><dd>{graph.session.id}</dd></div>
              <div><dt className="text-xs text-black/45">Customer</dt><dd>{graph.session.customerName}</dd></div>
              <div><dt className="text-xs text-black/45">Use case</dt><dd>{graph.outcome.useCase}</dd></div>
              <div><dt className="text-xs text-black/45">Value</dt><dd>{formatCurrency(graph.outcome.annualValue)} / year</dd></div>
            </dl>
            <p className="mt-4 text-sm font-medium">Evidence</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-black/65">
              {graph.captures.slice(0, 5).map((capture) => (
                <li key={capture.id}>{capture.attributedTo}: {capture.text}</li>
              ))}
            </ul>
            <p className="mt-4 text-sm">Practice sponsor: {people.sponsorLine}</p>
            <div className="mt-4">
              <UnavailableControl
                label="Submit funding claim"
                owner={`${brand.partnerName} partner portal`}
                explanation="Submits to partner portal."
              />
            </div>
          </section>
        )}

        <div className="flex justify-end">
          <Link href="/pilot-spec" className={buttonVariants({ variant: "outline" })}>Open pilot spec <ArrowRight /></Link>
        </div>
      </div>
    </div>
  );
}
