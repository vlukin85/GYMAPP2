import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

import { DEFAULT_INTERFACE_DENSITY, getInterfaceDensityPreset, isInterfaceDensity, type InterfaceDensity } from "@/lib/interface-density";

type InterfaceDensityContextValue = {
  density: InterfaceDensity;
  setDensity: (density: InterfaceDensity) => void;
  fontScale: number;
  spacingScale: number;
};

const STORAGE_KEY = "gym-diary-interface-density-v1";
const InterfaceDensityContext = createContext<InterfaceDensityContextValue | null>(null);

export function InterfaceDensityProvider({ children }: { children: React.ReactNode }) {
  const [density, setDensity] = useState<InterfaceDensity>(DEFAULT_INTERFACE_DENSITY);
  const preset = getInterfaceDensityPreset(density);

  useEffect(() => {
    void AsyncStorage.getItem(STORAGE_KEY).then((value) => {
      if (isInterfaceDensity(value)) setDensity(value);
    });
  }, []);
  useEffect(() => { void AsyncStorage.setItem(STORAGE_KEY, density); }, [density]);

  const value = useMemo(() => ({ density, setDensity, fontScale: preset.fontScale, spacingScale: preset.spacingScale }), [density, preset.fontScale, preset.spacingScale]);
  return <InterfaceDensityContext.Provider value={value}>{children}</InterfaceDensityContext.Provider>;
}

export function useInterfaceDensity() {
  const context = useContext(InterfaceDensityContext);
  if (!context) throw new Error("useInterfaceDensity must be used within InterfaceDensityProvider");
  return context;
}
