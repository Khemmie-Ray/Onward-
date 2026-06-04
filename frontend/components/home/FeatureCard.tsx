import { MudclothPattern } from "./motifs";

export const FeatureCard = ({
  icon: Icon,
  title,
  copy,
  bg,
  iconBg,
  iconColor,
}: {
  icon: React.ComponentType<
    React.SVGProps<SVGSVGElement> & { size?: number; strokeWidth?: number }
  >;
  title: string;
  copy: string;
  bg: string;
  iconBg: string;
  iconColor: string;
}) => {
  return (
    <div
      className="group relative cursor-pointer overflow-hidden rounded-[22px] p-6 transition-all hover:-translate-y-1 lg:w-[32%] md:w-[32%] w-full mb-3"
      style={{
        background: bg,
        boxShadow: "0 8px 24px rgba(31,58,110,0.08)",
      }}
    >
      <div className="relative">
        <div
          className="mb-4 flex h-12 w-12 items-center justify-center rounded-[14px]"
          style={{ background: iconBg }}
        >
          <Icon size={22} strokeWidth={2.2} style={{ color: iconColor }} />
        </div>
        <h3 className="display mb-2 text-[18px] font-semibold text-indigo">
          {title}
        </h3>
        <p className="text-[13px] leading-[1.6] text-fg-soft">{copy}</p>
      </div>
    </div>
  );
};
