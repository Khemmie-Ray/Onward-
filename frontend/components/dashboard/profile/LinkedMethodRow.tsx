import React from "react";
import { Check } from "lucide-react";

interface LinkedMethodRowProps {
  icon: React.ReactNode;
  label: string;
  sublabel: string;
}

const LinkedMethodRow = ({ icon, label, sublabel }: LinkedMethodRowProps) => {
  return (
    <div className="flex items-center gap-3 rounded-[10px] bg-canvas-warm p-3">
      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-paper text-indigo">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[12px] font-semibold text-indigo truncate">{label}</div>
        <div className="text-[10px] text-fg-soft">{sublabel}</div>
      </div>
      <Check size={12} strokeWidth={2.5} className="text-forest" />
    </div>
  );
}

export default LinkedMethodRow;