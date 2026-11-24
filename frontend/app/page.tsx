"use client";

import { useEffect, useState } from "react";
import { PublicGuard } from "@/components/auth/PublicGuard";
import Link from "next/link";
import Header from "@/components/shared/Header";
import Footer from "@/components/shared/Footer";
import { ArrowRight } from "lucide-react";

const PILLS = "/home/falling-pills.svg";
const A = (name: string) => `/home/${name}.png`;

export default function Home() {
  const [loginOpen, setLoginOpen] = useState(false);

  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get("ref");
    if (ref) localStorage.setItem("onward_ref", ref.toUpperCase());
  }, []);

  const open = () => setLoginOpen(true);

  return (
    <PublicGuard>
      <div className="min-h-screen overflow-x-hidden bg-[radial-gradient(60%_40%_at_50%_24%,#F8EFE0_0%,#ffffff_70%)] text-[#1B133B] font-display">
        <Header />
        <main className="mx-auto w-[90%] ">
          <section className="flex justify-between items-center lg:flex-row md:flex-row flex-col mb-10 mt-24">
            <div className="lg:w-[50%] md:w-[50%] w-full lg:order-1 md:order-1 order-2 mb-3">
              <h1 className="m-0 text-[clamp(56px,11vw,120px)] font-extrabold leading-[0.9] tracking-[-0.055em] text-[#1B133B]">
                Learn a little everyday.
              </h1>
              <p className="mt-6 font-['Newsreader',Georgia,serif] text-[20px] leading-[1.55] text-[#4A4466]">
                Short lessons and quick games on money, the internet and new
                tech. Five minutes a day, then come back tomorrow.
              </p>

              <Link href="/login"
              className="mt-6 inline-flex items-center gap-3 rounded-full bg-[#77C082] px-6 text-[18px] font-bold text-[#1B133B] transition duration-200 hover:-translate-y-0.5 hover:brightness-95 active:translate-y-0 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B133B] focus-visible:ring-offset-2 py-3"
            >
              Start learning free
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1B133B] text-[#77C082]">
                <ArrowRight size={16} strokeWidth={2.6} />
              </span>
            </Link>
            </div>

            <div className="flex justify-center lg:w-[48%] md:w-[48%] w-full lg:order-2 md:order-2 order-1 mb-3">
              <img
                src={PILLS}
                alt="Topic pills dropping into a stack"
                className="h-auto w-full"
              />
            </div>
          </section>
          <div className="mx-auto mb-10 flex max-w-[1296px] flex-col gap-6 border-t border-[#EEE9E0] pt-16 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="mb-3 text-sm font-bold uppercase tracking-[0.14em] text-[#6E6788]">
                How it works
              </p>
              <h2 className="text-4xl font-extrabold leading-none tracking-[-0.045em] text-[#1B133B] md:text-6xl">
                Three moves.
                <br />
                <span className="text-[#5B45B8]">Five minutes.</span>
              </h2>
            </div>

            <ol className="flex w-full items-center text-xs font-bold text-[#1B133B] md:w-auto md:gap-3 md:text-sm">
              {[
                { n: "01", label: "Learn", dot: "bg-[#1B133B]" },
                { n: "02", label: "Play", dot: "bg-[#E8B547]" },
                { n: "03", label: "Grow", dot: "bg-[#77C082]" },
              ].map((s, i) => (
                <li
                  key={s.n}
                  className={`flex items-center ${i > 0 ? "min-w-0 flex-1 md:flex-none" : "shrink-0"}`}
                >
                  {i > 0 && (
                    <span className="mx-2 min-w-3 flex-1 border-t-2 border-dashed border-[#DDD6F0] md:mx-3 md:w-10 md:flex-none" />
                  )}
                  <span className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-[#EEE9E0] py-1.5 pl-2 pr-3 md:gap-2 md:py-2 md:pr-4">
                    <span
                      className={`h-2 w-2 rounded-full md:h-2.5 md:w-2.5 ${s.dot}`}
                    />
                    <span className="text-[#6E6788]">{s.n}</span>
                    {s.label}
                  </span>
                </li>
              ))}
            </ol>
          </div>
          <section className="flex justify-between items-center lg:flex-row md:flex-row flex-col">
            <Card
              chip="Learn"
              title="Bite-size lessons"
              body="One small idea at a time, about five minutes each."
              card="bg-[#1B133B] text-white"
              subCls="text-[#CBC4F7]"
              chipCls="border-[#4A3B95]"
              art={A("3d-books-cap")}
            />
            <Card
              chip="Play"
              title="Learn by playing"
              body="Quick games that make new ideas stick."
              card="bg-[#FAF5E9] text-[#1B133B]"
              subCls="text-[#4A4466]"
              chipCls="border-[#D9CFBE]"
              art={A("3d-puzzle")}
              artTop
            />
            <Card
              chip="Grow"
              title="Keep your streak"
              body="A badge for every step you take forward."
              card="bg-[#77C082] text-[#1B133B]"
              subCls="text-[#24402B]"
              chipCls="border-[rgba(27,19,59,0.35)]"
              art={A("3d-trophy")}
            />
          </section>
        </main>
        <Footer />
      </div>
    </PublicGuard>
  );
}

function Card({
  chip,
  title,
  body,
  card,
  subCls,
  chipCls,
  art,
  artTop = false,
}: {
  chip: string;
  title: string;
  body: string;
  card: string;
  subCls: string;
  chipCls: string;
  art: string;
  artTop?: boolean;
}) {
  return (
    <div
      style={{ backgroundImage: `url(${art})` }}
      className={`flex w-full min-h-70 flex-col gap-2.25 overflow-hidden rounded-[28px] mb-4 bg-no-repeat p-6 transition hover:-translate-y-1.5 hover:rotate-[0.6deg] md:w-[32%] lg:w-[32%] ${
        artTop
          ? "bg-size-[clamp(130px,46%,180px)_auto] bg-position-[right_20px_top_64px]"
          : "bg-size-[40%_auto] bg-position-[right_16px_bottom_16px]"
      } ${card}`}
    >
      <span
        className={`self-start rounded-full border-[1.5px] px-3 py-[5px] text-[13px] font-bold ${chipCls}`}
      >
        {chip}
      </span>

      <div className={`flex flex-col gap-[9px] ${artTop ? "mt-auto" : ""}`}>
        <b className="text-[26px] font-bold leading-tight tracking-[-0.03em]">
          {title}
        </b>
        <span className={`max-w-[60%] leading-snug ${subCls}`}>
          {body}
        </span>
      </div>
    </div>
  );
}
