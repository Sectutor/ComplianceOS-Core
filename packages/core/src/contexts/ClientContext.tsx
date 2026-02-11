import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'wouter';

interface ClientContextType {
  selectedClientId: number | null;
  setSelectedClientId: (id: number | null) => void;
  clearSelectedClient: () => void;
  planTier: string | null;
  setPlanTier: (tier: string | null) => void;
  userRole: string | null;
  setUserRole: (role: string | null) => void;
}

const ClientContext = createContext<ClientContextType | undefined>(undefined);

export function ClientContextProvider({ children }: { children: React.ReactNode }) {
  const [selectedClientId, setSelectedClientId] = useState<number | null>(() => {
    const v = typeof window !== 'undefined' ? window.localStorage.getItem('selectedClientId') : null;
    return v ? parseInt(v, 10) || null : null;
  });
  const [location] = useLocation();

  // Extract client ID from URL and update context
  useEffect(() => {
    const clientMatch = location.match(/\/clients\/(\d+)/);
    if (clientMatch) {
      const clientId = parseInt(clientMatch[1], 10);
      setSelectedClientId(clientId);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('selectedClientId', String(clientId));
      }
    }
  }, [location]);

  const clearSelectedClient = () => {
    setSelectedClientId(null);
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('selectedClientId');
    }
  };

  const [planTier, setPlanTier] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  return (
    <ClientContext.Provider value={{
      selectedClientId,
      setSelectedClientId,
      clearSelectedClient,
      planTier,
      setPlanTier,
      userRole,
      setUserRole
    }}>
      {children}
    </ClientContext.Provider>
  );
}

export function useClientContext() {
  const context = useContext(ClientContext);
  if (context === undefined) {
    throw new Error('useClientContext must be used within ClientContextProvider');
  }
  return context;
}
