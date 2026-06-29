"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

interface PageEditContextType {
  isEditing: boolean;
  toggleEditing: () => void;
}

const PageEditContext = createContext<PageEditContextType | null>(null);

export function PageEditProvider({ children }: { children: ReactNode }) {
  const [isEditing, setIsEditing] = useState(false);
  const toggleEditing = useCallback(() => setIsEditing((v) => !v), []);

  return (
    <PageEditContext.Provider value={{ isEditing, toggleEditing }}>
      {children}
    </PageEditContext.Provider>
  );
}

export function usePageEdit() {
  const ctx = useContext(PageEditContext);
  if (!ctx) throw new Error("usePageEdit must be used within PageEditProvider");
  return ctx;
}
