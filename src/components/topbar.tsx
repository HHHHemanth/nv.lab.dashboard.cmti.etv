// ./components/topbar.tsx
"use client"

import { useCallback, useEffect, useState } from "react"
import { Menu, Moon, Sun } from "lucide-react"
import { SlEnergy } from "react-icons/sl"
import CardNav from "./CardNav"

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
      label: "Features",
      bgColor: "#0D0716",
      textColor: "#fff",
      // in topbar.tsx items
      links: [
        { label: "Energy Monitoring", ariaLabel: "Energy Monitoring", href: "/#feature-energy-monitoring" },
        { label: "Temperature Monitoring", ariaLabel: "Temperature Monitoring", href: "/#feature-temperature-monitoring" },
        { label: "Vibration Monitoring", ariaLabel: "Vibration Monitoring", href: "/#feature-vibration-monitoring" },
      ],

    },
    {
      label: "Case Studies",
      bgColor: "#170D27",
      textColor: "#fff",
      links: [
        { label: "Case 1", ariaLabel: "Case 1", href: "/#case-studies" },
        { label: "Case 2", ariaLabel: "Case 2", href: "/#case-studies" },
        { label: "Case 3", ariaLabel: "Case 3", href: "/#case-studies" },
      ],
    },
    {
      label: "Contact",
      bgColor: "#271E37",
      textColor: "#fff",
      links: [
        { label: "Phone No.", ariaLabel: "Call us", href: "/#contact-us" },
        { label: "Email", ariaLabel: "Email us", href: "/#contact-us" },
        { label: "LinkedIn", ariaLabel: "LinkedIn", href: "/#contact-us" },
      ],
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

        </div>
      </div>
    </header>
  )
}

export default Topbar
