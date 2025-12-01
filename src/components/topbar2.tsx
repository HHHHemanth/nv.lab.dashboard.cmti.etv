// ./components/topbar.tsx
"use client"

import { useCallback, useEffect, useState } from "react"
import { Menu, Moon, Sun } from "lucide-react"
import { SlEnergy } from "react-icons/sl"
import CardNav from "./CardNav2"

interface TopbarProps {
  onMenuClick: (open: boolean) => void;
  sidebarOpen: boolean;
  theme: "light" | "dark";
  onThemeToggle: () => void;
  user?: { name?: string; email?: string } | null;
  // optional additions:
  onSignOut?: () => void;
  notificationCount?: number;
}

// Keep a named export and a default export for compatibility
export function Topbar({
  onMenuClick,
  sidebarOpen,
  theme,
  onThemeToggle,
  onSignOut,
  notificationCount = 0,
  user = null,
}: TopbarProps) {


  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const handleThemeToggle = useCallback(() => {
    onThemeToggle()
  }, [onThemeToggle])

  if (!isMounted) return null

  // CardNav items (from your example)
  const items = [
    {
      label: "Home",
      bgColor: "#f0f0f0",
      textColor: "#000",
      links: [],
    },
    {
      label: "About",
      bgColor: "#f0f0f0",
      textColor: "#000",
      links: [],
    },
    {
      label: "Contact",
      bgColor: "#f0f0f0",
      textColor: "#000",
      links: [],
    },
  ];


  return (
    <header className="fixed top-4 bottom-4 left-0 right-0 z-50 pointer-events-none">
      <div className="px-4 pointer-events-auto">
        <div
          className="

          "
          style={{ alignItems: "center" }}
        >
          {/* LEFT: mobile menu + logo */}


          {/* CENTER: CardNav (visible on md+) — keeps centered layout */}
          <div className="flex-1 flex items-center justify-center">
            {/* CardNav may render its own links; hide it on small screens if you prefer */}
            <div className="w-full max-w-3xl">
              <CardNav
                logo="/logos/logocmti.png"
                logoAlt="CMTI Logo"
                items={items}
                baseColor="#fff"
                menuColor="#000"
                buttonBgColor="#111"
                buttonTextColor="#fff"
                ease="power3.out"
              />
            </div>
          </div>

          {/* RIGHT: theme toggle only (minimal) */}
          <div className="flex items-center gap-3 min-w-[120px] justify-end">
            <button
              onClick={handleThemeToggle}
              aria-label="toggle theme"
              className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {theme === "dark" ? (
                <Moon className="w-5 h-5 text-slate-200" />
              ) : (
                <Sun className="w-5 h-5 text-slate-700" />
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Topbar
