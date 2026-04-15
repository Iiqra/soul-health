import * as Notifications from 'expo-notifications';
import { Coordinates, CalculationMethod, PrayerTimes } from 'adhan';
import { setLastScheduled } from '../storage/azanStorage';

const METHODS = {
  MuslimWorldLeague:     () => CalculationMethod.MuslimWorldLeague(),
  Egyptian:              () => CalculationMethod.Egyptian(),
  Karachi:               () => CalculationMethod.Karachi(),
  UmmAlQura:             () => CalculationMethod.UmmAlQura(),
  NorthAmerica:          () => CalculationMethod.NorthAmerica(),
  Dubai:                 () => CalculationMethod.Dubai(),
  MoonsightingCommittee: () => CalculationMethod.MoonsightingCommittee(),
};

const PRAYER_NAMES = {
  fajr: 'Fajr', dhuhr: 'Dhuhr', asr: 'Asr', maghrib: 'Maghrib', isha: 'Isha',
};
const PRAYER_ARABIC = {
  fajr: 'الفجر', dhuhr: 'الظهر', asr: 'العصر', maghrib: 'المغرب', isha: 'العشاء',
};

/**
 * Get all 5 prayer times for a given date + coordinates.
 * Returns an object of { fajr, dhuhr, asr, maghrib, isha } — each a JS Date.
 */
export function getPrayerTimesForDate(date, lat, lng, method = 'MuslimWorldLeague') {
  const coords = new Coordinates(lat, lng);
  const params = (METHODS[method] ?? METHODS.MuslimWorldLeague)();
  const times = new PrayerTimes(coords, date, params);
  return {
    fajr:    times.fajr,
    dhuhr:   times.dhuhr,
    asr:     times.asr,
    maghrib: times.maghrib,
    isha:    times.isha,
  };
}

/**
 * Request notification permissions.
 * Returns true if granted.
 */
export async function requestNotificationPermission() {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

/**
 * Cancel all scheduled notifications and schedule fresh ones for the next 7 days.
 * azanSettings: { enabled, latitude, longitude, calculationMethod, perPrayer }
 * Returns number of notifications scheduled.
 */
export async function scheduleAzanNotifications(azanSettings) {
  if (!azanSettings?.enabled) return 0;
  const { latitude, longitude, calculationMethod, perPrayer = {} } = azanSettings;
  if (!latitude || !longitude) return 0;

  await Notifications.cancelAllScheduledNotificationsAsync();

  const now = new Date();
  let scheduled = 0;

  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const date = new Date(now);
    date.setDate(date.getDate() + dayOffset);
    date.setHours(0, 0, 0, 0);

    try {
      const times = getPrayerTimesForDate(date, latitude, longitude, calculationMethod);

      for (const [key, time] of Object.entries(times)) {
        if (!perPrayer[key]) continue;
        if (!(time instanceof Date) || isNaN(time.getTime())) continue;
        if (time <= now) continue; // skip past times

        await Notifications.scheduleNotificationAsync({
          content: {
            title: `${PRAYER_NAMES[key]} — ${PRAYER_ARABIC[key]}`,
            body: 'It is time for prayer. May Allah accept your salah. 🌿',
            sound: true,
          },
          trigger: { date: time },
        });
        scheduled++;
      }
    } catch (e) {
      console.warn(`prayerTimes: failed to schedule day +${dayOffset}:`, e);
    }
  }

  await setLastScheduled(new Date().toISOString());
  return scheduled;
}
