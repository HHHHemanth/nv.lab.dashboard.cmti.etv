"use client"

import type React from "react"
import { motion } from "framer-motion"
import { ChevronLeft, ChevronRight, LayoutDashboard, Cable, Thermometer, AudioLines } from "lucide-react"
import { useCallback, useEffect, useState, useRef } from "react"

interface SidebarProps {
  isOpen: boolean
  onToggle: (open: boolean) => void
}

const MENU_ITEMS = [
  { id: "dashboard", label: "Home", icon: LayoutDashboard },
  { id: "insights", label: "Energy", icon: Cable },
  { id: "reports", label: "Temperature", icon: Thermometer },
  { id: "settings", label: "Vibration", icon: AudioLines },
]

// Expanded Sidebar
export function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const [isMounted, setIsMounted] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const collapseTimer = useRef<number | null>(null)

  useEffect(() => {
    setIsMounted(true)
    return () => {
      if (collapseTimer.current) window.clearTimeout(collapseTimer.current)
    }
  }, [])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isOpen) {
        return
      }
    },
    [isOpen],
  )

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleKeyDown])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height
    setMousePosition({ x, y })
  }

  if (!isMounted) return null

  const sidebarVariants = {
    open: { x: 0, opacity: 1 },
    closed: { x: -300, opacity: 0 },
  }

  // when mouse enters expanded sidebar, cancel any pending collapse
  const handleMouseEnter = () => {
    if (collapseTimer.current) {
      window.clearTimeout(collapseTimer.current)
      collapseTimer.current = null
    }
  }

  // when mouse leaves expanded sidebar, start collapse timer
  const handleMouseLeave = () => {
    if (collapseTimer.current) window.clearTimeout(collapseTimer.current)
    // delay collapse slightly so moving between collapsed and expanded doesn't flicker
    collapseTimer.current = window.setTimeout(() => {
      onToggle(false)
      collapseTimer.current = null
    }, 250)
  }

  return (
    <motion.aside
      initial={false}
      animate={isOpen ? "open" : "closed"}
      variants={sidebarVariants}
      transition={{ duration: 0.32, ease: "easeInOut" }}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="fixed left-0 top-0 bottom-0 z-40 w-64 glass-panel rounded-none shadow-2xl perspective"
      aria-label="Navigation sidebar"
      role="navigation"
    >
      {/* subtle pointer radial highlight */}
      <motion.div
        className="absolute inset-0 rounded-none pointer-events-none"
        style={{
          background: `radial-gradient(circle at ${mousePosition.x * 100}% ${mousePosition.y * 100}%, rgba(6, 182, 212, 0.05) 0%, transparent 60%)`,
        }}
      />

      <div className="relative flex flex-col h-full p-4 gap-2">
        {/* TOP: collapse button placed at the top-right inside the expanded sidebar */}


        {/* Nav */}
        <motion.nav
          className="flex flex-col gap-2 mt-2"
          initial="hidden"
          animate={isOpen ? "visible" : "hidden"}
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.06, delayChildren: 0.05 },
            },
          }}
        >
          {MENU_ITEMS.map((item, index) => {
            const Icon = item.icon
            return (
              <motion.button
                key={item.id}
                data-testid={`nav-${item.id}`}
                aria-label={item.label}
                className="group relative flex items-center gap-3 px-4 py-3 rounded-lg text-foreground transition-all duration-200 overflow-hidden focus-visible-ring"
                variants={{
                  hidden: { opacity: 0, x: -20, rotateY: -10 },
                  visible: {
                    opacity: 1,
                    x: 0,
                    rotateY: 0,
                    transition: { type: "spring", stiffness: 120, damping: 14 },
                  },
                }}
                whileHover={{
                  x: 6,
                  scale: 1.02,
                  transition: { type: "spring", stiffness: 200 },
                }}
                whileTap={{ scale: 0.98 }}
              >
                <motion.div
                  className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary/10 to-secondary/10 -z-10"
                  initial={{ opacity: 0, y: 10 }}
                  whileHover={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.18 }}
                />

                <motion.div
                  whileHover={{ rotate: 8, scale: 1.2 }}
                  whileTap={{ rotate: -4 }}
                  className="flex-shrink-0"
                  transition={{ type: "spring", stiffness: 120, damping: 18 }}
                >
                  <Icon className="w-5 h-5 text-primary" />
                </motion.div>

                <span className="text-sm font-medium">{item.label}</span>

                <motion.div
                  className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-primary to-secondary rounded-full"
                  initial={{ opacity: 0, scaleY: 0 }}
                  whileHover={{ opacity: 1, scaleY: 1 }}
                  transition={{ duration: 0.18 }}
                />
              </motion.button>
            )
          })}
        </motion.nav>

        {/* Spacer */}
        <div className="flex-1" />

        {/* bottom area - optionally put secondary actions here */}
        <div className="px-2">
          {/* Example: small sign out or version text */}
          <div className="text-xs text-muted-foreground px-2 py-1">v1.0</div>
        </div>
      </div>
    </motion.aside>
  )
}

// Collapsed sidebar (icon-only)
export function SidebarCollapsed({ onToggle }: { onToggle: (open: boolean) => void }) {
  const [isMounted, setIsMounted] = useState(false)
  const [tooltipId, setTooltipId] = useState<string | null>(null)
  const expandTimer = useRef<number | null>(null)

  useEffect(() => {
    setIsMounted(true)
    return () => {
      if (expandTimer.current) window.clearTimeout(expandTimer.current)
    }
  }, [])

  if (!isMounted) return null

  const iconContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.06,
        delayChildren: 0.05,
      },
    },
  }

const iconVariants = {
  hidden: { opacity: 0, scale: 0, rotateZ: -180 },
  visible: {
    opacity: 1,
    scale: 1,
    rotateZ: 0,
    transition: { type: "spring", stiffness: 150, damping: 15 } as any,
  },
};



  // when hovering collapsed, expand immediately
  const handleMouseEnter = () => {
    if (expandTimer.current) {
      window.clearTimeout(expandTimer.current)
      expandTimer.current = null
    }
    onToggle(true)
  }

  // if user leaves collapsed bar quickly, start a short timer to avoid flicker
  const handleMouseLeave = () => {
    if (expandTimer.current) window.clearTimeout(expandTimer.current)
    expandTimer.current = window.setTimeout(() => {
      onToggle(false)
      expandTimer.current = null
    }, 200)
  }

  return (
    <aside
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="fixed left-0 top-0 bottom-0 z-40 w-20 glass-panel rounded-none flex flex-col items-center py-4 gap-2 shadow-2xl"
      aria-label="Navigation sidebar (collapsed)"
      role="navigation"
    >
      <motion.div
        className="flex flex-col gap-2 w-full items-center"
        variants={iconContainerVariants}
        initial="hidden"
        animate="visible"
      >
        {MENU_ITEMS.map((item, index) => {
          const Icon = item.icon
          return (
            <div key={item.id} className="relative w-full flex justify-center">
              <motion.button
                onMouseEnter={() => setTooltipId(item.id)}
                onMouseLeave={() => setTooltipId(null)}
                data-testid={`nav-collapsed-${item.id}`}
                aria-label={item.label}
                className="relative flex items-center justify-center w-12 h-12 rounded-lg text-primary transition-all duration-200 focus-visible-ring group overflow-hidden"
                variants={iconVariants}
                whileHover={{
                  scale: 1.10,
                  rotateZ: 3,
                  transition: { type: "spring", stiffness: 110, damping: 16  },
                }}
                whileTap={{ scale: 0.9 }}
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/10 opacity-0 group-hover:opacity-100 rounded-lg"
                  initial={{ scale: 0.8 }}
                  whileHover={{ scale: 1 }}
                  transition={{ duration: 0.2 }}
                />
                <Icon className="w-5 h-5 relative z-10" />
              </motion.button>

              {tooltipId === item.id && (
                <motion.div
                  initial={{ opacity: 0, x: -16, scale: 0.8, rotateY: -20 }}
                  animate={{ opacity: 1, x: 0, scale: 1, rotateY: 0 }}
                  exit={{ opacity: 0, x: -16, scale: 0.8, rotateY: -20 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  className="absolute left-16 top-1/2 -translate-y-1/2 px-3 py-1 rounded-lg text-xs font-medium bg-gradient-to-r from-primary to-secondary text-primary-foreground whitespace-nowrap pointer-events-none shadow-lg"
                >
                  {item.label}
                </motion.div>
              )}
            </div>
          )
        })}
      </motion.div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Expand button stays at bottom when collapsed */}

    </aside>
  )
}

export function LeftHoverZone({ onEnter, onLeave, width = 8 }: { onEnter: () => void; onLeave: () => void; width?: number }) {
  // width is tailwind units (w-8), we will build class string
  const w = `w-[${width}px]` // if you prefer fixed px; or use 'w-8' string
  // easier: use inline style for px width to avoid class string complexity
  return (
    <div
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      // keep it pointer-events active but visually transparent
      style={{ position: "fixed", left: 0, top: 64, bottom: 0, width: 32, zIndex: 45 }}
      // top:64 assumes your topbar height + margin; adjust to match your layout (top-16 in tailwind ~= 64px)
      className="pointer-events-auto"
      aria-hidden
    />
  )
}