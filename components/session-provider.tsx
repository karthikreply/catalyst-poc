"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

import { brands, type Brand, type BrandId } from "@/lib/brands";
import { freezeLedger } from "@/lib/cost-model";
import { initialSessionGraph, type Actor, type Capture, type Delivery, type Mechanic, type SessionGraph } from "@/lib/seed";
import { applyDeliveryMode, applyMechanic, bindAnnualValue, isSessionReadOnly, viewerForActor, type Viewer } from "@/lib/session";

type SessionContextValue = {
  graph: SessionGraph;
  brandId: BrandId;
  brand: Brand;
  viewer: Viewer;
  setBrandId: (id: BrandId) => void;
  setActor: (actor: Actor) => void;
  setDelivery: (delivery: Delivery) => void;
  setMechanic: (mechanic: Mechanic) => void;
  updateValue: (id: string, quantity: number) => void;
  updateCostInput: (componentId: string, inputLabel: string, quantity: number) => void;
  freezeLedgerNow: () => void;
  addCapture: (capture: Omit<Capture, "id" | "sessionId" | "capturedAt">) => void;
  setActiveStep: (stepId: string) => void;
  canEditSession: boolean;
};

const SessionContext = createContext<SessionContextValue | null>(null);
const GRAPH_KEY = "catalyst-session-graph";
const BRAND_KEY = "catalyst-brand";
const ACTOR_KEY = "catalyst-viewer-actor";

function hydrateGraph(value: SessionGraph | null): SessionGraph {
  if (!value?.session) return initialSessionGraph;
  return {
    ...initialSessionGraph,
    ...value,
    session: { ...initialSessionGraph.session, ...value.session },
    valueInputs: value.valueInputs?.length ? value.valueInputs : initialSessionGraph.valueInputs,
    costComponents: value.costComponents?.length ? value.costComponents : initialSessionGraph.costComponents,
    agenda: value.agenda?.length ? value.agenda : initialSessionGraph.agenda,
    captures: value.captures?.length ? value.captures : initialSessionGraph.captures,
    outcome: { ...initialSessionGraph.outcome, ...value.outcome },
  };
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [graph, setGraph] = useState<SessionGraph>(initialSessionGraph);
  const [brandId, setBrandIdState] = useState<BrandId>("cdw");
  const [actor, setActorState] = useState<Actor>("partner");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (hydrated) return;
    const savedGraph = localStorage.getItem(GRAPH_KEY);
    const savedBrand = localStorage.getItem(BRAND_KEY) as BrandId | null;
    const savedActor = sessionStorage.getItem(ACTOR_KEY) as Actor | null;
    const frame = requestAnimationFrame(() => {
      if (savedGraph) {
        try {
          setGraph(hydrateGraph(JSON.parse(savedGraph) as SessionGraph));
        } catch {
          localStorage.removeItem(GRAPH_KEY);
        }
      }
      if (savedBrand && brands[savedBrand]) setBrandIdState(savedBrand);
      if (savedActor === "pdm" || savedActor === "partner" || savedActor === "cpm") {
        setActorState(savedActor);
      }
      setHydrated(true);
    });
    return () => cancelAnimationFrame(frame);
  }, [hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(GRAPH_KEY, JSON.stringify(graph));
  }, [graph, hydrated]);

  const brand = brands[brandId];
  const viewer = viewerForActor(actor, brand);
  const canEditSession = !isSessionReadOnly(actor);

  function setBrandId(id: BrandId) {
    setBrandIdState(id);
    localStorage.setItem(BRAND_KEY, id);
    setGraph((current) => ({ ...current, session: { ...current.session, partnerId: id } }));
  }

  function setActor(next: Actor) {
    setActorState(next);
    sessionStorage.setItem(ACTOR_KEY, next);
  }

  function setDelivery(delivery: Delivery) {
    if (!canEditSession) return;
    setGraph((current) => applyDeliveryMode(current, delivery));
  }

  function setMechanic(mechanic: Mechanic) {
    if (!canEditSession) return;
    setGraph((current) => applyMechanic(current, mechanic));
  }

  function updateValue(id: string, quantity: number) {
    if (!canEditSession || !Number.isFinite(quantity) || quantity < 0) return;
    setGraph((current) => {
      const valueInputs = current.valueInputs.map((input) => (input.id === id ? { ...input, quantity } : input));
      const next = { ...current, valueInputs };
      if (current.session.mechanic !== "value-sprint") return next;
      return bindAnnualValue(next);
    });
  }

  function updateCostInput(componentId: string, inputLabel: string, quantity: number) {
    if (!canEditSession || !Number.isFinite(quantity) || quantity < 0) return;
    setGraph((current) => ({
      ...current,
      costComponents: current.costComponents.map((component) =>
        component.id === componentId
          ? {
              ...component,
              inputs: component.inputs.map((input) => (input.label === inputLabel ? { ...input, quantity } : input)),
            }
          : component,
      ),
    }));
  }

  function freezeLedgerNow() {
    if (!canEditSession) return;
    setGraph((current) => freezeLedger(current));
  }

  function addCapture(capture: Omit<Capture, "id" | "sessionId" | "capturedAt">) {
    if (!canEditSession) return;
    setGraph((current) => ({
      ...current,
      captures: [
        ...current.captures,
        {
          ...capture,
          id: `capture-${Date.now()}`,
          sessionId: current.session.id,
          capturedAt: new Date().toISOString(),
        },
      ],
    }));
  }

  function setActiveStep(stepId: string) {
    if (!canEditSession) return;
    setGraph((current) => ({
      ...current,
      agenda: current.agenda.map((step) => ({
        ...step,
        state: step.id === stepId ? "active" : step.order < (current.agenda.find((item) => item.id === stepId)?.order ?? 1) ? "done" : "upcoming",
      })),
    }));
  }

  const value = useMemo(
    () => ({
      graph,
      brandId,
      brand,
      viewer,
      setBrandId,
      setActor,
      setDelivery,
      setMechanic,
      updateValue,
      updateCostInput,
      freezeLedgerNow,
      addCapture,
      setActiveStep,
      canEditSession,
    }),
    [graph, brandId, brand, viewer, canEditSession],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) throw new Error("useSession must be used inside SessionProvider");
  return context;
}