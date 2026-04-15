import AsyncStorage from '@react-native-async-storage/async-storage';
import { ZIKAR_PRESETS } from '../constants/spiritualData';

const KEY = 'soul_settings_v1';

export const DEFAULT_SETTINGS = {
  onboardingDone: false,
  prayer: {
    targetPrayers: ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'],
    trackCongregation: false,
    trackDuaAfter: false,
    trackOnTime: false,
    trackSunnah: false,
  },
  quran: {
    enabled: true,
    goalType: 'pages',   // 'pages' | 'ruku' | 'verses'
    goalAmount: 5,
  },
  zikar: {
    enabled: true,
    items: ZIKAR_PRESETS.map((z) => ({ ...z, enabled: true })),
  },
  sadaqa: {
    enabled: false,
    frequency: 'weekly', // 'daily' | 'weekly' | 'monthly'
  },
  azan: {
    enabled: false,
    latitude: null,
    longitude: null,
    locationName: null,
    calculationMethod: 'MuslimWorldLeague',
    perPrayer: {
      fajr: true,
      dhuhr: true,
      asr: true,
      maghrib: true,
      isha: true,
    },
  },
};

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

export async function loadSettings() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    return mergeDeep(DEFAULT_SETTINGS, JSON.parse(raw));
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export async function saveSettings(settings) {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(settings));
  } catch (e) {
    console.warn('Failed to save settings:', e);
  }
}
