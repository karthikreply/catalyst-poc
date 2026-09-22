"use client";

import { useRouter } from "next/navigation";

import { UnavailableControl } from "@/components/unavailable-control";
import { useSession } from "@/components/session-provider";

export default function Home() {
  const router = useRouter();
  const { setActor } = useSession();

  return (
    <div className="mx-auto max-w-3xl px-5 py-16 lg:px-8">
      <p className="text-sm text-black/48">Value-discovery session</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">Who is walking through this?</h1>
      <p className="mt-3 max-w-xl text-sm leading-6 text-black/58">Same Heartland session either way. The lens changes what you can do, not the evidence.</p>
      <div className="mt-8 grid gap-3">
        <button
          type="button"
          onClick={() => {
            setActor("pdm");
            router.push("/scope");
          }}
          className="rounded-sm border border-black/10 bg-white p-5 text-left hover:border-[var(--accent)]"
        >
          <p className="font-semibold">I&apos;m a partner development manager</p>
          <p className="mt-1 text-sm text-black/55">Convene a value session for one of my partners</p>
        </button>
        <button
          type="button"
          onClick={() => {
            setActor("partner");
            router.push("/scope");
          }}
          className="rounded-sm border border-black/10 bg-white p-5 text-left hover:border-[var(--accent)]"
        >
          <p className="font-semibold">I&apos;m a partner</p>
          <p className="mt-1 text-sm text-black/55">Build a business case about my customer</p>
        </button>
        <div className="rounded-sm border border-black/10 bg-[#fafaf8] p-5">
          <p className="font-semibold">From a campaign link</p>
          <p className="mt-1 text-sm text-black/55">Unauthenticated scale motion — out of scope for this demo.</p>
          <div className="mt-3">
            <UnavailableControl
              label="Open campaign entry"
              owner="Platform vendor"
              explanation="A production campaign link would land an unauthenticated prospect in a shorter self-service flow."
            />
          </div>
        </div>
      </div>
    </div>
  );
}
