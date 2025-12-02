// frontend/src/components/AuthStatus.tsx
"use client";
import React, { useEffect, useState } from "react";
export default function AuthStatus() {
  const [token, setToken] = useState<string | null>(null);
  useEffect(() => {
    setToken(localStorage.getItem("jwtToken"));
    const onStorage = () => setToken(localStorage.getItem("jwtToken"));
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  return <div className="text-sm">{token ? "Authenticated" : "Not authenticated"}</div>;
}
