"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Check, ChevronDown } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { type BrandId } from "@/lib/brands";
import { type Actor } from "@/lib/seed";
import { cn } from "@/lib/utils";
import { useSession } from "./session-provider";

const steps = [
  { href: "/scope", label: "Scope" },
  { href: "/plan", label: "Plan" },
  { href: "/run", label: "Run" },
  { href: "/artifact", label: "Artifact" },
  { href: "/pilot-spec", label: "Pilot spec" },
  { href: "/telemetry", label: "Telemetry" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const activeIndex = Math.max(0, steps.findIndex((step) => pathname.startsWith(step.href)));
  const { brand, brandId, setBrandId, viewer, setActor } = useSession();

  return (
    <div className="min-h-screen bg-[#f7f7f5] text-[#171716]" style={{ "--accent": brand.accent, "--accent-dark": brand.accentDark } as React.CSSProperties}>
      <header className="sticky top-0 z-30 border-b border-black/10 bg-white">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-5 px-5 lg:px-8">
          <Link href="/run" className="flex min-w-fit items-center gap-3 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)]">
            <span className="font-black tracking-[-0.08em]" style={{ color: brand.accent }}>{brand.mark}</span>
            <span className="h-5 w-px bg-black/15" />
            <span className="text-sm font-semibold">{brand.productName}</span>
          </Link>

          <nav aria-label="Demo steps" className="ml-auto hidden items-center md:flex">
            {steps.map((step, index) => {
              const active = index === activeIndex;
              const complete = index < activeIndex;
              return (
                <div key={step.href} className="flex items-center">
                  {index > 0 && <span className="mx-1 h-px w-4 bg-black/15 lg:w-7" />}
                  <Link
                    href={step.href}
                    aria-current={active ? "step" : undefined}
                    className={cn(
                      "flex items-center gap-1.5 rounded-sm px-2 py-2 text-xs font-medium text-black/48 transition-colors focus-visible:outline-2 focus-visible:outline-[var(--accent)]",
                      active && "text-black",
                      complete && "text-black/70",
                    )}
                  >
                    <span
                      className={cn("grid size-5 place-items-center rounded-full border border-black/20 text-[10px]", (active || complete) && "border-transparent text-white")}
                      style={active || complete ? { background: brand.accent } : undefined}
                    >
                      {complete ? <Check className="size-3" /> : index + 1}
                    </span>
                    {step.label}
                  </Link>
                </div>
              );
            })}
          </nav>

          <div className="relative hidden min-w-[200px] lg:block">
            <label className="sr-only" htmlFor="viewer-switch">Viewing as</label>
            <select
              id="viewer-switch"
              value={viewer.actor}
              onChange={(event) => setActor(event.target.value as Actor)}
              className="h-9 w-full appearance-none rounded-sm border border-black/15 bg-white pl-3 pr-8 text-xs font-medium outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--accent)_20%,transparent)]"
            >
              <option value="pdm">Priya Raghavan · partner development manager</option>
              <option value="partner">Ravi Menon · partner</option>
              <option value="cpm">Marcus Hale · channel program manager</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-2.5 size-4 text-black/45" />
          </div>

          <div className="relative ml-auto md:ml-3">
            <label className="sr-only" htmlFor="brand-switch">Demo brand</label>
            <select
              id="brand-switch"
              value={brandId}
              onChange={(event) => setBrandId(event.target.value as BrandId)}
              className="h-9 appearance-none rounded-sm border border-black/15 bg-white pl-3 pr-8 text-xs font-medium outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--accent)_20%,transparent)]"
            >
              <option value="cdw">CDW</option>
              <option value="softwareone">SoftwareOne</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-2.5 size-4 text-black/45" />
          </div>
        </div>
      </header>
      <main>{children}</main>
      <div className="fixed bottom-3 left-1/2 z-40 -translate-x-1/2 md:hidden">
        <Link href={steps[(activeIndex + 1) % steps.length].href} className={buttonVariants({ size: "sm", className: "bg-[var(--accent)] hover:bg-[var(--accent-dark)]" })}>Next: {steps[(activeIndex + 1) % steps.length].label}</Link>
      </div>
    </div>
  );
}
