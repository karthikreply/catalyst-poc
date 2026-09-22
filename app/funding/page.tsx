"use client";

import Link from "next/link";
import { ArrowLeft, FileCheck2, LockKeyhole } from "lucide-react";

import { useSession } from "@/components/session-provider";
import { withBrandPeople } from "@/lib/brands";
import { ledgerAnnualTotal } from "@/lib/cost-model";
import { claimsArtifactCopy } from "@/lib/session";
import { formatCurrency } from "@/lib/value";

export default function FundingPage() {
  const { graph, brand, viewer } = useSession();
  const people = withBrandPeople(brand);
  const claims = claimsArtifactCopy(graph);
  const ghost = graph.session.mechanic === "ghost-ledger";
  const annualValue = ghost
    ? graph.session.ledgerFrozen
      ? graph.outcome.annualValue
      : ledgerAnnualTotal(graph.costComponents)
    : graph.outcome.annualValue;
  const value = graph.session.claimsVolumeChoice === "unconfirmed" && !ghost
    ? "Pending volume confirmation"
    : graph.session.claimsVolumeChoice === "range-250-500" && !ghost
      ? "$4.8M–$9.7M / year"
      : `${formatCurrency(annualValue)} / year`;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-8">
      <p className="md-label-large text-[var(--md-sys-color-primary)]">Funding</p>
      <h1 className="md-headline-medium mt-1">DAF substantiation pack</h1>
      <p className="md-body-large mt-3 max-w-3xl text-[var(--md-sys-color-on-surface-variant)]">The partner submits the claim. The platform vendor reviews evidence shared by the partner; it does not rewrite the business case.</p>

      <div className="mt-7 grid gap-5 lg:grid-cols-[1fr_320px]">
        <section className="md-card-outlined overflow-hidden">
          <div className="flex items-center gap-3 border-b border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] p-5">
            <span className="grid size-11 place-items-center rounded-[var(--md-sys-shape-large)] bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)]"><FileCheck2 /></span>
            <div>
              <p className="md-title-medium">Session evidence</p>
              <p className="md-label-medium text-[var(--md-sys-color-on-surface-variant)]">{graph.session.id}</p>
            </div>
            <span className="md-chip ml-auto">Draft · not submitted</span>
          </div>

          <dl className="grid gap-px bg-[var(--md-sys-color-outline-variant)] sm:grid-cols-2">
            {[
              ["Customer", graph.session.customerName],
              ["Partner", brand.partnerName],
              ["Use case", graph.outcome.useCase],
              ["Value", value],
              ["Mechanic", ghost ? "Ghost ledger" : "Value sprint"],
              ["Delivery", graph.session.delivery === "self-service" ? "Self-service · unverified estimate" : "Facilitated"],
            ].map(([term, detail]) => (
              <div key={term} className="bg-[var(--md-sys-color-surface)] p-5">
                <dt className="md-label-medium text-[var(--md-sys-color-on-surface-variant)]">{term}</dt>
                <dd className="md-body-large mt-1">{detail}</dd>
              </div>
            ))}
          </dl>

          <div className="p-5">
            <h2 className="md-title-medium">Attributed evidence</h2>
            <ul className="mt-4 space-y-3">
              {graph.captures.slice(0, 5).map((capture) => (
                <li key={capture.id} className="md-body-medium rounded-[var(--md-sys-shape-small)] bg-[var(--md-sys-color-surface-container)] p-4">
                  <strong>{capture.attributedTo}</strong> — {capture.text}
                </li>
              ))}
            </ul>
            {claims.status && <p className="md-body-medium mt-4 text-[var(--md-sys-color-on-surface-variant)]">{claims.status}</p>}
          </div>
        </section>

        <aside className="md-card-elevated h-fit p-5">
          <LockKeyhole className="size-6 text-[var(--md-sys-color-primary)]" />
          <h2 className="md-title-large mt-4">{viewer.actor === "partner" ? "Partner submission" : "Vendor review"}</h2>
          <p className="md-body-medium mt-3 text-[var(--md-sys-color-on-surface-variant)]">Practice sponsor: {people.sponsorLine}</p>
          <button type="button" disabled className="md-button-filled mt-5 w-full cursor-not-allowed opacity-55">
            {viewer.actor === "partner" ? "Submit funding claim" : "Approve funding claim"}
          </button>
          <p className="md-label-medium mt-3 text-[var(--md-sys-color-on-surface-variant)]">Disabled · illustrative. Submission and approval happen in the partner portal.</p>
        </aside>
      </div>

      <Link href="/artifact" className="md-button-outlined mt-6"><ArrowLeft className="size-4" /> Back to business case</Link>
    </div>
  );
}
