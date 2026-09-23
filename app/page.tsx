"use client";

import Link from "next/link";
import { ArrowRight, BadgeDollarSign, ChartNoAxesCombined, CircleHelp, Presentation, Shapes } from "lucide-react";

import { useSession } from "@/components/session-provider";

export default function Home() {
  const { viewer, setActor } = useSession();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-8 md:py-12">
      <p className="md-label-large text-[var(--md-sys-color-primary)]">Program dashboard</p>
      <h1 className="md-display-small mt-2">Hello, {viewer.name.split(" ")[0]}</h1>
      <p className="md-body-large mt-3 max-w-2xl text-[var(--md-sys-color-on-surface-variant)]">Launch and govern partner-led value sessions from one neutral program surface.</p>

      <section className="md-card-elevated mt-8 grid gap-6 p-6 md:grid-cols-[1fr_auto] md:items-center md:p-8">
        <div>
          <div className="flex items-center gap-3">
            <span className="grid size-12 place-items-center rounded-[var(--md-sys-shape-large)] bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)]"><Presentation /></span>
            <div>
              <p className="md-label-medium text-[var(--md-sys-color-primary)]">VALUE SESSIONS</p>
              <h2 className="md-headline-medium">Turn account evidence into a funded pilot</h2>
            </div>
          </div>
          <p className="md-body-large mt-4 max-w-2xl text-[var(--md-sys-color-on-surface-variant)]">The partner-branded workflow opens inside this program shell. Evidence and document ownership stay with the partner.</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <button type="button" onClick={() => setActor("pdm")} className={`md-chip ${viewer.actor === "pdm" ? "bg-[var(--md-sys-color-primary-container)]" : ""}`}>PDM lens</button>
            <button type="button" onClick={() => setActor("partner")} className={`md-chip ${viewer.actor === "partner" ? "bg-[var(--md-sys-color-primary-container)]" : ""}`}>Partner lens</button>
            <button type="button" onClick={() => setActor("cpm")} className={`md-chip ${viewer.actor === "cpm" ? "bg-[var(--md-sys-color-primary-container)]" : ""}`}>CPM lens</button>
          </div>
        </div>
        <Link href="/scope" className="md-button-filled">Open value sessions <ArrowRight className="size-4" /></Link>
      </section>

      <section className="md-card-outlined mt-4 flex flex-wrap items-center gap-4 p-5 opacity-60">
        <div className="grid size-11 place-items-center rounded-[var(--md-sys-shape-large)] bg-[var(--md-sys-color-surface-container)]"><Presentation className="size-5" /></div>
        <div className="min-w-64 flex-1">
          <h2 className="md-title-medium">Campaign self-service entry</h2>
          <p className="md-body-medium text-[var(--md-sys-color-on-surface-variant)]">Unauthenticated campaign entry needs a different question set and is outside this demo.</p>
        </div>
        <span className="md-chip">Illustrative · unavailable</span>
      </section>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardCard icon={BadgeDollarSign} title="Funding" body="Review the substantiation pack behind a partner claim." href="/funding" />
        <DashboardCard icon={ChartNoAxesCombined} title="Telemetry" body="Study conversion, qualification and funded-pilot performance." href="/telemetry" />
        <DashboardCard icon={Shapes} title="Programs" body="Program catalogue and campaign configuration." />
        <DashboardCard icon={CircleHelp} title="Support" body="Enablement guidance and operating support." />
      </div>

      <p className="md-body-medium mt-8 text-[var(--md-sys-color-on-surface-variant)]">Mock partner portal · illustrative. No provisioning, submission or customer-system connection occurs in this demo.</p>
    </div>
  );
}

function DashboardCard({
  icon: Icon,
  title,
  body,
  href,
}: {
  icon: typeof BadgeDollarSign;
  title: string;
  body: string;
  href?: string;
}) {
  const content = (
    <>
      <Icon className="size-6 text-[var(--md-sys-color-primary)]" />
      <h2 className="md-title-large mt-4">{title}</h2>
      <p className="md-body-medium mt-2 text-[var(--md-sys-color-on-surface-variant)]">{body}</p>
      <span className="md-label-medium mt-5 inline-flex text-[var(--md-sys-color-primary)]">{href ? "Open" : "Illustrative · unavailable"}</span>
    </>
  );
  return href
    ? <Link href={href} className="md-card-outlined block min-h-52 p-5 transition-colors hover:bg-[color-mix(in_srgb,var(--md-sys-color-primary)_5%,var(--md-sys-color-surface))]">{content}</Link>
    : <div aria-disabled="true" className="md-card-outlined min-h-52 p-5 opacity-60">{content}</div>;
}
