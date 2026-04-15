import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'soul_azan_meta_v1';

export async function getLastScheduled() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? JSON.parse(raw).lastScheduled : null;
  } catch {
    return null;
  }
}

export async function setLastScheduled(isoString) {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify({ lastScheduled: isoString }));
  } catch (e) {
    console.warn('azanStorage.setLastScheduled:', e);
  }
}
