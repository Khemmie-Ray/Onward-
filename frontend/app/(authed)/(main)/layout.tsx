import type { ReactNode } from "react";
import Header from "@/components/shared/Header";
import Footer from "@/components/shared/Footer";
import { Nav } from "@/components/dashboard/nav/Nav";
import { AuthGuard } from "@/components/auth/AuthGuard";

export default function AuthedLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
    <main className="mx-auto lg:w-[80%] md:w-[80%] w-[90%]">
      <div className="w-full">
        <Header />
        <Nav />
        <div className="lg:h-[75vh] md:h-[70vh] overflow-y-scroll">
        {children}
        </div>
      </div>
    </main>
    </AuthGuard>
  );
}