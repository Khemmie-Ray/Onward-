"use client";

export function AbandonConfirmModal({
  onCancel,
  onConfirm,
}: {
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-aubergine/60 backdrop-blur-sm px-6">
      <div className="w-full max-w-[400px] bg-paper rounded-[24px] p-6 shadow-[0_20px_50px_rgba(91,46,92,0.30)] animate-[fade-up_0.3s_ease_both]">
        <h3 className="display text-[22px] font-bold text-indigo mb-2">
          Quit this round?
        </h3>
        <p className="text-[13px] text-fg-soft mb-5 leading-snug">
          This counts as your daily round. You won&apos;t earn G$, but your
          streak is safe — you already showed up today.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-full bg-canvas-warm text-indigo font-bold text-[13px] hover:bg-canvas-warm/80 transition"
          >
            Keep playing
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 rounded-full bg-terracotta text-paper font-bold text-[13px] hover:opacity-90 transition"
          >
            Quit round
          </button>
        </div>
      </div>
    </div>
  );
}
