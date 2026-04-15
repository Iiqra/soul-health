/**
 * Equal-participation score calculator.
 *
 * Every tracked metric for a prayer contributes an equal share of the prayer's score.
 * No metric is a "bonus" — each detail you choose to track participates equally.
 *
 * Example: if trackCongregation + trackDuaAfter are enabled:
 *   → 3 metrics per prayer: offered(1) + congregation(1) + dua(1)
 *   → Each metric = 1/3 of that prayer's score
 */

export function computePrayerScore(prayers, prayerSettings) {
  if (!prayers || !prayerSettings) return 0;
  const {
    targetPrayers = [],
    trackCongregation, trackDuaAfter, trackOnTime, trackSunnah,
  } = prayerSettings;
  if (targetPrayers.length === 0) return 0;

  // Number of tracked metrics per prayer (offered is always counted)
  const numDetails =
    (trackCongregation ? 1 : 0) +
    (trackDuaAfter     ? 1 : 0) +
    (trackOnTime       ? 1 : 0) +
    (trackSunnah       ? 1 : 0);
  const metricsPerPrayer = 1 + numDetails;
  const totalPossible = targetPrayers.length * metricsPerPrayer;
  if (totalPossible === 0) return 0;

  let totalEarned = 0;

  for (const key of targetPrayers) {
    const p = prayers[key] || {};
    if (!p.offered) continue; // 0 for this prayer if not offered

    // offered = 1.0 always
    totalEarned += 1.0;

    // On time vs Qaza — qaza still earns partial credit (0.8)
    if (trackOnTime) {
      if (p.onTime === true)       totalEarned += 1.0;
      else if (p.onTime === false) totalEarned += 0.8;
      // null = not recorded yet = 0
    }

    // Congregation — 'jamat' full credit, 'alone' partial (still prayed)
    if (trackCongregation) {
      if (p.congregation === 'jamat')      totalEarned += 1.0;
      else if (p.congregation === 'alone') totalEarned += 0.4;
      // null = not recorded = 0
    }

    // Dua after prayer
    if (trackDuaAfter) {
      if (p.duaAfter === true) totalEarned += 1.0;
    }

    // Sunnah
    if (trackSunnah) {
      if (p.sunnah === true) totalEarned += 1.0;
    }
  }

  return Math.round((totalEarned / totalPossible) * 100);
}

export function computeQuranScore(quranRecord, quranSettings) {
  if (!quranSettings?.enabled) return null;
  const amount = quranRecord?.amount ?? 0;
  const goal = quranSettings?.goalAmount ?? 1;
  return Math.min(Math.round((amount / goal) * 100), 100);
}

export function computeZikarScore(zikarRecord, zikarSettings) {
  if (!zikarSettings?.enabled) return null;
  const enabledItems = (zikarSettings.items || []).filter((i) => i.enabled);
  if (enabledItems.length === 0) return 0;

  const fractions = enabledItems.map((item) => {
    const count = zikarRecord?.[item.key] ?? 0;
    return Math.min(count / item.target, 1);
  });

  return Math.round((fractions.reduce((a, b) => a + b, 0) / fractions.length) * 100);
}

/**
 * Sadaqa score: 100 if at least one entry exists within the target frequency window.
 * Sadaqa record schema: { entries: [{ id, type, recipient, amount, note }] }
 */
export function computeSadaqaScore(sadaqaRecord, sadaqaSettings, history = []) {
  if (!sadaqaSettings?.enabled) return null;
  if (!sadaqaRecord) return 0;

  const hasEntries = (sadaqaRecord.entries?.length ?? 0) > 0;

  if (sadaqaSettings.frequency === 'daily') {
    return hasEntries ? 100 : 0;
  }

  const windowDays = sadaqaSettings.frequency === 'weekly' ? 7 : 30;

  if (hasEntries) return 100;

  // Check recent history within window
  const recent = history.slice(0, windowDays);
  const doneInWindow = recent.some((r) => (r.sadaqa?.entries?.length ?? 0) > 0);
  return doneInWindow ? 100 : 0;
}

export function computeWeights(settings) {
  const sadaqaOn = settings?.sadaqa?.enabled;
  if (sadaqaOn) {
    return { prayer: 0.35, quran: 0.25, zikar: 0.25, sadaqa: 0.15 };
  }
  return { prayer: 0.40, quran: 0.30, zikar: 0.30, sadaqa: 0 };
}

export function computeTotalScore(record, settings, history = []) {
  if (!record || !settings) return 0;

  const weights = computeWeights(settings);

  const prayerPct  = computePrayerScore(record.prayers, settings.prayer) / 100;
  const quranPct   = (computeQuranScore(record.quran,   settings.quran)  ?? 0) / 100;
  const zikarPct   = (computeZikarScore(record.zikar,   settings.zikar)  ?? 0) / 100;
  const sadaqaPct  = (computeSadaqaScore(record.sadaqa, settings.sadaqa, history) ?? 0) / 100;

  const score =
    prayerPct  * weights.prayer  +
    quranPct   * weights.quran   +
    zikarPct   * weights.zikar   +
    sadaqaPct  * weights.sadaqa;

  return Math.round(score * 100);
}

export function scoreToState(score) {
  if (score <= 25) return 'withered';
  if (score <= 50) return 'struggling';
  if (score <= 65) return 'neutral';
  if (score <= 82) return 'glowing';
  return 'radiant';
}

export function computeStreak(history) {
  if (!history || history.length === 0) return 0;
  const sorted = [...history].sort((a, b) => b.date.localeCompare(a.date));
  let streak = 0;
  for (const record of sorted) {
    if ((record.score ?? 0) >= 50) streak++;
    else break;
  }
  return streak;
}

export function getScoreBreakdown(record, settings, history = []) {
  const weights = computeWeights(settings);
  const components = [];

  const p = computePrayerScore(record?.prayers, settings?.prayer);
  components.push({ label: 'Prayers', score: p, weight: weights.prayer });

  const q = computeQuranScore(record?.quran, settings?.quran);
  if (q !== null) components.push({ label: 'Quran', score: q, weight: weights.quran });

  const z = computeZikarScore(record?.zikar, settings?.zikar);
  if (z !== null) components.push({ label: 'Zikar', score: z, weight: weights.zikar });

  const s = computeSadaqaScore(record?.sadaqa, settings?.sadaqa, history);
  if (s !== null) components.push({ label: 'Sadaqa', score: s, weight: weights.sadaqa });

  return components;
}
