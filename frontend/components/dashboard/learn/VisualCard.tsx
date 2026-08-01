"use client";

import Image from "next/image";
import type { VisualCard as VisualCardData } from "@/lib/lessons/lesson-data";

export function VisualCard({ data }: { data: VisualCardData }) {
  return (
    <div className="lg:w-[70%] md:w-[70%] w-full mx-auto p-4">
      <div className="rounded-[24px] bg-mustard-tint p-6 shadow-[0_20px_50px_rgba(31,58,110,0.10)] min-h-[320px] max-h-[70vh] overflow-y-auto no-scrollbar flex flex-col">
        <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-mustard mb-3">
          {data.title}
        </div>

        <div className="flex-1 flex items-center justify-center">
          <div className="relative w-full">
            <Image
              src={data.image}
              alt={data.alt ?? data.title}
              width={800}
              height={600}
              className="w-full h-auto rounded-2xl object-contain"
              unoptimized
            />
          </div>
        </div>

        {data.caption && (
          <div className="mt-4 text-[14px] md:text-[15px] leading-[1.55] text-indigo/80 text-center">
            {data.caption}
          </div>
        )}
      </div>
    </div>
  );
}