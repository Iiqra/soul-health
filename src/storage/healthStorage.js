import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_SETTINGS } from './settingsStorage';

const KEYS = {
  TODAY:   'soul_today_v2',
  HISTORY: 'soul_history_v2',
};

function todayISO() {
  return new Date().toISOString().split('T')[0];
}

/** Build a fresh prayer entry for one prayer key */
function freshPrayer(prayerSettings) {
  return {
    offered: false,
    congregation: prayerSettings.trackCongregation ? null : undefined,
    duaAfter:     prayerSettings.trackDuaAfter     ? null : undefined,
    onTime:       prayerSettings.trackOnTime        ? null : undefined,
    sunnah:       prayerSettings.trackSunnah        ? null : undefined,
  };
}

export function createFreshRecord(date, settings = DEFAULT_SETTINGS) {
  const ps = settings.prayer;
  const prayers = {};
  ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].forEach((key) => {
    prayers[key] = freshPrayer(ps);
  });

  // Zikar: flat count map for enabled items
  const zikar = {};
  (settings.zikar.items || []).forEach((item) => {
    if (item.enabled) zikar[item.key] = 0;
  });

  return {
    date,
    prayers,
    quran: { amount: 0 },
    zikar,
    sadaqa: settings.sadaqa.enabled ? { entries: [] } : undefined,
    score: 0,
  };
}

async function archiveRecord(record) {
  try {
    const raw = await AsyncStorage.getItem(KEYS.HISTORY);
    const history = raw ? JSON.parse(raw) : [];
    const filtered = history.filter((r) => r.date !== record.date);
    const updated = [record, ...filtered].slice(0, 30);
    await AsyncStorage.setItem(KEYS.HISTORY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Archive failed:', e);
  }
}

function migrateSadaqa(record) {
  if (!record.sadaqa) return record;
  // Old schema: { done: bool } → new schema: { entries: [] }
  if (typeof record.sadaqa.done === 'boolean' && !Array.isArray(record.sadaqa.entries)) {
    return {
      ...record,
      sadaqa: { entries: record.sadaqa.done ? [{ id: 'migrated', type: 'other', note: '', amount: '' }] : [] },
    };
  }
  return record;
}

export async function loadTodayRecord(settings = DEFAULT_SETTINGS) {
  try {
    const today = todayISO();
    const raw = await AsyncStorage.getItem(KEYS.TODAY);
    if (raw) {
      const parsed = migrateSadaqa(JSON.parse(raw));
      if (parsed.date === today) return parsed;
      await archiveRecord(parsed);
    }
    return createFreshRecord(today, settings);
  } catch {
    return createFreshRecord(todayISO(), settings);
  }
}

export async function saveTodayRecord(record) {
  try {
    await AsyncStorage.setItem(KEYS.TODAY, JSON.stringify(record));
  } catch (e) {
    console.warn('Save failed:', e);
  }
}

export async function loadHistory() {
  try {
    const raw = await AsyncStorage.getItem(KEYS.HISTORY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function clearAllData() {
  await AsyncStorage.multiRemove([KEYS.TODAY, KEYS.HISTORY]);
}
