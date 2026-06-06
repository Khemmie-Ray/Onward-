import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { LessonRunner } from "@/components/dashboard/lesson/LessonRunner";
import { loadLessonContent } from "@/lib/data/lessons";

export const dynamic = "force-dynamic";

export default async function LessonPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const lesson = await loadLessonContent(slug);

  if (!lesson) {
    return (
      <div className="min-h-screen bg-canvas flex flex-col items-center justify-center px-6 text-center">
        <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-terracotta mb-3">
          Module not found
        </div>
        <h1 className="display text-[32px] font-semibold text-indigo mb-2">
          That lesson doesn't exist yet.
        </h1>
        <p className="text-[14px] text-fg-soft mb-6 max-w-[400px]">
          The slug <code className="font-mono text-indigo">{slug}</code> isn't
          in the curriculum. It may be coming soon, or the link may be wrong.
        </p>
        <Link
          href="/modules"
          className="inline-flex items-center gap-2 rounded-full bg-terracotta px-6 py-3 text-[13px] font-bold text-paper shadow-[0_6px_20px_rgba(199,93,63,0.35)] transition-transform hover:-translate-y-0.5"
        >
          <ArrowLeft size={14} strokeWidth={2.8} />
          Back to modules
        </Link>
      </div>
    );
  }

  return <LessonRunner lesson={lesson} />;
}
