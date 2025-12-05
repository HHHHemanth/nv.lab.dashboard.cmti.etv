// ./components/dashboard-layout.tsx
"use client"

import type React from "react"

import { useCallback, useEffect, useRef, useState } from "react"
import { AnimatePresence } from "framer-motion"
import { useMockAuth } from "@/hooks/use-mock-auth"
import { useTheme } from "@/hooks/use-theme"
import { Topbar } from "./topbar"
import  Sidebar from "./sidebar"
import { UserDataPanel } from "./user-data-panel"
import { AnimatedBackground } from "./animated-background"

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [userPanelOpen, setUserPanelOpen] = useState(false)
  const { user, isAuthenticated, isLoading, signOut, updateUser } = useMockAuth()
  const { theme, toggleTheme, isLoaded } = useTheme()

  useEffect(() => {
    // Persist sidebar state to localStorage (run once)
    const savedState = localStorage.getItem("cmti_sidebar_collapsed")
    if (savedState === "true") {
      setSidebarOpen(false)
    }
  }, [])

  const handleSidebarToggle = useCallback((open: boolean) => {
    setSidebarOpen(open)
    localStorage.setItem("cmti_sidebar_collapsed", String(!open))
  }, [])

  const handleSignOut = useCallback(() => {
    signOut()
    // In a real app, redirect to login page here
    window.location.href = "/"
  }, [signOut])

  const handleSaveUserData = useCallback(
    (data: { name: string; email: string }) => {
      updateUser(data)
      // Optional: show success toast here
    },
    [updateUser],
  )

  // -------------------------
  // Sidebar hover logic (hooks before any early returns)
  // - open on mouseover when pointer enters either collapsed or expanded sidebar (delegated)
  // - also open when cursor is within a tiny left-edge threshold (optional)
  // - close when cursor moves away (debounced), unless pointer is over sidebar
  // -------------------------
  const closeTimerRef = useRef<number | null>(null)
  const mountedRef = useRef(false)

  useEffect(() => {
    mountedRef.current = true
    const TOPBAR_OFFSET_PX = 64 // matches top-16 (4rem)
    const OPEN_THRESHOLD = 5 // open when cursor <= 5px from left edge
    const CLOSE_THRESHOLD = 48 // close when cursor > this and not over sidebars
    const DEBOUNCE_MS = 120

    // Helper to cancel any scheduled close
    const cancelScheduledClose = () => {
      if (closeTimerRef.current) {
        window.clearTimeout(closeTimerRef.current)
        closeTimerRef.current = null
      }
    }

    // Immediately open sidebar
    const openSidebarImmediate = () => {
      cancelScheduledClose()
      setSidebarOpen(true)
      localStorage.setItem("cmti_sidebar_collapsed", String(!true))
    }

    // Schedule close sidebar (debounced)
    const scheduleCloseSidebar = () => {
      if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current)
      closeTimerRef.current = window.setTimeout(() => {
        setSidebarOpen(false)
        localStorage.setItem("cmti_sidebar_collapsed", String(!false))
        closeTimerRef.current = null
      }, DEBOUNCE_MS)
    }

    // Delegated mouseover handler: if the mouse enters a collapsed/expanded sidebar element -> open
    const onDocumentMouseOver = (ev: Event) => {
      if (!(ev instanceof MouseEvent)) return
      // ignore topbar area
      if (ev.clientY < TOPBAR_OFFSET_PX) return

      try {
        const target = ev.target as HTMLElement | null
        if (!target) return
        // check collapsed sidebar selector (entire aside)
        if (target.closest('[aria-label="Navigation sidebar (collapsed)"]') || target.closest('[aria-label="Navigation sidebar"]')) {
          openSidebarImmediate()
        }
      } catch (err) {
        // ignore and let other detection handle it
      }
    }

    // Global mousemove fallback: opens when near left-edge, closes when outside threshold AND not over sidebars
    const onDocumentMouseMove = (ev: MouseEvent) => {
      // ignore topbar area
      if (ev.clientY < TOPBAR_OFFSET_PX) return

      const x = ev.clientX

      // If pointer near left edge, open
      if (x <= OPEN_THRESHOLD) {
        openSidebarImmediate()
        return
      }

      // If pointer is over collapsed/expanded sidebar elements, keep open
      let overSidebar = false
      try {
        const collapsed = document.querySelector('[aria-label="Navigation sidebar (collapsed)"]') as HTMLElement | null
        const expanded = document.querySelector('[aria-label="Navigation sidebar"]') as HTMLElement | null

        if (collapsed) {
          const r = collapsed.getBoundingClientRect()
          if (ev.clientX >= r.left && ev.clientX <= r.right && ev.clientY >= r.top && ev.clientY <= r.bottom) {
            overSidebar = true
          }
        }
        if (expanded) {
          const r2 = expanded.getBoundingClientRect()
          if (ev.clientX >= r2.left && ev.clientX <= r2.right && ev.clientY >= r2.top && ev.clientY <= r2.bottom) {
            overSidebar = true
          }
        }
      } catch (err) {
        // ignore bounding errors
        overSidebar = false
      }

      if (overSidebar) {
        cancelScheduledClose()
        // if currently closed, open
        if (!sidebarOpen) {
          openSidebarImmediate()
        }
        return
      }

      // pointer is outside sidebar; schedule close
      if (x > CLOSE_THRESHOLD) {
        scheduleCloseSidebar()
      } else {
        // between thresholds -> cancel close
        cancelScheduledClose()
      }
    }

    document.addEventListener("mouseover", onDocumentMouseOver)
    window.addEventListener("mousemove", onDocumentMouseMove)

    return () => {
      mountedRef.current = false
      document.removeEventListener("mouseover", onDocumentMouseOver)
      window.removeEventListener("mousemove", onDocumentMouseMove)
      if (closeTimerRef.current) {
        window.clearTimeout(closeTimerRef.current)
        closeTimerRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // -------------------------
  // End sidebar hover logic
  // -------------------------

  // Show loading state
  if (!isLoaded || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-full border-2 border-border border-t-primary animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading CMTI N&V...</p>
        </div>
      </div>
    )
  }


  const contentMarginLeft = "md:ml-64"; 

  return (
    <div className="min-h-screen bg-background">
      <AnimatedBackground />

      {/* Topbar */}
      <Topbar
        onMenuClick={handleSidebarToggle}
        sidebarOpen={sidebarOpen}
        theme={theme}
        onThemeToggle={toggleTheme}
        user={user}
        onSignOut={handleSignOut}
        notificationCount={0}
      />

      {/* Sidebar (desktop and collapsed) */}
<div className="hidden md:block">
  <Sidebar />
</div>

      {/* Mobile sidebar overlay */}

      {/* Main content */}
      <main className={`pt-20 pb-8 px-4 md:px-8 transition-all duration-300 role="main"`}>
        {children}
      </main>

      {/* User panel */}
      <AnimatePresence>
        {userPanelOpen && (
          <UserDataPanel
            key="user-panel"
            user={user}
            onSave={handleSaveUserData}
            onClose={() => setUserPanelOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Floating action button to open user panel (for demo) */}
      <button
        onClick={() => setUserPanelOpen(!userPanelOpen)}
        aria-label="Toggle user panel"
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-br from-primary to-secondary text-primary-foreground shadow-lg hover:shadow-xl hover:shadow-primary/50 transition-all duration-300 focus-visible-ring flex items-center justify-center font-bold text-lg md:hidden z-30 active:scale-95"
      >
        {user?.name?.charAt(0).toUpperCase() || "U"}
      </button>
    </div>
  )
}

export default DashboardLayout
