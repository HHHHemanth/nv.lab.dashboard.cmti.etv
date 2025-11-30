"use client"

import { useCallback, useEffect, useState } from "react"

export interface MockUser {
  id: string
  name: string
  email: string
  avatar?: string
}

const DEFAULT_USER: MockUser = {
  id: "1",
  name: "User",
  email: "",
  avatar: "👤",
}

export function useMockAuth() {
  const [user, setUser] = useState<MockUser | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Initialize auth state on mount
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const session = localStorage.getItem("cmti_session")
        if (session) {
          const userData = JSON.parse(session)
          setUser(userData)
          setIsAuthenticated(true)
        } else {
          // Auto-login for demo purposes
          setUser(DEFAULT_USER)
          setIsAuthenticated(true)
          localStorage.setItem("cmti_session", JSON.stringify(DEFAULT_USER))
        }
      } catch (error) {
        console.error("Failed to initialize auth:", error)
        setIsAuthenticated(false)
      } finally {
        setIsLoading(false)
      }
    }

    initializeAuth()
  }, [])

  const signInMock = useCallback((email: string, password: string) => {
    try {
      const newUser: MockUser = {
        id: "1",
        name: email.split("@")[0],
        email,
        avatar: "👤",
      }
      setUser(newUser)
      setIsAuthenticated(true)
      localStorage.setItem("cmti_session", JSON.stringify(newUser))
      return { success: true }
    } catch (error) {
      return { success: false, error: "Sign in failed" }
    }
  }, [])

  const signOut = useCallback(() => {
    try {
      localStorage.removeItem("cmti_session")
      sessionStorage.removeItem("cmti_session")
      setUser(null)
      setIsAuthenticated(false)
      return { success: true }
    } catch (error) {
      return { success: false, error: "Sign out failed" }
    }
  }, [])

  const updateUser = useCallback(
    (updates: Partial<MockUser>) => {
      try {
        // user is expected to exist here — assert non-null
        const updatedUser = { ...user!, ...updates };

        // cast to MockUser to satisfy TypeScript (runtime object is fine)
        setUser(updatedUser as MockUser);

        localStorage.setItem("cmti_session", JSON.stringify(updatedUser));
        return { success: true };
      } catch (error) {
        return { success: false, error: (error as Error).message ?? String(error) };
      }

    },
    [user],
  )

  return {
    user,
    isAuthenticated,
    isLoading,
    signInMock,
    signOut,
    updateUser,
  }
}
