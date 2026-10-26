import { useState } from "react";

interface CompanyLogoProps {
  companyName: string;
  logoUrl?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

// Shows the original company logo from the source posting when available.
// Falls back to a neutral empty-state building icon when missing or failing to load.
export function CompanyLogo({
  companyName,
  logoUrl,
  size = "md",
  className,
}: CompanyLogoProps) {
  const [attempt, setAttempt] = useState(0);
  const [failed, setFailed] = useState(false);
  // 'lg' untuk kartu feed, 'xl' untuk panel detail. Tanpa border & tanpa sudut
  // membulat (kotak penuh) sesuai gaya JobStreet.
  const dims =
    size === "sm"
      ? "h-8 w-8 text-[11px]"
      : size === "md"
        ? "h-10 w-10 text-xs"
        : size === "lg"
          ? "h-12 w-12 text-sm"
          : "h-16 w-16 sm:h-20 sm:w-20 text-lg";

  const effectiveClasses = className || dims;

  // Fallback: ikon gedung placeholder ala kosong (bukan inisial), gaya netral & lembut.
  if (!logoUrl || failed) {
    return (
      <div
        className={`${effectiveClasses} bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl flex items-center justify-center shrink-0`}
        aria-hidden="true"
        title={`Belum ada logo untuk ${companyName}`}
      >
        <svg
          className="h-1/2 w-1/2 text-slate-300 dark:text-slate-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
            d="M3 21h18M5 21V5a1 1 0 011-1h8a1 1 0 011 1v16m0-9h3a1 1 0 011 1v9M8 8h.01M8 12h.01M8 16h.01M11 8h.01M11 12h.01M11 16h.01"
          />
        </svg>
      </div>
    );
  }

  return (
    <img
      // Retry sekali dengan cache-buster sebelum menyerah (CDN kadang transien gagal).
      src={
        attempt === 0
          ? logoUrl
          : `${logoUrl}${logoUrl.includes("?") ? "&" : "?"}retry=1`
      }
      alt={`Logo ${companyName}`}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => (attempt === 0 ? setAttempt(1) : setFailed(true))}
      className={`${effectiveClasses} object-contain bg-white dark:bg-slate-800 rounded-lg p-0.5 shrink-0`}
    />
  );
}
