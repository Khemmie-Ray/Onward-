import { Check, Loader2, X } from "lucide-react";

type AvailabilityState =
  | { status: "idle" }
  | { status: "checking" }
  | { status: "available"; current?: boolean }
  | { status: "unavailable"; reason: string };

export function AvailabilityIcon({ state }: { state: AvailabilityState }) {
  if (state.status === "idle") return null;
  if (state.status === "checking")
    return <Loader2 size={18} className="animate-spin text-fg-soft" />;
  if (state.status === "available")
    return <Check size={18} className="text-emerald-600" strokeWidth={3} />;
  return <X size={18} className="text-terracotta" strokeWidth={3} />;
}

export function AvailabilityMessage({ state }: { state: AvailabilityState }) {
  if (state.status === "available") {
    return (
      <p className="text-xs text-emerald-700 mt-1.5 font-medium">
        {state.current ? "That's your current name" : "Available"}
      </p>
    );
  }
  if (state.status === "unavailable") {
    return <p className="text-xs text-terracotta mt-1.5 font-medium">{state.reason}</p>;
  }
  return null;
}