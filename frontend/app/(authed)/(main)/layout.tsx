import type { ReactNode } from "react";
import Header from "@/components/shared/Header";
import { Nav } from "@/components/dashboard/nav/Nav";
import { AuthGuard } from "@/components/auth/AuthGuard";

export default function AuthedLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
    <main className="mx-auto w-[90%]  h-screen overflow-hidden flex flex-col">
        <Header />
        <Nav />
        <div className="flex-1 overflow-y-auto no-scrollbar pb-16 md:pb-0 lg:pb-0">
        {children}
        </div>
    </main>
    </AuthGuard>
  );
}