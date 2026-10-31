"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Persona, PRESET_PERSONAS, DEFAULT_PERSONA } from "@/lib/mock-personas";

interface AuthContextType {
  currentUser: Persona;
  allPersonas: Persona[];
  switchPersona: (id: string) => void;
  updateTrustScore: (delta: number) => void;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: DEFAULT_PERSONA,
  allPersonas: PRESET_PERSONAS,
  switchPersona: () => {},
  updateTrustScore: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<Persona>(DEFAULT_PERSONA);

  useEffect(() => {
    const savedId = localStorage.getItem("openlab_active_persona");
    if (savedId) {
      const match = PRESET_PERSONAS.find((p) => p.id === savedId || p.email.includes(savedId.toLowerCase()));
      if (match) setCurrentUser(match);
    }
  }, []);

  const switchPersona = (id: string) => {
    const match = PRESET_PERSONAS.find((p) => p.id === id);
    if (match) {
      setCurrentUser(match);
      localStorage.setItem("openlab_active_persona", match.id);
    }
  };

  const updateTrustScore = (delta: number) => {
    setCurrentUser((prev) => ({
      ...prev,
      trustScore: Math.max(0, Math.min(100, parseFloat((prev.trustScore + delta).toFixed(1)))),
    }));
  };

  return (
    <AuthContext.Provider value={{ currentUser, allPersonas: PRESET_PERSONAS, switchPersona, updateTrustScore }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

