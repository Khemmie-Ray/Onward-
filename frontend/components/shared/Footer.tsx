"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

const SOCIALS = {
  telegram: "https://t.me/+bvmEsa1suBcyZDU0",
  twitter: "https://x.com/onwardlearn",
};

const Footer = () => {
  const year = new Date().getFullYear();
  const [loginOpen, setLoginOpen] = useState(false);

  return (
    <footer className="mx-auto mt-16 w-[90%] pb-10">
      <div className="rounded-[32px] border border-fg-soft/10 bg-white px-6 py-10 shadow-[0_18px_50px_-12px_rgba(27,19,59,0.18)] md:px-12">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <div className="max-w-md">
            <h2 className="text-[clamp(26px,4vw,34px)] font-extrabold leading-tight tracking-[-0.03em] text-[#1B133B]">
              Ready to learn something{" "}
              <span className="text-[#77C082]">new</span> today?
            </h2>
            <Link
              href="/login"
              className="mt-6 inline-flex h-12 items-center gap-3 rounded-full bg-[#77C082] pl-6 pr-2 text-[15px] font-bold text-[#1B133B] transition duration-200 hover:-translate-y-0.5 hover:brightness-95 active:translate-y-0 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B133B] focus-visible:ring-offset-2"
            >
              Start learning free
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1B133B] text-[#77C082]">
                <ArrowRight size={16} strokeWidth={2.6} />
              </span>
            </Link>
          </div>
          <div className="flex gap-12">
            <div className="flex flex-col gap-2.5">
              <span className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#8178A0]">
                Legal
              </span>
              <a
                href="https://docs.google.com/document/d/1S_LS4wHJyAWtjU2i1mFEEjgUcXhqcqa4fBFhkoFGzwU/edit?usp=sharing"
                target="blank"
                className="text-[14px] font-medium text-[#4A4466] transition-colors hover:text-[#1B133B]"
              >
                Privacy
              </a>
              <a
                href="https://docs.google.com/document/d/1uvV_MLm_JrkVrXMbLuY-P-0QArgd6BcYlxZX1MJuPjE/edit?usp=sharing"
                target="blank"
                className="text-[14px] font-medium text-[#4A4466] transition-colors hover:text-[#1B133B]"
              >
                Terms
              </a>
            </div>

            <div className="flex items-start gap-2">
              <a
                href={SOCIALS.twitter}
                target="_blank"
                rel="noreferrer"
                aria-label="Onward on X"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-fg-soft/15 text-[#4A4466] transition-colors hover:border-transparent hover:bg-[#1B133B] hover:text-white"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M18.9 1.15h3.68l-8.04 9.19L24 22.85h-7.4l-5.8-7.58-6.64 7.58H.48l8.6-9.83L0 1.15h7.59l5.24 6.93zm-1.29 19.5h2.04L6.48 3.24H4.29z" />
                </svg>
              </a>
              <a
                href={SOCIALS.telegram}
                target="_blank"
                rel="noreferrer"
                aria-label="Onward on Telegram"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-fg-soft/15 text-[#4A4466] transition-colors hover:border-transparent hover:bg-[#1B133B] hover:text-white"
              >
                <svg
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M21.94 4.6l-3.32 15.66c-.25 1.1-.9 1.38-1.83.86l-5.05-3.72-2.44 2.35c-.27.27-.5.5-1.02.5l.36-5.15L18 6.36c.4-.36-.09-.56-.62-.2L6.9 13.13l-4.9-1.53c-1.06-.33-1.08-1.06.22-1.57l19.15-7.38c.89-.33 1.66.2 1.37 1.55z" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-fg-soft/10 pt-6 text-center text-[13px] text-[#6B6584]">
          © {year} Onward. Learn a little, every day.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
