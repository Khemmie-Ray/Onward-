"use client";

import Link from "next/link";
import Image from "next/image";

const Header = () => {

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-30 border-b border-fg-soft/10 bg-white/90 backdrop-blur-md">
        <nav className="mx-auto flex w-[90%] items-center justify-between gap-4 py-5">
          <Link
            href="/"
            aria-label="Onward home"
            className="flex items-center gap-2.5"
          >
            <Image
              src="/images/m-logo.png"
              alt="Onward"
              width={125}
              height={36}
              priority
              className=" w-auto lg:block md:block hidden"
            />
              <Image
              src="/images/mark.png"
              alt="Onward"
              width={45}
              height={36}
              priority
              className=" w-auto lg:hidden md:hidden block"
            />
          </Link>

          <Link href="/login"
            className="inline-flex py-3 items-center gap-2 rounded-full bg-[#1B133B] px-5 font-bold text-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-[#372c64] active:translate-y-0 active:scale-[0.97]"
          >
            <span className="h-[7px] w-[7px] rounded-full bg-[#77C082]" />
            Get started
          </Link>
        </nav>
      </header>
    </>
  );
};

export default Header;
