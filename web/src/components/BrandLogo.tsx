interface BrandLogoProps {
  className?: string
  iconClassName?: string
  textClassName?: string
  showText?: boolean
}

export function BrandLogo({
  className = "inline-flex items-center gap-2",
  iconClassName = "w-6 h-6 shrink-0",
  textClassName = "text-2xl font-medium tracking-tighter text-slate-900 dark:text-white",
  showText = true,
}: BrandLogoProps) {
  return (
    <span className={className}>
      <svg
        viewBox="0 0 256 256"
        className={iconClassName}
        role="img"
        aria-label="upmatch logo"
      >
        <rect width="256" height="256" fill="#0C52EE" />
        <g fill="#FFFFFF">
          <path d="M28 240V176H116V216H68V240Z" />
          <path d="M84 160V96H172V136H124V160Z" />
          <path d="M140 80V16H228V56H180V80Z" />
        </g>
      </svg>
      {showText && <span className={textClassName}>upmatch</span>}
    </span>
  )
}
