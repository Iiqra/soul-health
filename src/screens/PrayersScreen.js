import React, { useRef, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  useWindowDimensions, Animated, Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useFocusEffect } from '@react-navigation/native';
import Svg, { Path, Circle, Line } from 'react-native-svg';
import ParchmentCard from '../components/ParchmentCard';
import { useHealth } from '../context/HealthContext';
import { useSettings } from '../context/SettingsContext';
import { PRAYERS } from '../constants/spiritualData';
import { COLORS } from '../constants/colors';
import { getCompletedPrayerReminders, markPrayerReminderComplete } from '../utils/calendarUtils';

// ─── Prayer Time Icons ────────────────────────────────────────────────────────

function PrayerIcon({ name, color, size = 26 }) {
  const s = size;
  switch (name) {
    case 'fajr':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24">
          <Path d="M 21 12.79 A 9 9 0 1 1 11.21 3 A 7 7 0 0 0 21 12.79 Z" stroke={color} strokeWidth={1.7} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <Circle cx={19} cy={5} r={1.2} fill={color} />
        </Svg>
      );
    case 'dhuhr':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24">
          <Circle cx={12} cy={12} r={4} stroke={color} strokeWidth={1.7} fill="none" />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => {
            const rad = (deg * Math.PI) / 180;
            return <Line key={i} x1={12 + Math.cos(rad) * 6} y1={12 + Math.sin(rad) * 6} x2={12 + Math.cos(rad) * 8} y2={12 + Math.sin(rad) * 8} stroke={color} strokeWidth={1.7} strokeLinecap="round" />;
          })}
        </Svg>
      );
    case 'asr':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24">
          <Circle cx={12} cy={12} r={4} stroke={color} strokeWidth={1.7} fill="none" />
          {[0, 90, 180, 270].map((deg, i) => {
            const rad = (deg * Math.PI) / 180;
            return <Line key={i} x1={12 + Math.cos(rad) * 6} y1={12 + Math.sin(rad) * 6} x2={12 + Math.cos(rad) * 8.5} y2={12 + Math.sin(rad) * 8.5} stroke={color} strokeWidth={1.7} strokeLinecap="round" />;
          })}
        </Svg>
      );
    case 'maghrib':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24">
          <Line x1={3} y1={17} x2={21} y2={17} stroke={color} strokeWidth={1.7} strokeLinecap="round" />
          <Path d="M 6 17 A 6 6 0 0 1 18 17" stroke={color} strokeWidth={1.7} fill="none" strokeLinecap="round" />
          <Line x1={12} y1={5}  x2={12}   y2={8}   stroke={color} strokeWidth={1.7} strokeLinecap="round" />
          <Line x1={6}  y1={8}  x2={7.5}  y2={10}  stroke={color} strokeWidth={1.7} strokeLinecap="round" />
          <Line x1={18} y1={8}  x2={16.5} y2={10}  stroke={color} strokeWidth={1.7} strokeLinecap="round" />
        </Svg>
      );
    case 'isha':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24">
          <Path d="M 17 18 A 6 6 0 1 1 17 6 A 4 4 0 1 0 17 18 Z" stroke={color} strokeWidth={1.7} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    default:
      return null;
  }
}

// ─── Slider Toggle ────────────────────────────────────────────────────────────
// A pill slides between two options with a colour crossfade + haptics.
// value: true = optA, false = optB, null = unselected.
// Tap the active option again to deselect.

const TRACK_W = 178;
const PILL_W  = 87;  // (TRACK_W - 2*2) / 2
const PILL_H  = 34;
const TRACK_H = 38;
const TRACK_R = TRACK_H / 2;
const PILL_R  = PILL_H / 2;

function SliderToggle({ optA, optB, colorA = COLORS.sage, colorB = '#9A7060', value, onChange }) {
  const anim       = useRef(new Animated.Value(value === false ? 1 : 0)).current;
  const [hasPill, setHasPill] = useRefState(value != null);

  // Sync when value resets externally (prayer un-offered clears details)
  useEffect(() => {
    if (value == null) { setHasPill(false); return; }
    setHasPill(true);
    Animated.spring(anim, { toValue: value === false ? 1 : 0, useNativeDriver: true, friction: 7, tension: 130 }).start();
  }, [value]);

  const handlePress = (isA) => {
    const alreadyA = value === true;
    const alreadyB = value === false;
    if ((isA && alreadyA) || (!isA && alreadyB)) {
      // Tap active side → deselect
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setHasPill(false);
      onChange(null);
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setHasPill(true);
    Animated.spring(anim, { toValue: isA ? 0 : 1, useNativeDriver: true, friction: 6, tension: 140 }).start();
    onChange(isA ? true : false);
  };

  const tx   = anim.interpolate({ inputRange: [0, 1], outputRange: [0, PILL_W] });
  // Crossfade colour layers inside the pill
  const opA  = anim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });
  const opB  = anim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });

  const isA = value === true;
  const isB = value === false;

  return (
    <View style={sl.track}>
      {/* Sliding pill */}
      {hasPill && (
        <Animated.View style={[sl.pill, { transform: [{ translateX: tx }] }]}>
          <Animated.View style={[StyleSheet.absoluteFill, { borderRadius: PILL_R, backgroundColor: colorA, opacity: opA }]} />
          <Animated.View style={[StyleSheet.absoluteFill, { borderRadius: PILL_R, backgroundColor: colorB, opacity: opB }]} />
        </Animated.View>
      )}
      {/* Option A */}
      <TouchableOpacity style={sl.half} onPress={() => handlePress(true)} activeOpacity={0.8}>
        <Text style={[sl.optText, isA && sl.optTextActive]}>{optA}</Text>
      </TouchableOpacity>
      {/* Option B */}
      <TouchableOpacity style={sl.half} onPress={() => handlePress(false)} activeOpacity={0.8}>
        <Text style={[sl.optText, isB && sl.optTextActive]}>{optB}</Text>
      </TouchableOpacity>
    </View>
  );
}

// Tiny helper so hasPill can be both a ref (no re-render flicker) and trigger re-render
function useRefState(initial) {
  const [state, setState] = React.useState(initial);
  return [state, setState];
}

const sl = StyleSheet.create({
  track: {
    width: TRACK_W,
    height: TRACK_H,
    borderRadius: TRACK_R,
    backgroundColor: COLORS.parchmentDeep,
    flexDirection: 'row',
    padding: 2,
    overflow: 'hidden',
  },
  pill: {
    position: 'absolute',
    top: 2,
    left: 2,
    width: PILL_W,
    height: PILL_H,
    borderRadius: PILL_R,
    overflow: 'hidden',
  },
  half: {
    width: PILL_W,
    height: PILL_H,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  optText:      { fontSize: 12, fontWeight: '600', color: COLORS.textMid },
  optTextActive:{ color: 'white', fontWeight: '700' },
});

// ─── Single Chip (Dua / Sunnah — no opposing option) ─────────────────────────

function SingleChip({ label, active, onPress }) {
  return (
    <TouchableOpacity
      style={[sc.chip, active && sc.chipActive]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={[sc.text, active && sc.textActive]}>{label}</Text>
    </TouchableOpacity>
  );
}
const sc = StyleSheet.create({
  chip:       { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 14, borderWidth: 1.5, borderColor: COLORS.gold },
  chipActive: { backgroundColor: COLORS.sage, borderColor: COLORS.sage },
  text:       { fontSize: 12, color: COLORS.textMid, fontWeight: '500' },
  textActive: { color: 'white' },
});

// ─── Progress Bar ─────────────────────────────────────────────────────────────

function ProgressBar({ done, total }) {
  const pct = total > 0 ? done / total : 0;
  return (
    <View style={pb.track}>
      <View style={[pb.fill, { width: `${pct * 100}%` }]} />
    </View>
  );
}
const pb = StyleSheet.create({
  track: { height: 5, backgroundColor: COLORS.parchmentDeep, borderRadius: 3, overflow: 'hidden' },
  fill:  { height: '100%', backgroundColor: COLORS.sage, borderRadius: 3 },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function PrayersScreen() {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const { record, setPrayerOffered, setPrayerDetail } = useHealth();
  const { settings } = useSettings();

  // ── Sync completed reminders → app on every screen focus ──────────────────
  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== 'ios') return;
      (async () => {
        try {
          const completed = await getCompletedPrayerReminders();
          for (const [prayerKey, isDone] of Object.entries(completed)) {
            // Only auto-mark as offered — never auto-unmark (user may have reasons)
            if (isDone && !record?.prayers?.[prayerKey]?.offered) {
              setPrayerOffered(prayerKey, true);
            }
          }
        } catch { /* permission not granted or no reminders — silent */ }
      })();
    }, [record])
  );

  if (!record || !settings) return null;

  const ps = settings.prayer;
  const targeted = PRAYERS.filter((p) => ps.targetPrayers.includes(p.key));
  const done = targeted.filter((p) => record.prayers[p.key]?.offered).length;

  const handleToggleOffered = async (key) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const nowOffered = !record.prayers[key]?.offered;
    setPrayerOffered(key, nowOffered);
    // Keep reminder in sync with app state
    markPrayerReminderComplete(key, nowOffered).catch(() => {});
  };

  return (
    <View style={styles.safe}>
      <ScrollView
        contentContainerStyle={[styles.scroll, isTablet && { maxWidth: 600, alignSelf: 'center', width: '100%' }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Prayers</Text>
          <Text style={styles.arabic}>الصَّلَاة</Text>
        </View>

        {/* Progress summary */}
        <ParchmentCard style={styles.progressCard} padding={16}>
          <View style={styles.progressRow}>
            <Text style={styles.progressText}>{done} of {targeted.length} prayers complete</Text>
            <Text style={[styles.progressNum, done === targeted.length && styles.progressDone]}>
              {done}/{targeted.length}
            </Text>
          </View>
          <ProgressBar done={done} total={targeted.length} />
        </ParchmentCard>

        {/* Prayer list */}
        <View style={styles.list}>
          {targeted.map((prayer) => {
            const pr = record.prayers[prayer.key] || {};
            const isOffered = !!pr.offered;
            const hasAnyDetail = ps.trackOnTime || ps.trackCongregation || ps.trackDuaAfter || ps.trackSunnah;
            const showDetails = isOffered && hasAnyDetail;

            const congregationValue = pr.congregation === 'jamat'
              ? true
              : pr.congregation === 'alone'
              ? false
              : null;

            return (
              <ParchmentCard
                key={prayer.key}
                style={[styles.prayerCard, isOffered && styles.prayerDone]}
                padding={0}
              >
                {/* Main tap row */}
                <TouchableOpacity
                  onPress={() => handleToggleOffered(prayer.key)}
                  activeOpacity={0.75}
                  style={styles.prayerRow}
                >
                  <PrayerIcon name={prayer.key} color={isOffered ? COLORS.sage : COLORS.textLight} size={26} />
                  <View style={styles.prayerInfo}>
                    <Text style={[styles.prayerName, isOffered && styles.prayerNameDone]}>
                      {prayer.name}
                    </Text>
                    <Text style={styles.prayerTime}>{prayer.arabic}  ·  {prayer.time}</Text>
                  </View>
                  <View style={[styles.checkbox, isOffered && styles.checkboxDone]}>
                    {isOffered && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                </TouchableOpacity>

                {/* Detail section — shown after prayer is marked offered */}
                {showDetails && (
                  <View style={styles.chipsContainer}>

                    {/* Row 1: sliding pill toggles */}
                    {(ps.trackOnTime || ps.trackCongregation) && (
                      <View style={styles.togglesRow}>
                        {ps.trackOnTime && (
                          <View style={styles.toggleGroup}>
                            <Text style={styles.toggleLabel}>Timing</Text>
                            <SliderToggle
                              optA="On Time"
                              optB="Qaza"
                              colorA={COLORS.sage}
                              colorB="#C87858"
                              value={pr.onTime}
                              onChange={(v) => setPrayerDetail(prayer.key, 'onTime', v)}
                            />
                          </View>
                        )}
                        {ps.trackCongregation && (
                          <View style={styles.toggleGroup}>
                            <Text style={styles.toggleLabel}>Congregation</Text>
                            <SliderToggle
                              optA="Jamat"
                              optB="Alone"
                              colorA="#6888C8"
                              colorB="#9068B8"
                              value={congregationValue}
                              onChange={(v) =>
                                setPrayerDetail(
                                  prayer.key, 'congregation',
                                  v === true ? 'jamat' : v === false ? 'alone' : null
                                )
                              }
                            />
                          </View>
                        )}
                      </View>
                    )}

                    {/* Row 2: single-state chips — always on their own row below */}
                    {(ps.trackDuaAfter || ps.trackSunnah) && (
                      <View style={styles.chipsRow}>
                        {ps.trackDuaAfter && (
                          <SingleChip
                            label="Dua ✓"
                            active={!!pr.duaAfter}
                            onPress={() => setPrayerDetail(prayer.key, 'duaAfter', !pr.duaAfter)}
                          />
                        )}
                        {ps.trackSunnah && (
                          <SingleChip
                            label="Sunnah ✓"
                            active={!!pr.sunnah}
                            onPress={() => setPrayerDetail(prayer.key, 'sunnah', !pr.sunnah)}
                          />
                        )}
                      </View>
                    )}

                  </View>
                )}
              </ParchmentCard>
            );
          })}
        </View>

        {done === targeted.length && targeted.length > 0 && (
          <View style={styles.completeBanner}>
            <Text style={styles.completeBannerText}>All prayers completed today</Text>
            <Text style={styles.completeBannerAr}>بَارَكَ اللَّهُ فِيكَ</Text>
          </View>
        )}

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: COLORS.parchment },
  scroll: { paddingHorizontal: 20 },

  header:  { alignItems: 'center', paddingTop: 20, paddingBottom: 14 },
  title:   { fontSize: 26, fontWeight: '700', color: COLORS.textDark },
  arabic:  { fontSize: 22, color: COLORS.textGold, marginTop: 2 },

  progressCard: { marginBottom: 18 },
  progressRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  progressText: { fontSize: 14, color: COLORS.textMid },
  progressNum:  { fontSize: 18, fontWeight: '700', color: COLORS.sage },
  progressDone: { color: COLORS.sageDark },

  list: { gap: 10 },

  prayerCard: { marginBottom: 0 },
  prayerDone: { borderColor: 'rgba(107,143,113,0.35)', backgroundColor: 'rgba(107,143,113,0.05)' },

  prayerRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 14 },
  prayerInfo:     { flex: 1 },
  prayerName:     { fontSize: 16, fontWeight: '600', color: COLORS.textDark },
  prayerNameDone: { color: COLORS.sage },
  prayerTime:     { fontSize: 12, color: COLORS.textLight, marginTop: 2 },

  checkbox:     { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: COLORS.gold, justifyContent: 'center', alignItems: 'center' },
  checkboxDone: { backgroundColor: COLORS.sage, borderColor: COLORS.sage },
  checkmark:    { color: 'white', fontSize: 13, fontWeight: '700' },

  chipsContainer: {
    flexDirection: 'column', gap: 10,
    paddingHorizontal: 16, paddingBottom: 16,
    borderTopWidth: 1, borderTopColor: COLORS.divider,
    paddingTop: 12,
  },
  togglesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chipsRow:   { flexDirection: 'row', gap: 8, alignItems: 'center' },
  toggleGroup: { gap: 4 },
  toggleLabel: { fontSize: 10, fontWeight: '600', color: COLORS.textLight, textTransform: 'uppercase', letterSpacing: 0.5, marginLeft: 2 },

  completeBanner: {
    marginTop: 20, alignItems: 'center', paddingVertical: 18,
    backgroundColor: 'rgba(107,143,113,0.10)', borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(107,143,113,0.25)',
  },
  completeBannerText: { fontSize: 15, fontWeight: '600', color: COLORS.sage },
  completeBannerAr:   { fontSize: 18, color: COLORS.textGold, marginTop: 4 },
});
