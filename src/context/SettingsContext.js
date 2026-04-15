import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { loadSettings, saveSettings, DEFAULT_SETTINGS } from '../storage/settingsStorage';

const SettingsContext = createContext(null);

function mergeDeep(base, override) {
  const result = { ...base };
  for (const key of Object.keys(override || {})) {
    if (
      typeof override[key] === 'object' &&
      override[key] !== null &&
      !Array.isArray(override[key])
    ) {
      result[key] = mergeDeep(base[key] || {}, override[key]);
    } else {
      result[key] = override[key];
    }
  }
  return result;
}

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(null); // null = loading
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    loadSettings().then((s) => {
      setSettings(s);
      setIsLoaded(true);
    });
  }, []);

  const updateSettings = useCallback((partial) => {
    setSettings((prev) => {
      const next = mergeDeep(prev, partial);
      saveSettings(next);
      return next;
    });
  }, []);

  const completeOnboarding = useCallback(async (finalSettings) => {
    const next = { ...finalSettings, onboardingDone: true };
    await saveSettings(next);
    setSettings(next);
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, isLoaded, updateSettings, completeOnboarding }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be inside SettingsProvider');
  return ctx;
}
