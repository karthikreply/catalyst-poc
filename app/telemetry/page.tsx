"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useSession } from "@/components/session-provider";
import {
  recentTelemetryRows,
  scopeTelemetry,
  summarizeTelemetry,
  telemetryBenchmarks,
  telemetrySeed,
  type TelemetrySession,
} from "@/lib/telemetry";
import { formatCompactCurrency } from "@/lib/value";

function Breakdown({ title, rows, details }: { title: string; rows: [string, number][]; details?: Record<string, string> }) {
  const max = Math.max(...rows.map(([, value]) => value), 1);
  return (
    <section className="rounded-sm border border-black/10 bg-white p-5">
      <h2 className="font-semibold">{title}</h2>
      <div className="mt-5 space-y-4">
        {rows.map(([label, value]) => (
          <div key={label}>
            <div className="mb-1.5 flex justify-between gap-3 text-sm"><span>{label}{details?.[label] && <span className="ml-2 text-xs text-black/42">{details[label]}</span>}</span><span className="font-semibold tabular-nums">{value}</span></div>
            <div className="h-1.5 bg-black/[.06]"><div className="h-full bg-[var(--accent)]" style={{ width: `${(value / max) * 100}%` }} /></div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function TelemetryPage() {
  const { graph, brand, viewer } = useSession();
  const [detail, setDetail] = useState(false);

  const rows = useMemo(() => {
    const scoped = scopeTelemetry([...telemetrySeed], {
      actor: viewer.actor,
      partnerName: brand.partnerName,
    });
    const overlay: TelemetrySession = {
      id: graph.session.id,
      quarter: "Q3 2026",
      partner: brand.partnerName as TelemetrySession["partner"],
      industry: graph.session.industry,
      pattern: "Document-heavy intake",
      outcome: "Pilot proposed",
      fundedValue: 0,
      opportunityValue: graph.outcome.annualValue,
      customer: graph.session.customerName,
      delivery: graph.session.delivery,
      mechanic: graph.session.mechanic,
      qualified: graph.session.qualified,
      converted: false,
      fundingClaimSubmitted: false,
      daysToFunded: null,
    };
    return [...scoped.filter((row) => row.id !== overlay.id), overlay];
  }, [graph, brand.partnerName, viewer.actor]);

  const summary = summarizeTelemetry(rows);
  const countBy = (key: "partner" | "pattern" | "mechanic") =>
    Object.entries(rows.reduce<Record<string, number>>((counts, row) => ({ ...counts, [row[key]]: (counts[row[key]] ?? 0) + 1 }), {}));
  const funnel = [
    ["Scoped", rows.length],
    ["Run", summary.sessionsRun],
    ["Pilot proposed", summary.pilotsProposed],
    ["Pilot funded", summary.pilotsFunded],
  ] as [string, number][];
  const patternConversion = Object.fromEntries(
    countBy("pattern").map(([pattern, count]) => {
      const funded = rows.filter((row) => row.pattern === pattern && row.outcome === "Pilot funded").length;
      return [pattern, `${funded} funded of ${count}`];
    }),
  );
  const mechanicRows: [string, number][] = [
    ["Value sprint", rows.filter((row) => row.mechanic === "value-sprint").length],
    ["Ghost ledger", rows.filter((row) => row.mechanic === "ghost-ledger").length],
  ];
  const mechanicDetails = {
    "Value sprint": viewer.actor === "partner"
      ? `${rows.filter((row) => row.mechanic === "value-sprint" && row.converted).length} funded · cohort n=${mechanicRows[0][1]}`
      : `${telemetryBenchmarks.valueSprintConversionRate}% program conversion · benchmark n=${telemetryBenchmarks.valueSprintSessions}`,
    "Ghost ledger": viewer.actor === "partner"
      ? `${rows.filter((row) => row.mechanic === "ghost-ledger" && row.converted).length} funded · cohort n=${mechanicRows[1][1]}`
      : `${telemetryBenchmarks.ghostLedgerConversionRate}% program conversion · benchmark n=${telemetryBenchmarks.ghostLedgerSessions}`,
  };
  const overlayRow = rows.find((row) => row.id === graph.session.id);
  const recent = [
    ...(overlayRow ? [overlayRow] : []),
    ...recentTelemetryRows(rows.filter((row) => row.id !== graph.session.id), 8),
  ];
  const teamThisQuarter = rows.filter((row) => row.quarter === "Q3 2026").length;

  return (
    <div className="mx-auto max-w-[1440px] px-5 py-8 lg:px-8">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div>
          <p className="text-sm text-black/48">
            {viewer.actor === "partner"
              ? `${brand.partnerName} team view · ${viewer.name}`
              : viewer.actor === "pdm"
                ? `My partners · ${viewer.name}`
                : `Program performance · ${viewer.name}`}
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Partner value-session telemetry</h1>
          <p className="mt-2 text-sm text-black/55">
            {viewer.actor === "partner"
              ? `${brand.partnerName} cohort · ${rows.length} scoped sessions over eight quarters · live Heartland overlay included`
              : `Program cohort · 250 historical sessions over eight quarters · live Heartland overlay shown separately`}
          </p>
        </div>
        <div className="w-full max-w-lg rounded-sm border border-black/10 bg-white p-4">
          <div className="flex items-center gap-3">
            <Switch id="customer-detail" checked={detail} onCheckedChange={setDetail} />
            <label htmlFor="customer-detail" className="text-sm font-semibold">Customer-level detail</label>
            <span className="ml-auto text-xs font-medium" style={{ color: detail ? brand.accent : undefined }}>{detail ? "On" : "Off"}</span>
          </div>
          <p className="mt-2 flex items-start gap-2 text-xs leading-5 text-black/52"><ShieldCheck className="mt-0.5 size-4 shrink-0" />Detail is shared only when {brand.partnerName} submits a funding claim.</p>
        </div>
      </div>

      <div className="mt-7 grid gap-px overflow-hidden rounded-sm border border-black/10 bg-black/10 sm:grid-cols-2 xl:grid-cols-4">
        {(viewer.actor === "partner"
          ? [
              ["My team's sessions in Q3 2026", teamThisQuarter.toLocaleString()],
              ["Funding claims submitted", summary.fundingClaimsSubmitted.toLocaleString()],
              ["Pilots funded", summary.pilotsFunded.toLocaleString()],
              ["Funded pipeline value", formatCompactCurrency(summary.fundedPipelineValue)],
            ]
          : [
              ["Sessions run", summary.sessionsRun.toLocaleString()],
              ["Pilots proposed", summary.pilotsProposed.toLocaleString()],
              ["Pilots funded", summary.pilotsFunded.toLocaleString()],
              ["Funded pipeline value", formatCompactCurrency(summary.fundedPipelineValue)],
            ]
        ).map(([label, value]) => (
          <div key={label} className="bg-white p-5"><p className="text-sm text-black/50">{label}</p><p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p></div>
        ))}
      </div>

      {viewer.actor !== "partner" && (
        <section className="mt-5 rounded-sm border border-black/10 bg-white p-5">
          <h2 className="font-semibold">Program benchmark cohort · n=250</h2>
          <p className="mt-3 text-sm leading-6 text-black/62">
            Facilitated {telemetryBenchmarks.facilitatedConversionRate}% · self-service {telemetryBenchmarks.selfServiceConversionRate}% · self-service qualified {telemetryBenchmarks.selfServiceQualificationRate}% · value sprint {telemetryBenchmarks.valueSprintConversionRate}% · ghost ledger {telemetryBenchmarks.ghostLedgerConversionRate}%.
          </p>
        </section>
      )}

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        {viewer.actor !== "partner" && <Breakdown title="Sessions by partner" rows={countBy("partner")} />}
        <Breakdown title={`Sessions by pattern · ${viewer.actor === "partner" ? `${brand.partnerName} cohort n=${rows.length}` : `visible cohort n=${rows.length}`}`} rows={countBy("pattern")} details={patternConversion} />
        <Breakdown title={`Sessions by mechanic · ${viewer.actor === "partner" ? `${brand.partnerName} cohort n=${rows.length}` : `visible cohort n=${rows.length}`}`} rows={mechanicRows} details={mechanicDetails} />
      </div>

      <section className="mt-5 rounded-sm border border-black/10 bg-white p-5">
        <h2 className="font-semibold">Conversion funnel · scoped cohort n={rows.length}</h2>
        <div className="mt-5 grid gap-2 md:grid-cols-4">
          {funnel.map(([label, value], index) => (
            <div key={label} className="relative border-l-2 bg-[#f7f7f5] p-4" style={{ borderColor: brand.accent, opacity: 1 - index * 0.12 }}>
              <p className="text-xs text-black/50">{label}</p><p className="mt-1 text-2xl font-semibold">{value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-5 overflow-hidden rounded-sm border border-black/10 bg-white">
        <div className="flex items-end justify-between border-b border-black/10 p-5">
          <div><h2 className="font-semibold">Recent sessions</h2><p className="mt-1 text-xs text-black/48">{detail ? "Funding-claim detail visible" : "Aggregated partner view"}</p></div>
          <span className="text-xs text-black/40">{viewer.actor === "partner" ? "Your team's recent rows" : "Live Heartland overlay shown first"}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="bg-[#fafaf8] text-xs text-black/48"><tr>{detail && <th className="px-5 py-3 font-medium">Customer</th>}<th className="px-5 py-3 font-medium">Partner</th><th className="px-5 py-3 font-medium">Industry segment</th><th className="px-5 py-3 font-medium">Pattern</th><th className="px-5 py-3 font-medium">Delivery</th><th className="px-5 py-3 font-medium">Mechanic</th><th className="px-5 py-3 font-medium">Qualification</th><th className="px-5 py-3 font-medium">Outcome</th><th className="px-5 py-3 font-medium">Opportunity</th><th className="px-5 py-3 font-medium">Quarter</th></tr></thead>
            <tbody className="divide-y divide-black/10">
              {recent.map((row) => (
                <tr key={row.id} className={row.id === graph.session.id ? "bg-[color-mix(in_srgb,var(--accent)_5%,white)]" : undefined}>
                  {detail && <td className="px-5 py-3.5 font-medium">{row.customer ?? "Shared with claim"}</td>}
                  <td className="px-5 py-3.5">{row.partner}</td>
                  <td className="px-5 py-3.5">{row.industry}</td>
                  <td className="px-5 py-3.5">{row.pattern}</td>
                  <td className="px-5 py-3.5">{row.delivery === "self-service" ? "Self-service" : "Facilitated"}</td>
                  <td className="px-5 py-3.5">{row.mechanic === "ghost-ledger" ? "Ghost ledger" : "Value sprint"}</td>
                  <td className="px-5 py-3.5">{row.qualified ? "Qualified" : "Not qualified"}</td>
                  <td className="px-5 py-3.5"><span className="rounded-sm border border-black/10 px-2 py-1 text-xs">{row.outcome}</span></td>
                  <td className="px-5 py-3.5 font-medium">{row.opportunityValue ? formatCompactCurrency(row.opportunityValue) : "—"}</td>
                  <td className="px-5 py-3.5 text-black/48">{row.quarter}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="mt-5"><Link href="/pilot-spec" className={buttonVariants({ variant: "outline" })}><ArrowLeft /> Back to pilot spec</Link></div>
    </div>
  );
}
