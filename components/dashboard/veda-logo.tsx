export function VedaLogo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#ff6b35] to-[#e63946] shadow-sm">
        <span className="text-lg font-bold text-white">V</span>
      </div>
      {!compact && (
        <span className="text-xl font-bold tracking-tight text-[#1a1a1a]">
          VedaAI
        </span>
      )}
    </div>
  );
}
