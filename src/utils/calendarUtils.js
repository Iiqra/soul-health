/**
 * calendarUtils.js
 *
 * Adds prayer times as iOS Reminders (which sync to Google Tasks when a
 * Google account is linked in iOS Settings → Passwords & Accounts).
 *
 * Two-way sync:
 *   App → Reminders : when user marks a prayer offered, reminder is completed.
 *   Reminders → App : on PrayersScreen focus, completed reminders mark prayers offered.
 *
 * iOS only — Android does not support the Reminders entity type.
 */

import { Platform } from 'react-native';
import * as Calendar from 'expo-calendar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getPrayerTimesForDate } from './prayerTimes';

const REMINDER_LIST_NAME = 'Soul Health — Prayers';
const STORE_KEY          = 'soul_prayer_reminder_ids_v2';

const PRAYER_LABELS = {
  fajr:    { name: 'Fajr',    arabic: 'الفجر'  },
  dhuhr:   { name: 'Dhuhr',   arabic: 'الظهر'  },
  asr:     { name: 'Asr',     arabic: 'العصر'  },
  maghrib: { name: 'Maghrib', arabic: 'المغرب' },
  isha:    { name: 'Isha',    arabic: 'العشاء'  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function dayKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

async function loadStore() {
  try {
    const raw = await AsyncStorage.getItem(STORE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

async function saveStore(data) {
  await AsyncStorage.setItem(STORE_KEY, JSON.stringify(data));
}

// Returns { prayerKey: reminderId } for a given date, or null
async function getReminderIds(date) {
  const store = await loadStore();
  return store[dayKey(date)] ?? null;
}

async function setReminderIds(date, ids) {
  const store = await loadStore();
  store[dayKey(date)] = ids;
  // Keep only the last 14 days to avoid bloat
  const keys = Object.keys(store).sort();
  if (keys.length > 14) keys.slice(0, keys.length - 14).forEach(k => delete store[k]);
  await saveStore(store);
}

// ── Reminder list (calendar) ──────────────────────────────────────────────────

async function getOrCreateReminderList() {
  const lists = await Calendar.getCalendarsAsync(Calendar.EntityTypes.REMINDER);
  const existing = lists.find(l => l.title === REMINDER_LIST_NAME && l.allowsModifications);
  if (existing) return existing.id;

  let sourceId;
  try {
    const sources = await Calendar.getSourcesAsync();
    // Prefer Google (caldav) account so tasks appear in Google Tasks
    const google = sources.find(s => s.type === 'caldav' && s.name?.toLowerCase().includes('google'));
    const local  = sources.find(s => s.type === 'local');
    if (google) sourceId = google.id;
    else if (local) sourceId = local.id;
  } catch {}

  return await Calendar.createCalendarAsync({
    title:       REMINDER_LIST_NAME,
    color:       '#8B76D6',
    entityType:  Calendar.EntityTypes.REMINDER,
    ...(sourceId ? { sourceId } : { source: { isLocalAccount: true, name: 'Soul Health', type: 'local' } }),
    name:        REMINDER_LIST_NAME,
    ownerAccount:'personal',
    accessLevel: Calendar.CalendarAccessLevel?.OWNER ?? 'owner',
  });
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Add today's 5 prayer times as reminders to a "Soul Health — Prayers" list.
 * If a Google account is linked in iOS Settings, these appear in Google Tasks.
 *
 * @param {number} lat
 * @param {number} lng
 * @param {string} method  calculation method key
 * @param {Date}   date    defaults to today
 * @returns {number}       count of reminders created
 */
export async function addPrayerTimesAsReminders(lat, lng, method = 'MuslimWorldLeague', date = new Date()) {
  if (Platform.OS !== 'ios') throw new Error('ios_only');

  const { status } = await Calendar.requestRemindersPermissionsAsync();
  if (status !== 'granted') throw new Error('Reminders permission denied');

  const listId = await getOrCreateReminderList();

  // Remove any previously created reminders for this date
  const existingIds = await getReminderIds(date);
  if (existingIds) {
    await Promise.all(
      Object.values(existingIds).map(id => Calendar.deleteReminderAsync(id).catch(() => {}))
    );
  }

  const times = getPrayerTimesForDate(date, lat, lng, method);
  const now   = new Date();
  const ids   = {};
  let created = 0;

  for (const [key, time] of Object.entries(times)) {
    if (!(time instanceof Date) || isNaN(time.getTime())) continue;

    const info = PRAYER_LABELS[key];
    try {
      const id = await Calendar.createReminderAsync(listId, {
        title:     `${info.name} — ${info.arabic}`,
        startDate: time,
        dueDate:   time,
        completed: false,
        notes:     'Soul Health prayer tracker',
        alarms:    [{ relativeOffset: 0 }],
      });
      ids[key] = id;
      created++;
    } catch (e) {
      console.warn('calendarUtils: failed to create reminder for', key, e);
    }
  }

  await setReminderIds(date, ids);
  return created;
}

/**
 * Read back which prayers are marked complete in the Reminders app.
 * Returns an object like { fajr: true, dhuhr: false, asr: true, ... }
 * Only includes prayers that have a stored reminder ID for the given date.
 */
export async function getCompletedPrayerReminders(date = new Date()) {
  if (Platform.OS !== 'ios') return {};

  const ids = await getReminderIds(date);
  if (!ids || Object.keys(ids).length === 0) return {};

  const result = {};
  for (const [prayerKey, reminderId] of Object.entries(ids)) {
    try {
      const reminder = await Calendar.getReminderAsync(reminderId);
      if (reminder) result[prayerKey] = !!reminder.completed;
    } catch { /* reminder may have been deleted externally */ }
  }
  return result;
}

/**
 * Mark a prayer's reminder as complete (or incomplete).
 * Call this whenever the user toggles a prayer in the app.
 */
export async function markPrayerReminderComplete(prayerKey, complete = true, date = new Date()) {
  if (Platform.OS !== 'ios') return;

  const ids = await getReminderIds(date);
  const id  = ids?.[prayerKey];
  if (!id) return;

  try {
    await Calendar.updateReminderAsync(id, { completed: complete });
  } catch { /* ignore — reminder may not exist */ }
}
