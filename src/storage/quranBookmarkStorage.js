import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'soul_quran_bookmark_v1';

/**
 * Schema: { surahNumber, surahName, surahArabic, ayahNumber, note, updatedAt }
 */

export async function loadBookmark() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function saveBookmark(bookmark) {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify({
      ...bookmark,
      updatedAt: new Date().toISOString(),
    }));
  } catch (e) {
    console.warn('quranBookmarkStorage.saveBookmark:', e);
  }
}

export async function clearBookmark() {
  try {
    await AsyncStorage.removeItem(KEY);
  } catch (e) {
    console.warn('quranBookmarkStorage.clearBookmark:', e);
  }
}
