import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { loadTodayRecord, saveTodayRecord, loadHistory } from '../storage/healthStorage';
import { computeTotalScore } from '../utils/scoreCalculator';
import { useSettings } from './SettingsContext';

const HealthContext = createContext(null);

export function HealthProvider({ children }) {
  const { settings, isLoaded: settingsLoaded } = useSettings();
  const [record, setRecord] = useState(null);
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const saveTimer = useRef(null);

  useEffect(() => {
    if (!settingsLoaded || !settings) return;
    async function init() {
      const [todayRecord, hist] = await Promise.all([
        loadTodayRecord(settings),
        loadHistory(),
      ]);
      setRecord({ ...todayRecord, score: computeTotalScore(todayRecord, settings, hist) });
      setHistory(hist);
      setIsLoading(false);
    }
    init();
  }, [settingsLoaded]);

  const scheduleSave = useCallback((rec) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveTodayRecord(rec), 500);
  }, []);

  const updateRecord = useCallback((updater) => {
    setRecord((prev) => {
      if (!prev) return prev;
      const next = typeof updater === 'function' ? updater(prev) : updater;
      const withScore = { ...next, score: computeTotalScore(next, settings, history) };
      scheduleSave(withScore);
      return withScore;
    });
  }, [settings, history, scheduleSave]);

  // ── Prayer actions ─────────────────────────────────────────────────────────

  const setPrayerOffered = useCallback((prayerKey, offered) => {
    updateRecord((prev) => ({
      ...prev,
      prayers: {
        ...prev.prayers,
        [prayerKey]: {
          ...prev.prayers[prayerKey],
          offered,
          ...(offered ? {} : { congregation: null, duaAfter: null, onTime: null, sunnah: null }),
        },
      },
    }));
  }, [updateRecord]);

  const setPrayerDetail = useCallback((prayerKey, field, value) => {
    updateRecord((prev) => ({
      ...prev,
      prayers: {
        ...prev.prayers,
        [prayerKey]: { ...prev.prayers[prayerKey], [field]: value },
      },
    }));
  }, [updateRecord]);

  // ── Quran actions ──────────────────────────────────────────────────────────

  const setQuranAmount = useCallback((amount) => {
    updateRecord((prev) => ({
      ...prev,
      quran: { ...prev.quran, amount: Math.max(0, amount) },
    }));
  }, [updateRecord]);

  // ── Zikar actions ──────────────────────────────────────────────────────────

  const incrementZikar = useCallback((key) => {
    updateRecord((prev) => ({
      ...prev,
      zikar: { ...prev.zikar, [key]: (prev.zikar[key] ?? 0) + 1 },
    }));
  }, [updateRecord]);

  const resetZikar = useCallback((key) => {
    updateRecord((prev) => ({
      ...prev,
      zikar: { ...prev.zikar, [key]: 0 },
    }));
  }, [updateRecord]);

  // ── Sadaqa actions ─────────────────────────────────────────────────────────

  const addSadaqaEntry = useCallback((entry) => {
    // entry: { type, recipient, amount, note }
    const id = Date.now().toString();
    updateRecord((prev) => ({
      ...prev,
      sadaqa: {
        entries: [...(prev.sadaqa?.entries ?? []), { ...entry, id }],
      },
    }));
  }, [updateRecord]);

  const deleteSadaqaEntry = useCallback((id) => {
    updateRecord((prev) => ({
      ...prev,
      sadaqa: {
        entries: (prev.sadaqa?.entries ?? []).filter((e) => e.id !== id),
      },
    }));
  }, [updateRecord]);

  return (
    <HealthContext.Provider
      value={{
        record,
        history,
        isLoading,
        setPrayerOffered,
        setPrayerDetail,
        setQuranAmount,
        incrementZikar,
        resetZikar,
        addSadaqaEntry,
        deleteSadaqaEntry,
      }}
    >
      {children}
    </HealthContext.Provider>
  );
}

export function useHealth() {
  const ctx = useContext(HealthContext);
  if (!ctx) throw new Error('useHealth must be inside HealthProvider');
  return ctx;
}
