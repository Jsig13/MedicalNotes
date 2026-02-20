"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { createClient } from "@/lib/supabase";
import type { Provider } from "@/types";

interface ProviderContextType {
  provider: Provider | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

const ProviderContext = createContext<ProviderContextType>({
  provider: null,
  loading: true,
  refresh: async () => {},
});

export function ProviderProvider({ children }: { children: ReactNode }) {
  const [provider, setProvider] = useState<Provider | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchProvider = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setProvider(null);
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("providers")
        .select("*")
        .eq("email", user.email)
        .single();

      setProvider(data);
    } catch {
      setProvider(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProvider();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchProvider();
    });

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ProviderContext.Provider value={{ provider, loading, refresh: fetchProvider }}>
      {children}
    </ProviderContext.Provider>
  );
}

export function useProvider() {
  return useContext(ProviderContext);
}
