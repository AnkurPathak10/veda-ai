import Image from "next/image";

export function VedaLogo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <Image
        src="/logo.jpeg"
        alt="VedaAI"
        width={36}
        height={36}
        className="h-9 w-9 shrink-0 rounded-xl object-cover shadow-sm"
      />
      {!compact && (
        <span className="text-xl font-bold tracking-tight text-[#1a1a1a]">
          VedaAI
        </span>
      )}
    </div>
  );
}
