import { useState } from "react";

interface CompanyLogoProps {
  companyName: string;
  logoUrl?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  loading?: "eager" | "lazy";
}

const glintsLogoPrefix = /^https:\/\/images\.glints\.com\/unsafe\/(?:1200x0\/)?(?=glints-dashboard\.oss-ap-southeast-1(?:-internal)?\.aliyuncs\.com\/company-logo\/)/;

export function CompanyLogo(props: CompanyLogoProps) {
  return <CompanyLogoContent key={props.logoUrl} {...props} />;
}

function CompanyLogoContent({
  companyName,
  logoUrl,
  size = "md",
  className,
  loading = "lazy",
}: CompanyLogoProps) {
  const [useOriginal, setUseOriginal] = useState(false);
  const [status, setStatus] = useState<"loading" | "loaded" | "failed">("loading");
  const dims =
    size === "sm"
      ? "h-8 w-8 text-[11px]"
      : size === "md"
        ? "h-10 w-10 text-xs"
        : size === "lg"
          ? "h-12 w-12 text-sm"
          : "h-16 w-16 sm:h-20 sm:w-20 text-lg";

  const effectiveClasses = className || dims;
  const thumbnailUrl = logoUrl?.replace(glintsLogoPrefix, "https://images.glints.com/unsafe/160x0/");
  const imageUrl = useOriginal ? logoUrl : thumbnailUrl;

  const showImage = logoUrl && status !== "failed";

  return (
    <div className={`${effectiveClasses} relative shrink-0 overflow-hidden`}>
      {status !== "loaded" && (
        <div
          className="absolute inset-0 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl flex items-center justify-center"
          aria-hidden="true"
          title={showImage ? undefined : `Belum ada logo untuk ${companyName}`}
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
      )}
      {showImage && (
        <img
          src={imageUrl}
          alt={`Logo ${companyName}`}
          loading={loading}
          referrerPolicy="no-referrer"
          onLoad={() => setStatus("loaded")}
          onError={() => {
            if (imageUrl !== logoUrl) setUseOriginal(true);
            else setStatus("failed");
          }}
          className={`absolute inset-0 h-full w-full object-contain bg-white dark:bg-slate-800 rounded-lg p-0.5 ${status === "loaded" ? "" : "opacity-0"}`}
        />
      )}
    </div>
  );
}
