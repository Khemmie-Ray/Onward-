import type { ReactNode } from "react";
import { MobileTabBar } from "@/components/dashboard/nav/MobileTabbar";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Sidebar } from "@/components/shell/Sidebar";
import { RightPanelOutlet } from "@/components/shell/RightPanel";

export default function AuthedLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex h-screen overflow-hidden">
        <div className="hidden h-full md:flex lg:w-[18%] md:w-[18%]">
          <Sidebar />
        </div>
        <main className="no-scrollbar flex-1 overflow-y-auto px-5 py-6 pb-24 md:px-8 md:pb-6">
          {children}
        </main>
        <div className="hidden h-full lg:flex md:flex lg:w-[25%] md:w-[25%]">
          <RightPanelOutlet />
        </div>
      </div>
      <MobileTabBar />
    </AuthGuard>
  );
}
