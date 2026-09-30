import { useEffect, useRef, useState, type ReactNode } from 'react'

interface RevealProps {
  children: ReactNode
  delay?: number
  className?: string
}

// Simple scroll reveal using IntersectionObserver.
// Allowed per skill: IntersectionObserver, no window scroll listeners.
// Respects prefers-reduced-motion via CSS media query and JS check.
export function Reveal({ children, delay = 0, className = '' }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!ref.current) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setVisible(true)
      return
    }
    const el = ref.current
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setVisible(true)
            obs.disconnect()
          }
        })
      },
      { threshold: 0.2 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(20px)',
        transition: `opacity var(--dur-reveal) var(--ease-expo), transform var(--dur-reveal) var(--ease-expo)`,
        transitionDelay: `${delay}ms`,
        willChange: visible ? 'auto' : 'transform',
      }}
    >
      {children}
    </div>
  )
}
