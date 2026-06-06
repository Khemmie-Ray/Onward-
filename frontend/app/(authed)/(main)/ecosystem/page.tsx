import { Globe } from "lucide-react";
import { APPS } from "@/lib/ecosystem/app-data";
import { FeaturedAppCard } from "@/components/dashboard/ecosystem/FeaturedAppCard";
import { EcosystemPageClient } from "@/components/dashboard/ecosystem/EcosystemPageClient";

export default function EcosystemPage() {
  const featured = APPS.filter((a) => a.isFeatured && a.status === "available");
  const explored = 3;
  const total = APPS.filter((a) => a.status === "available").length;

  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute right-[-10%] top-[8%] h-[500px] w-[500px] rounded-full opacity-50 blur-[80px] bg-[radial-gradient(circle,rgba(58,107,71,0.35)_0%,transparent_70%)]"
      />
      <section className="mb-8 animate-[fade-up_0.8s_0.05s_ease_both]">
        <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-forest mb-2">
          <Globe size={13} strokeWidth={2.5} />
          Ecosystem
        </div>
        <h1 className="display text-[40px] md:text-[48px] font-semibold leading-[1.1] tracking-[-0.025em] text-indigo">
          Real apps. <span className="text-forest">Real practice.</span>
        </h1>
        <p className="mt-2 text-[15px] text-fg-soft max-w-[600px]">
          Learn to use the apps built on GoodDollar by actually using them. Earn
          g$ for completing each tutorial. You've explored {explored} of {total}
          .
        </p>
      </section>
      {featured.length > 0 && (
        <section className="mb-10 animate-[fade-up_0.8s_0.18s_ease_both]">
          <div className="flex items-baseline gap-3 mb-4">
            <h2 className="display text-[20px] font-semibold tracking-[-0.015em] text-indigo">
              Featured
            </h2>
            <span className="text-[11px] font-medium uppercase tracking-[0.1em] text-fg-soft">
              Start here
            </span>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {featured.map((app) => (
              <FeaturedAppCard key={app.slug} app={app} />
            ))}
          </div>
        </section>
      )}
      <EcosystemPageClient apps={APPS} />
    </>
  );
}
