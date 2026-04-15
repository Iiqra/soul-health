import React, { useState, useRef, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, Pressable, Animated, Alert, TouchableOpacity,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useHealth } from '../context/HealthContext';
import { useSettings } from '../context/SettingsContext';
import { COLORS } from '../constants/colors';

// Sequential order — always shown in this sequence
const ZIKAR_ORDER = ['subhanallah', 'alhamdulillah', 'allahuakbar'];

const TINTS = [
  { color: '#7A8FA8', bg: 'rgba(122,143,168,0.11)' },
  { color: '#8A9A6A', bg: 'rgba(138,154,106,0.11)' },
  { color: '#A87A60', bg: 'rgba(168,122,96,0.11)'  },
];

// ─── Volume button increment ───────────────────────────────────────────────────
// Hardware volume-key events are not available in Expo managed workflow.
// To enable this feature: eject to bare workflow and install
// react-native-volume-manager, then call VolumeManager.addVolumeListener()
// when the Zikar tab is focused and remove it on blur.
// ─────────────────────────────────────────────────────────────────────────────

export default function ZikarScreen() {
  const { record, incrementZikar, resetZikar } = useHealth();
  const { settings } = useSettings();
  const [activeIndex, setActiveIndex] = useState(0);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim  = useRef(new Animated.Value(1)).current;

  // Ordered list of enabled zikar keys in canonical sequence
  const sequence = useMemo(() => {
    if (!settings) return [];
    return ZIKAR_ORDER.filter(k =>
      settings.zikar.items.some(i => i.key === k && i.enabled)
    );
  }, [settings]);

  const clampedIndex = Math.min(activeIndex, Math.max(0, sequence.length - 1));

  // ── Tap handler ────────────────────────────────────────────────────────────
  const handleTap = useCallback(() => {
    if (!record || !settings || sequence.length === 0) return;

    // If everything is already done, just give a gentle tap response
    const isAllDone = sequence.every(k => {
      const it = settings.zikar.items.find(i => i.key === k);
      return (record.zikar[k] ?? 0) >= (it?.target ?? 33);
    });
    if (isAllDone) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      return;
    }

    const key  = sequence[clampedIndex];
    const item = settings.zikar.items.find(i => i.key === key);
    if (!item) return;

    const count  = record.zikar[key] ?? 0;
    const isLast = clampedIndex === sequence.length - 1;

    // The exact moment we hit the target — triggers transition / completion
    const willHitTarget = count + 1 === item.target;

    incrementZikar(key);

    if (willHitTarget && !isLast) {
      // ── Transition to next zikar ──────────────────────────────────────────
      // Unique, stronger haptic distinguishes this from a normal tap
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 0, duration: 170, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 290, useNativeDriver: true }),
      ]).start();
      setActiveIndex(clampedIndex + 1);

    } else if (willHitTarget && isLast) {
      // ── Final completion ──────────────────────────────────────────────────
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1.08, duration: 90,  useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1,    duration: 230, useNativeDriver: true }),
      ]).start();

    } else {
      // ── Normal tap ────────────────────────────────────────────────────────
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 0.96, duration: 55,  useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1,    duration: 110, useNativeDriver: true }),
      ]).start();
    }
  }, [record, settings, sequence, clampedIndex, incrementZikar, scaleAnim, fadeAnim]);

  // ── Reset handler ──────────────────────────────────────────────────────────
  const handleReset = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert('Reset Zikar', 'Reset all counts to zero?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset All', style: 'destructive',
        onPress: () => {
          sequence.forEach(k => resetZikar(k));
          fadeAnim.setValue(1);
          scaleAnim.setValue(1);
          setActiveIndex(0);
        },
      },
    ]);
  }, [sequence, resetZikar, fadeAnim, scaleAnim]);

  // ── Dot navigation (immediate snap, no animation carry-over) ──────────────
  const navigateToStep = useCallback((i) => {
    fadeAnim.setValue(1);
    scaleAnim.setValue(1);
    setActiveIndex(i);
  }, [fadeAnim, scaleAnim]);

  // ── Early exits ───────────────────────────────────────────────────────────
  if (!record || !settings) return null;

  if (sequence.length === 0) {
    return (
      <View style={styles.safe}>
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No zikar enabled. Enable some in Settings.</Text>
        </View>
      </View>
    );
  }

  // ── Derived display values ─────────────────────────────────────────────────
  const key    = sequence[clampedIndex];
  const item   = settings.zikar.items.find(i => i.key === key);
  const count  = record.zikar[key] ?? 0;
  const tint   = TINTS[clampedIndex % TINTS.length];
  const pct    = Math.min(count / item.target, 1);
  const isComplete = count >= item.target;

  const allDone = sequence.every(k => {
    const it = settings.zikar.items.find(i => i.key === k);
    return (record.zikar[k] ?? 0) >= (it?.target ?? 33);
  });

  return (
    <View style={styles.safe}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Zikar</Text>
          <Text style={styles.titleAr}>الذِّكْر</Text>
        </View>
        <TouchableOpacity
          onPress={handleReset}
          hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}
        >
          <Text style={styles.resetBtn}>↺ Reset</Text>
        </TouchableOpacity>
      </View>

      {/* ── Step dots ── */}
      <View style={styles.dotsRow}>
        {sequence.map((k, i) => {
          const si   = settings.zikar.items.find(si => si.key === k);
          const cnt  = record.zikar[k] ?? 0;
          const done = cnt >= (si?.target ?? 33);
          const isActive = i === clampedIndex;
          const tc = TINTS[i % 3].color;
          return (
            <TouchableOpacity
              key={k}
              onPress={() => navigateToStep(i)}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <View style={[
                styles.dot,
                isActive && { width: 28, backgroundColor: tc, borderRadius: 5 },
                !isActive && done && { backgroundColor: tc, opacity: 0.40 },
              ]} />
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── Full-screen tap area ── */}
      <Pressable style={styles.tapArea} onPress={handleTap}>
        <Animated.View style={[
          styles.inner,
          { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
        ]}>

          {allDone ? (
            /* ── Completion celebration ── */
            <View style={styles.completedBox}>
              <Text style={styles.completedStar}>✦</Text>
              <Text style={styles.completedTitle}>MashaAllah!</Text>
              <Text style={styles.completedSub}>All zikar complete for today</Text>
              <Text style={styles.completedQuote}>
                "Remember Me, and I will remember you."
              </Text>
              <Text style={styles.completedRef}>— Quran 2:152</Text>
            </View>

          ) : (
            /* ── Active zikar display ── */
            <>
              {/* Arabic in a soft halo circle */}
              <View style={[
                styles.arabicCircle,
                { backgroundColor: tint.bg, borderColor: tint.color + '50' },
              ]}>
                <Text style={styles.arabic}>{item.arabic}</Text>
              </View>

              <Text style={styles.label}>{item.label}</Text>
              <Text style={styles.meaning}>{item.meaning}</Text>

              {/* Big counter */}
              <View style={styles.countRow}>
                <Text style={[styles.count, { color: tint.color }]}>{count}</Text>
                <Text style={styles.countOf}>/{item.target}</Text>
              </View>

              {isComplete ? (
                <View style={[styles.doneBadge, { borderColor: tint.color }]}>
                  <Text style={[styles.doneText, { color: tint.color }]}>
                    {clampedIndex < sequence.length - 1
                      ? 'Complete ✓  tap to keep going'
                      : 'Complete ✓  keep going'}
                  </Text>
                </View>
              ) : (
                <Text style={styles.hint}>tap anywhere to count</Text>
              )}
            </>
          )}

        </Animated.View>
      </Pressable>

      {/* ── Progress bar (flush at bottom of tap area) ── */}
      {!allDone && (
        <View style={styles.progressTrack}>
          <View style={[
            styles.progressFill,
            { width: `${pct * 100}%`, backgroundColor: tint.color },
          ]} />
        </View>
      )}

      {/* ── Footer quote ── */}
      <Text style={styles.quote}>
        "Remember Me, and I will remember you." — Quran 2:152
      </Text>

    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.parchment },

  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyText: { fontSize: 15, color: COLORS.textMid, textAlign: 'center' },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 6,
  },
  title:    { fontSize: 26, fontWeight: '700', color: COLORS.textDark },
  titleAr:  { fontSize: 18, color: COLORS.textGold, marginTop: 1 },
  resetBtn: { fontSize: 14, color: COLORS.textLight, fontWeight: '500' },

  // Step dots
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.parchmentDeep,
  },

  // Tap area
  tapArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inner: {
    alignItems: 'center',
    paddingHorizontal: 28,
  },

  // Arabic halo
  arabicCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 22,
    shadowColor: '#8B6830',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.10,
    shadowRadius: 18,
    elevation: 3,
  },
  arabic:  { fontSize: 38, textAlign: 'center', color: COLORS.textDark, letterSpacing: 1.5, lineHeight: 52 },
  label:   { fontSize: 18, fontWeight: '700', color: COLORS.textDark, textAlign: 'center', marginBottom: 4 },
  meaning: { fontSize: 13, color: COLORS.textLight, textAlign: 'center', marginBottom: 20 },

  // Counter
  countRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
    marginBottom: 12,
  },
  count:   { fontSize: 72, fontWeight: '700', lineHeight: 80 },
  countOf: { fontSize: 20, color: COLORS.textLight, fontWeight: '400' },

  doneBadge: {
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 5,
    marginBottom: 8,
  },
  doneText: { fontSize: 13, fontWeight: '600' },
  hint:     { fontSize: 12, color: COLORS.textLight, textAlign: 'center' },

  // Progress
  progressTrack: {
    height: 4,
    backgroundColor: COLORS.parchmentDeep,
    marginHorizontal: 0,
  },
  progressFill: { height: '100%' },

  // Footer quote
  quote: {
    fontSize: 12,
    color: COLORS.textLight,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
  },

  // Completion
  completedBox: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  completedStar:  { fontSize: 44, marginBottom: 10, color: COLORS.textGold },
  completedTitle: { fontSize: 28, fontWeight: '700', color: COLORS.textDark, marginBottom: 8 },
  completedSub:   { fontSize: 15, color: COLORS.textMid, textAlign: 'center', marginBottom: 22 },
  completedQuote: { fontSize: 14, color: COLORS.textLight, fontStyle: 'italic', textAlign: 'center', marginBottom: 4 },
  completedRef:   { fontSize: 12, color: COLORS.textGold },
});
