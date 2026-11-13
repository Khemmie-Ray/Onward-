import { Check, Gamepad2 } from "lucide-react";
import { PanelCard, PanelCardHeader } from "../PanelCard";
import { UBIClaimCard } from "@/components/dashboard/UBIClaimCard";
import { LeaderboardCard } from "@/components/shell/LeaderboardCard";

const MOCK = {
  resetsIn: "5h 42m",
  today: [
    { label: "Finish a lesson", done: true },
    { label: "Play today's round", done: false },
  ],
};

export function PlayRightPanel() {
  return (
    <>
      <UBIClaimCard />

      <PanelCard>
        <PanelCardHeader title="Today" meta={`Resets in ${MOCK.resetsIn}`} />
        <ul className="flex flex-col gap-3">
          {MOCK.today.map((task) => (
            <li key={task.label} className="flex items-center gap-3">
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${
                  task.done
                    ? "bg-forest text-paper"
                    : "bg-terracotta-tint text-terracotta"
                }`}
              >
                {task.done ? (
                  <Check size={13} strokeWidth={3} />
                ) : (
                  <Gamepad2 size={13} strokeWidth={2.4} />
                )}
              </span>
              <div className="flex-1">
                <div className="text-[12px] font-medium">{task.label}</div>
                <div className="mt-1 h-1 rounded-full bg-canvas-warm">
                  <div
                    className={`h-1 rounded-full ${
                      task.done ? "w-full bg-forest" : "w-0"
                    }`}
                  />
                </div>
              </div>
            </li>
          ))}
        </ul>
      </PanelCard>
      <LeaderboardCard />
    </>
  );
}
