import Image from "next/image";
import { Lightbulb } from "lucide-react";
import type { ConceptCard as ConceptCardData } from "@/lib/lessons/lesson-data";
import { resolveCardIcon } from "@/lib/learn/card-icons";

export function ConceptCard({ data }: { data: ConceptCardData }) {
  const keys = Array.isArray(data.icon)
    ? data.icon
    : data.icon
      ? [data.icon]
      : [];
  return (
    <div className="mx-auto w-full max-w-160">
      <span className="inline-block rounded-full bg-mustard-tint px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-indigo">
        New idea
      </span>
      <div className="mt-4 flex flex-col gap-4 rounded-[26px] border-2 border-shadow bg-white p-6 text-indigo shadow-[0_4px_0_#E8D9BA] md:p-8">
        <div className="flex flex-wrap items-center gap-2">
          {keys.length === 0 ? (
            <IconTile iconKey={undefined} />
          ) : (
            keys.map((key) => <IconTile key={key} iconKey={key} />)
          )}
        </div>
        <h2 className="display text-[26px] font-bold leading-[1.1] tracking-[-0.02em] md:text-[30px]">
          {data.title}
        </h2>
        {data.image && (
          <Image
            src={data.image}
            alt={data.alt ?? ""}
            width={800}
            height={500}
            unoptimized
            className="h-auto w-full rounded-2xl bg-canvas object-contain"
          />
        )}
        {data.body && (
          <p className="whitespace-pre-line text-[15px] leading-[1.6] text-indigo/85">
            {data.body}
          </p>
        )}
      </div>
    </div>
  );
}

function IconTile({ iconKey }: { iconKey: string | undefined }) {
  const icon = resolveCardIcon(iconKey);
  if (icon?.kind === "brand") {
    return (
      <span className="flex h-13 w-13 items-center justify-center overflow-hidden rounded-2xl border-2 border-shadow bg-white p-1.5">
        <Image
          src={icon.url}
          alt=""
          width={40}
          height={40}
          unoptimized
          className="h-full w-full object-contain"
        />
      </span>
    );
  }
  return (
    <span className="flex h-13 w-13 items-center justify-center rounded-2xl bg-mustard text-indigo">
      {icon?.kind === "concept" ? (
        <icon.Icon size={26} strokeWidth={2.2} />
      ) : (
        <Lightbulb size={26} strokeWidth={2.2} />
      )}
    </span>
  );
}
