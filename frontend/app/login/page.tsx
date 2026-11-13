import Image from "next/image";
import Link from "next/link";
import { LoginButtons } from "@/components/auth/LoginButtons";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-white lg:grid lg:grid-cols-2">
      <div className="flex min-h-screen flex-col px-6 pb-8 pt-24 sm:px-10 lg:min-h-0 lg:px-16 lg:py-8">
        <Link
          href="/"
          aria-label="Onward home"
          className="fixed inset-x-0 top-0 z-20 flex items-center border-b border-fg-soft/10 bg-white/95 px-6 py-4 backdrop-blur-sm sm:px-10 lg:static lg:z-auto lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none"
        >
          <Image
            src="/images/m-logo.png"
            alt="Onward"
            width={120}
            height={36}
            priority
            className="h-9 w-auto"
          />
        </Link>

        <div className="mx-auto flex w-full lg:w-[80%] md:w-[80%] flex-1 flex-col justify-end py-12 lg:py-0">
          <h1 className="text-[clamp(44px,7vw,64px)] font-extrabold leading-[0.95] tracking-[-0.04em] text-[#1B133B]">
            Welcome
            <br />
            back<span className="text-[#77C082]">.</span>
          </h1>
          <p className="mt-5 max-w-90 text-[16px] leading-relaxed text-[#4A4466]">
            Pick up right where you left off. New here? Signing in creates your
            account.
          </p>

          <div className="mt-8">
            <LoginButtons />
          </div>

          <p className="mt-6 text-center text-[12px] text-fg-soft">
            By continuing you agree to our{" "}
            <a
              href="https://docs.google.com/document/d/1uvV_MLm_JrkVrXMbLuY-P-0QArgd6BcYlxZX1MJuPjE/edit?usp=sharing"
              target="blank"
              className="underline transition-colors hover:text-indigo"
            >
              Terms
            </a>{" "}
            and{" "}
            <a
              href="https://docs.google.com/document/d/1S_LS4wHJyAWtjU2i1mFEEjgUcXhqcqa4fBFhkoFGzwU/edit?usp=sharing"
              target="blank"
              className="underline transition-colors hover:text-indigo"
            >
              Privacy Policy
            </a>
            .
          </p>
        </div>
      </div>
      <aside className="relative hidden items-center justify-center overflow-hidden bg-[#EDEAFB] p-12 lg:flex">
        <div className="w-full max-w-140">
          <h2 className="text-[clamp(36px,4vw,52px)] font-extrabold leading-[1.05] tracking-[-0.03em] text-[#1B133B]">
            A little a day
            <br />
            <span className="text-indigo">adds up.</span>
          </h2>
          <img
            src="/images/login-pills.svg"
            alt="Activity pills: Welcome back, Keep it, Day 12 streak, Quiz passed and more"
            className="mt-8 w-full"
          />
        </div>
      </aside>
    </main>
  );
}
