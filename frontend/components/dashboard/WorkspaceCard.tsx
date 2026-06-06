import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { TINT_MAP, type Tint } from "@/lib/themes/tones";
import { MudclothPattern } from "@/components/home/motifs";

interface WorkspaceCardProps {
  href: string;
  icon: React.ComponentType<
    React.SVGProps<SVGSVGElement> & { size?: number; strokeWidth?: number }
  >;
  title: string;
  copy: string;
  count: string;
  tint: Tint;
}

const WorkspaceCard = ({
  href,
  icon: Icon,
  title,
  copy,
  count,
  tint: tintName,
}: WorkspaceCardProps) => {
  const t = TINT_MAP[tintName];
  return (
    <Link
      href={href}
      className={`group relative block overflow-hidden rounded-[20px] p-5 transition-transform hover:-translate-y-1 ${t.bg} shadow-[0_6px_20px_rgba(31,58,110,0.08)]`}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 text-indigo opacity-[0.04]"
      >
        <MudclothPattern />
      </div>
      <div className="relative">
        <div
          className={`mb-4 flex h-12 w-12 items-center justify-center rounded-[14px] ${t.iconBg}`}
        >
          <Icon size={22} strokeWidth={2.2} className={t.iconColor} />
        </div>
        <h3 className={`display text-[18px] font-semibold mb-2 ${t.textColor}`}>
          {title}
        </h3>
        <p className="text-[12.5px] leading-[1.55] text-fg-soft mb-3">{copy}</p>
        <div className="flex items-center justify-between">
          <span className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-indigo/65">
            {count}
          </span>
          <ArrowRight
            size={14}
            strokeWidth={2.5}
            className="text-indigo transition-transform group-hover:translate-x-1"
          />
        </div>
      </div>
    </Link>
  );
}

export default WorkspaceCard;