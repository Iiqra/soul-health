import React, { useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, Pressable, Animated, Alert,
  TouchableOpacity, useWindowDimensions,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useHealth } from '../context/HealthContext';
import { useSettings } from '../context/SettingsContext';
import { COLORS } from '../constants/colors';

const TINTS = [
  { color: '#8B76D6', bg: 'rgba(139,118,214,0.11)' },
  { color: '#68A880', bg: 'rgba(104,168,128,0.11)' },
  { color: '#C868A8', bg: 'rgba(200,104,168,0.11)' },
  { color: '#6888C8', bg: 'rgba(104,136,200,0.11)' },
  { color: '#F0906A', bg: 'rgba(240,144,106,0.11)' },
  { color: '#9068C8', bg: 'rgba(144,104,200,0.11)' },
];

export default function ZikarScreen({ route, navigation }) {
  const zikarKey = route?.params?.zikarKey;

  const { record, incrementZikar, resetZikar } = useHealth();
  const { settings } = useSettings();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim  = useRef(new Animated.Value(1)).current;

  const item = settings?.zikar?.items?.find(i => i.key === zikarKey);

  // Pick a stable tint based on position in items array
  const itemIndex = settings?.zikar?.items?.findIndex(i => i.key === zikarKey) ?? 0;
  const tint = TINTS[Math.max(itemIndex, 0) % TINTS.length];

  const count      = record?.zikar?.[zikarKey] ?? 0;
  const pct        = item ? Math.min(count / item.target, 1) : 0;
  const isComplete = item ? count >= item.target : false;

  // ── Tap ────────────────────────────────────────────────────────────────────
  const handleTap = useCallback(() => {
    if (!record || !item) return;

    const willHitTarget = count + 1 === item.target;
    incrementZikar(zikarKey);

    if (willHitTarget) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1.07, duration: 90,  useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1,    duration: 230, useNativeDriver: true }),
      ]).start();
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 0.96, duration: 55,  useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1,    duration: 110, useNativeDriver: true }),
      ]).start();
    }
  }, [record, item, count, zikarKey, incrementZikar, scaleAnim]);

  // ── Reset ──────────────────────────────────────────────────────────────────
  const handleReset = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert('Reset', `Reset ${item?.label ?? 'zikar'} count to zero?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset', style: 'destructive',
        onPress: () => {
          resetZikar(zikarKey);
          scaleAnim.setValue(1);
          fadeAnim.setValue(1);
        },
      },
    ]);
  }, [item, zikarKey, resetZikar, scaleAnim, fadeAnim]);

  if (!record || !settings || !item) return null;

  const circleSize = isTablet ? 240 : 200;

  return (
    <View style={styles.safe}>

      {/* ── Header ── */}
      <View style={[styles.header, isTablet && { maxWidth: 600, alignSelf: 'center', width: '100%' }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}
        >
          <Text style={styles.backArrow}>‹</Text>
          <Text style={styles.backLabel}>All Zikar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleReset}
          hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}
        >
          <Text style={styles.resetBtn}>↺ Reset</Text>
        </TouchableOpacity>
      </View>

      {/* ── Full-screen tap area ── */}
      <Pressable
        style={[styles.tapArea, isTablet && { maxWidth: 600, alignSelf: 'center', width: '100%' }]}
        onPress={handleTap}
      >
        <Animated.View style={[styles.inner, { transform: [{ scale: scaleAnim }] }]}>

          {isComplete && count >= item.target ? (
            /* ── Completion state ── */
            <View style={styles.completedBox}>
              <Text style={styles.completedStar}>✦</Text>
              <Text style={styles.completedTitle}>MashaAllah!</Text>
              <Text style={[styles.completedSub, { color: tint.color }]}>{item.label} complete</Text>
              <View style={[styles.arabicCircle, { backgroundColor: tint.bg, borderColor: tint.color + '50', width: circleSize, height: circleSize, borderRadius: circleSize / 2, marginTop: 20 }]}>
                <Text style={styles.arabic}>{item.arabic}</Text>
              </View>
              <View style={styles.countRow}>
                <Text style={[styles.count, { color: tint.color }]}>{count}</Text>
                <Text style={styles.countOf}>/{item.target}</Text>
              </View>
              <Text style={styles.hint}>tap to continue</Text>
            </View>
          ) : (
            /* ── Active counter ── */
            <>
              {/* Arabic halo circle */}
              <View style={[
                styles.arabicCircle,
                {
                  backgroundColor: tint.bg,
                  borderColor: tint.color + '50',
                  width: circleSize,
                  height: circleSize,
                  borderRadius: circleSize / 2,
                },
              ]}>
                <Text style={[styles.arabic, isTablet && { fontSize: 46 }]}>{item.arabic}</Text>
              </View>

              <Text style={[styles.label, isTablet && { fontSize: 22 }]}>{item.label}</Text>
              <Text style={styles.meaning}>{item.meaning}</Text>

              {/* Counter */}
              <View style={styles.countRow}>
                <Text style={[styles.count, { color: tint.color }, isTablet && { fontSize: 88 }]}>{count}</Text>
                <Text style={styles.countOf}>/{item.target}</Text>
              </View>

              <Text style={styles.hint}>tap anywhere to count</Text>
            </>
          )}
        </Animated.View>
      </Pressable>

      {/* ── Progress bar ── */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${pct * 100}%`, backgroundColor: tint.color }]} />
      </View>

      {/* ── Footer quote ── */}
      <Text style={[styles.quote, isTablet && { maxWidth: 600, alignSelf: 'center' }]}>
        "Remember Me, and I will remember you." — Quran 2:152
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.parchment },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingTop: 14,
    paddingBottom: 6,
  },
  backBtn:   { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backArrow: { fontSize: 26, color: COLORS.sage, lineHeight: 28, fontWeight: '300' },
  backLabel: { fontSize: 14, color: COLORS.sage, fontWeight: '600' },
  resetBtn:  { fontSize: 14, color: COLORS.textLight, fontWeight: '500' },

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

  // Arabic halo (size set inline)
  arabicCircle: {
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 22,
    shadowColor: '#4A3AAA',
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
  hint:    { fontSize: 12, color: COLORS.textLight, textAlign: 'center' },

  // Completion
  completedBox:  { alignItems: 'center', paddingHorizontal: 20 },
  completedStar: { fontSize: 44, marginBottom: 6, color: COLORS.sage },
  completedTitle:{ fontSize: 28, fontWeight: '700', color: COLORS.textDark, marginBottom: 4 },
  completedSub:  { fontSize: 15, fontWeight: '600', textAlign: 'center' },

  // Progress
  progressTrack: { height: 4, backgroundColor: COLORS.parchmentDeep },
  progressFill:  { height: '100%' },

  // Footer
  quote: {
    fontSize: 12,
    color: COLORS.textLight,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
});
