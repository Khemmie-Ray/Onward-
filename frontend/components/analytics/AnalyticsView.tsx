import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { DailyBars } from "@/components/analytics/DailyBars";
import { DayTable } from "@/components/analytics/DayTable";
import {
  loadAnalytics,
  SEASON_LABEL,
  type AnalyticsView as View,
} from "@/lib/data/analytic";
import { PROJECT_CONTRACTS } from "@/lib/server/chain-sync";

const MAX_DAILY_BARS = 60;

type Point = { date: string; value: number };

function weekStart(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  const offset = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - offset);
  return d.toISOString().slice(0, 10);
}

function bucket(
  points: Point[],
  mode: "sum" | "max",
): { points: Point[]; unit: "day" | "week" } {
  const ordered = [...points].sort((a, b) => a.date.localeCompare(b.date));
  if (ordered.length <= MAX_DAILY_BARS) return { points: ordered, unit: "day" };
  const weeks = new Map<string, number>();
  for (const p of ordered) {
    const key = weekStart(p.date);
    const prev = weeks.get(key);
    weeks.set(
      key,
      prev === undefined
        ? p.value
        : mode === "sum"
          ? prev + p.value
          : Math.max(prev, p.value),
    );
  }
  return {
    points: [...weeks].map(([date, value]) => ({ date, value })),
    unit: "week",
  };
}

const whole = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const compact = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});
const gd = (n: number) => `${compact.format(n)} G$`;

const CONTRACT_NAMES: Record<string, string> = {
  [PROJECT_CONTRACTS[0]]: "OnwardBadges",
  [PROJECT_CONTRACTS[1]]: "OnwardClaims",
  [PROJECT_CONTRACTS[2]]: "WhackStake",
};

const longDate = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });

const TABS: { view: View; label: string; href: string }[] = [
  { view: "season", label: "Season 5", href: "/analytics" },
  { view: "all", label: "All time", href: "/analytics/all-time" },
];

export async function AnalyticsView({ view }: { view: View }) {
  const data = await loadAnalytics(view);
  const period = view === "season" ? "this season" : "since launch";

  const txChart = bucket(
    data.daily.map((d) => ({ date: d.date, value: d.txs })),
    "sum",
  );
  const volumeChart = bucket(
    data.daily.map((d) => ({ date: d.date, value: d.gdVolume })),
    "sum",
  );
  const wlChart = bucket(
    data.whitelistedDaily.map((d) => ({ date: d.date, value: d.count })),
    "max",
  );
  const obChart = bucket(
    data.onboardedDaily.map((d) => ({ date: d.date, value: d.count })),
    "sum",
  );

  const wlByDate = new Map(data.whitelistedDaily.map((d) => [d.date, d.count]));
  const obByDate = new Map(data.onboardedDaily.map((d) => [d.date, d.count]));
  const tableDays = data.daily;

  const tiles = [
    {
      label: "Onboarded users",
      value: whole.format(data.totals.onboardedUsers),
      note: "Verified with GoodID, then used Onward within 24 hours",
      accent: "bg-mint",
    },
    {
      label: "Verified active users",
      value: whole.format(data.totals.whitelistedUsers),
      note: "GoodID-verified wallets that used Onward's contracts",
      accent: "bg-mustard",
    },
    {
      label: "Transactions",
      value: whole.format(data.totals.txs),
      note: `Sent to Onward's contracts ${period}`,
      accent: "bg-indigo",
    },
    {
      label: "G$ volume",
      value: gd(data.totals.gdVolume),
      note: `${whole.format(data.totals.gdTransfers)} G$ transfers in and out`,
      accent: "bg-forest",
    },
    {
      label: "G$ net flow",
      value: gd(data.totals.gdNetFlow),
      note: "G$ into the contracts minus G$ paid out",
      accent: "bg-terracotta",
    },
  ];

  return (
    <div className="min-h-screen bg-canvas text-indigo">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5 md:px-8">
        <Link href="/" aria-label="Onward home">
          <Image
            src="/images/b-logo.png"
            width={130}
            height={130}
            alt="Onward"
            priority
          />
        </Link>
        <Link
          href="/"
          className="inline-flex items-center gap-1 rounded-full border-2 border-indigo/15 bg-paper px-4 py-2 text-[12.5px] font-bold text-indigo transition hover:border-indigo/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo"
        >
          Open Onward
          <ArrowUpRight size={14} strokeWidth={2.6} />
        </Link>
      </header>

      <main className="mx-auto w-full max-w-6xl px-5 pb-16 md:px-8">
        <section className="relative overflow-hidden rounded-4xl bg-indigo px-6 py-10 text-paper md:px-12 md:py-14">
          <div
            aria-hidden
            className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-mint/20"
          />
          <div
            aria-hidden
            className="absolute -bottom-20 right-24 h-40 w-40 rounded-full bg-mustard/20"
          />
          <p className="relative text-[11px] font-bold uppercase tracking-[0.18em] text-mint">
            {view === "season" ? SEASON_LABEL : "All time"} · on Celo
          </p>
          <h1 className="relative mt-3 max-w-xl font-display text-[34px] font-bold leading-[1.05] md:text-[52px]">
            Onward, on-chain.
          </h1>
          <p className="relative mt-4 max-w-xl text-[14px] leading-relaxed text-paper/75 md:text-[15px]">
            Live numbers from Onward&apos;s three contracts, counted the way
            GoodBuilders counts them. Since {longDate(data.start)}.
          </p>
          {data.lastSyncedAt && (
            <p className="relative mt-6 text-[11.5px] text-paper/55">
              Last synced{" "}
              {new Date(data.lastSyncedAt).toLocaleString("en-GB", {
                dateStyle: "medium",
                timeStyle: "short",
                timeZone: "UTC",
              })}{" "}
              UTC
            </p>
          )}
        </section>

        <nav
          aria-label="Time range"
          className="mt-6 inline-flex rounded-full border-2 border-indigo/10 bg-white p-1"
        >
          {TABS.map((tab) => {
            const active = tab.view === view;
            return (
              <Link
                key={tab.view}
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={`rounded-full px-4 py-2 text-[12.5px] font-bold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo ${
                  active
                    ? "bg-indigo text-paper"
                    : "text-fg-soft hover:text-indigo"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>

        <section className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
          {tiles.map((t, i) => (
            <div
              key={t.label}
              className={`flex flex-col rounded-3xl border-2 border-indigo/10 bg-white p-5 ${
                i === 0 ? "col-span-2 md:col-span-1" : ""
              }`}
            >
              <span
                aria-hidden
                className={`h-1.5 w-8 rounded-full ${t.accent}`}
              />
              <p className="mt-4 text-[12px] font-semibold text-fg-soft">
                {t.label}
              </p>
              <p className="mt-1 font-display text-[28px] font-bold leading-none tabular-nums">
                {t.value}
              </p>
              <p className="mt-3 text-[11.5px] leading-snug text-fg-dim">
                {t.note}
              </p>
            </div>
          ))}
        </section>

        <section className="mt-6 grid gap-3 lg:grid-cols-2">
          <DailyBars
            title="Transactions"
            caption={txChart.unit === "week" ? "Per week" : "Per day"}
            points={txChart.points}
            unit={txChart.unit}
            format={(n) => whole.format(n)}
            tone="indigo"
          />
          <DailyBars
            title="G$ volume"
            caption={`G$ moved in and out, per ${volumeChart.unit}`}
            points={volumeChart.points}
            unit={volumeChart.unit}
            format={gd}
            tone="forest"
          />
          <DailyBars
            title="Verified active users"
            caption={
              wlChart.unit === "week" ? "Busiest day of each week" : "Per day"
            }
            points={wlChart.points}
            unit={wlChart.unit}
            format={(n) => whole.format(n)}
            tone="mustard"
            summary="max"
          />
          <DailyBars
            title="Onboarded users"
            caption={`By the ${obChart.unit} they verified`}
            points={obChart.points}
            unit={obChart.unit}
            format={(n) => whole.format(n)}
            tone="forest"
          />
        </section>

        <section className="mt-6 rounded-3xl border-2 border-indigo/10 bg-white p-5 md:p-6">
          <h2 className="font-display text-[17px] font-bold">Day by day</h2>
          <p className="mt-1 text-[12.5px] text-fg-soft">
            Every day with activity since {longDate(data.start)}, newest first.
            Dates are UTC.
          </p>
          <DayTable
            rows={tableDays.map((d) => ({
              date: d.date,
              txs: d.txs,
              gdTransfers: d.gdTransfers,
              gdVolume: d.gdVolume,
              gdNetFlow: d.gdNetFlow,
              verified: wlByDate.get(d.date) ?? 0,
              onboarded: obByDate.get(d.date) ?? 0,
            }))}
          />
        </section>

        <section className="mt-6 grid gap-3 md:grid-cols-[1.4fr_1fr]">
          <div className="rounded-3xl bg-paper p-5 md:p-6">
            <h2 className="font-display text-[17px] font-bold">
              How these are counted
            </h2>
            <dl className="mt-4 flex flex-col gap-3 text-[12.5px] leading-relaxed">
              <div>
                <dt className="font-bold">Transactions</dt>
                <dd className="text-fg-soft">
                  Every transaction sent to Onward&apos;s contracts, including
                  failed ones.
                </dd>
              </div>
              <div>
                <dt className="font-bold">G$ volume and net flow</dt>
                <dd className="text-fg-soft">
                  All G$ transfers into and out of the contracts. Net flow is G$
                  in minus G$ out.
                </dd>
              </div>
              <div>
                <dt className="font-bold">Verified active users</dt>
                <dd className="text-fg-soft">
                  Personal wallets that used the contracts and were GoodID
                  verified before they did. Contract wallets are left out.
                </dd>
              </div>
              <div>
                <dt className="font-bold">Onboarded users</dt>
                <dd className="text-fg-soft">
                  Wallets verified with GoodID {period} that used Onward&apos;s
                  contracts within 24 hours of verifying.
                </dd>
              </div>
            </dl>
          </div>
          <div className="rounded-3xl bg-paper p-5 md:p-6">
            <h2 className="font-display text-[17px] font-bold">Contracts</h2>
            <ul className="mt-4 flex flex-col gap-3">
              {PROJECT_CONTRACTS.map((address) => (
                <li key={address}>
                  <a
                    href={`https://celoscan.io/address/${address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3 transition hover:bg-canvas-warm"
                  >
                    <span>
                      <span className="block text-[13px] font-bold">
                        {CONTRACT_NAMES[address]}
                      </span>
                      <span className="block font-mono text-[11px] text-fg-dim">
                        {address.slice(0, 10)}…{address.slice(-6)}
                      </span>
                    </span>
                    <ArrowUpRight
                      size={15}
                      className="shrink-0 text-fg-soft transition group-hover:text-indigo"
                    />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <p className="mt-10 text-center text-[11.5px] text-fg-dim">
          © {new Date().getFullYear()} Onward · Data from the Celo blockchain
        </p>
      </main>
    </div>
  );
}
