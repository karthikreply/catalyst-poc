"use client";

import { useEffect, useRef, useState } from "react";
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
import { formatCurrency, formatPreciseCurrency } from "@/lib/value";
import {
  artifactActions,
  artifactLimitsCopy,
  artifactPilotScopeCopy,
  claimsArtifactCopy,
  fundingAskCopy,
  inputsConfirmedByCopy,
} from "@/lib/session";
import { cn } from "@/lib/utils";

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
  const dafRef = useRef<HTMLElement>(null);
  const claims = graph.valueInputs.find((input) => input.id === "claims")!;
  const claimsCopy = claimsArtifactCopy(graph);
  const problemQuotes = graph.captures.filter((capture) => ["Michelle Dorsey", "Dana Reyes", "Alex Chen"].includes(capture.attributedTo)).slice(0, 3);
  const compliance = graph.captures.find((capture) => capture.attributedTo === "Robert Osei");
  const selfService = graph.session.delivery === "self-service";
  const ghost = graph.session.mechanic === "ghost-ledger";
  const partial = graph.outcome.partiallyEstimated || graph.costComponents.some((row) => row.confirmedBy === null);
  const qualified = graph.session.qualified;

  const actions = artifactActions(viewer.actor, qualified);

  useEffect(() => {
    if (!dafOpen) return;
    // Beside the case on wide screens the panel is already in view; only stacked layouts need the scroll.
    if (window.matchMedia("(min-width: 80rem)").matches) return;
    dafRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [dafOpen]);

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
          <p className="text-sm text-black/50">
            {graph.session.fundingRoute === "brief-dana"
              ? "Ready for Dana to carry the ask."
              : graph.session.fundingRoute === "invite-karen"
                ? "Ready for Karen."
                : "Ready for Dana to take to Karen."}
          </p>
        </div>
        <Button onClick={downloadPdf} className="bg-[var(--accent)] hover:bg-[var(--accent-dark)]"><Download /> Download PDF</Button>
      </div>

      <div className="sticky top-16 z-20 -mx-5 border-y border-black/10 bg-white/95 px-5 py-3 backdrop-blur lg:-mx-8 lg:px-8">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center gap-3">
          <Button type="button" className="bg-[var(--accent)] hover:bg-[var(--accent-dark)]" onClick={() => setDafOpen((value) => !value)}>
            {actions.primary}
          </Button>
          <UnavailableControl
            label={actions.secondary}
            owner={brand.partnerName}
            explanation={qualified ? "A qualified self-service case can request a facilitated follow-up; this demo does not book it." : "Scheduling the next operational step lives with the partner, not this screen."}
          />
          {actions.tertiary && (
            <UnavailableControl
              label={actions.tertiary}
              owner={brand.partnerName}
              explanation="Sends this business case to the partner's assigned vendor PDM. This demo does not send mail."
            />
          )}
          <Link href="/pilot-spec" className={cn(buttonVariants({ variant: "outline" }), "ml-auto border-black/30 bg-[#f4f4f1] hover:bg-black/[.06]")}>
            Open pilot spec <ArrowRight />
          </Link>
        </div>
      </div>

      <div
        className={cn(
          "mx-auto",
          dafOpen
            ? "max-w-4xl xl:grid xl:max-w-[1216px] xl:grid-cols-[56rem_minmax(17rem,1fr)] xl:items-start xl:gap-6 2xl:max-w-[1440px]"
            : "max-w-4xl",
        )}
      >
      {dafOpen && (
        <section
          ref={dafRef}
          className="mt-5 scroll-mt-36 rounded-sm border border-black/10 bg-white p-5 xl:order-2 xl:sticky xl:top-32 xl:max-h-[calc(100vh-9rem)] xl:overflow-y-auto"
        >
          <p className="text-sm leading-6 text-black/70">
            {viewer.actor === "partner"
              ? "Partner development funding is claimed by the partner using the session evidence."
              : "The partner claims partner development funding against this evidence. The vendor reviews it."}
          </p>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-1">
            <div><dt className="text-xs text-black/45">Session</dt><dd>{graph.session.id}</dd></div>
            <div><dt className="text-xs text-black/45">Customer</dt><dd>{graph.session.customerName}</dd></div>
            <div><dt className="text-xs text-black/45">Use case</dt><dd>{graph.outcome.useCase}</dd></div>
            <div>
              <dt className="text-xs text-black/45">Value</dt>
              <dd>
                {graph.session.claimsVolumeChoice === "range-250-500"
                  ? "$4.8M–$9.7M / year"
                  : graph.session.claimsVolumeChoice === "unconfirmed"
                    ? "Pending volume confirmation"
                    : `${formatCurrency(graph.outcome.annualValue)} / year`}
              </dd>
            </div>
          </dl>
          <p className="mt-4 text-sm font-medium">Evidence</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-black/65">
            {graph.captures.slice(0, 5).map((capture) => (
              <li key={capture.id}>{capture.attributedTo}: {capture.text}</li>
            ))}
          </ul>
          <p className="mt-4 text-sm">Practice sponsor: {people.sponsorLine}</p>
          <div className="mt-4">
            {viewer.actor === "partner" ? (
              <UnavailableControl
                label="Submit funding claim"
                owner={`${brand.partnerName} partner portal`}
                explanation="Submits to partner portal."
              />
            ) : (
              <UnavailableControl
                label="Approve funding claim"
                owner="Platform vendor"
                explanation="Funding review happens in the partner portal after the partner submits a claim."
              />
            )}
          </div>
        </section>
      )}

      <article id="business-case" className="mx-auto mt-5 max-w-4xl rounded-sm border border-black/10 bg-white xl:order-1">
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
                <p className="mt-1 text-sm text-black/55">Four-component cost of inaction.</p>
                <p className="mt-3 text-2xl font-semibold tabular-nums">
                  {graph.session.claimsVolumeChoice === "range-250-500"
                    ? "$4.8M–$9.7M / year"
                    : graph.session.claimsVolumeChoice === "unconfirmed"
                      ? claimsCopy.headline
                      : `${formatCurrency(graph.outcome.annualValue)} / year`}
                </p>
                {(claimsCopy.status || partial) && (
                  <p className="mt-1 text-sm font-medium text-amber-800">{claimsCopy.status ?? "Partially estimated"}</p>
                )}
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
                {graph.session.claimsVolumeChoice === "range-250-500" ? (
                  <p className="mt-3 text-sm text-black/58">Ledger rows use the 375-claim midpoint for planning; the funding case carries $4.8M–$9.7M per year.</p>
                ) : graph.session.claimsVolumeChoice === "unconfirmed" ? (
                  <p className="mt-3 text-sm text-black/58">Ledger rows are provisional until claims volume is confirmed.</p>
                ) : (
                  <p className="mt-3 text-sm text-black/58">
                    Monthly total {formatCurrency(ledgerMonthlyTotal(graph.costComponents))}. At twelve months, {formatCurrency(graph.outcome.annualValue)} per year.
                  </p>
                )}
              </>
            ) : (
              <>
                <p className="mt-3 text-2xl font-semibold tabular-nums">{claimsCopy.headline}</p>
                <p className="mt-2 text-sm leading-6 text-black/58">{claimsCopy.detail}</p>
                {claimsCopy.status && <p className="mt-1 text-sm font-medium text-amber-800">{claimsCopy.status}</p>}
                <p className="mt-2 text-xs text-black/42">
                  {graph.session.claimsVolumeChoice === "range-250-500"
                    ? "Volume supplied as a range · midpoint used only for planning inputs."
                    : graph.session.claimsVolumeChoice === "unconfirmed"
                      ? "No respondent confirmation yet."
                      : selfService
                    ? "Respondent-confirmed · not facilitator-verified"
                    : claims.confirmedBy
                      ? inputsConfirmedByCopy(graph)
                      : "Volume is an unconfirmed estimate from scope."}
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
            <h3 className="text-lg font-semibold">{artifactLimitsCopy.heading}</h3>
            <p className="mt-3 max-w-2xl text-[15px] leading-7 text-black/70">{artifactLimitsCopy.body}</p>
          </section>

          <section>
            <h3 className="text-lg font-semibold">The proposed pilot</h3>
            <dl className="mt-4 grid gap-px overflow-hidden rounded-sm border border-black/10 bg-black/10 sm:grid-cols-2">
              {[
                ["Scope", artifactPilotScopeCopy(graph, brand)],
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
            <p className="mt-3 max-w-2xl text-[15px] leading-7">{fundingAskCopy(graph)}</p>
            <p className="mt-8 text-sm font-semibold">{people.signoff}</p>
          </section>
        </div>
      </article>
      </div>
    </div>
  );
}
