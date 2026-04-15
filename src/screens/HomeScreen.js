import React from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle } from 'react-native-svg';
import SoulCharacter from '../components/SoulCharacter';
import ScoreRing from '../components/ScoreRing';
import ParchmentCard from '../components/ParchmentCard';
import { useHealth } from '../context/HealthContext';
import { useSettings } from '../context/SettingsContext';
import { scoreToState, computeStreak, getScoreBreakdown } from '../utils/scoreCalculator';
import { CHARACTER_STATE_LABELS } from '../constants/spiritualData';
import { COLORS } from '../constants/colors';

function GearIcon({ color = COLORS.textMid, size = 22 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M12 15a3 3 0 100-6 3 3 0 000 6z"
        stroke={color} strokeWidth={1.7} fill="none"
      />
      <Path
        d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"
        stroke={color} strokeWidth={1.7} fill="none" strokeLinecap="round" strokeLinejoin="round"
      />
    </Svg>
  );
}

export default function HomeScreen({ navigation }) {
  const { record, history, isLoading } = useHealth();
  const { settings } = useSettings();

  if (isLoading || !record || !settings) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={COLORS.gold} />
      </View>
    );
  }

  const score = record.score ?? 0;
  const state = scoreToState(score);
  const stateLabel = CHARACTER_STATE_LABELS[state];
  const streak = computeStreak(history);

  // Quick stats
  const targeted = settings.prayer.targetPrayers;
  const prayersDone = targeted.filter((k) => record.prayers[k]?.offered).length;
  const quranAmt  = record.quran?.amount ?? 0;
  const quranGoal = settings.quran.goalAmount;
  const goalLabel = settings.quran.goalType === 'ruku' ? 'ruku' : settings.quran.goalType === 'verses' ? 'ayahs' : 'pg';
  const zikarTotal = Object.values(record.zikar || {}).reduce((s, v) => s + v, 0);
  const zikarGoal  = settings.zikar.items.filter((i) => i.enabled).reduce((s, i) => s + i.target, 0);

  const breakdown = getScoreBreakdown(record, settings, history);

  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.bismillah}>بِسْمِ اللَّهِ</Text>
            <Text style={styles.date}>{dateStr}</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={styles.gearBtn}>
            <GearIcon />
          </TouchableOpacity>
        </View>

        {/* Soul Character */}
        <View style={styles.characterSection}>
          <SoulCharacter health={score} size={190} />
          <View style={styles.stateLabelRow}>
            <Text style={styles.stateEn}>{stateLabel.en}</Text>
            <Text style={styles.stateAr}>{stateLabel.ar}</Text>
          </View>
        </View>

        {/* Score ring + streak */}
        <View style={styles.ringRow}>
          <ScoreRing score={score} size={128} />
          {streak > 0 && (
            <View style={styles.streakBadge}>
              <Text style={styles.streakNum}>{streak}</Text>
              <Text style={styles.streakLabel}>day{streak !== 1 ? 's' : ''}</Text>
              <Text style={styles.streakLabel}>streak</Text>
            </View>
          )}
        </View>

        {/* Score breakdown */}
        <ParchmentCard style={styles.breakdownCard} padding={14}>
          {breakdown.map((row, i) => (
            <View key={row.label} style={[styles.breakdownRow, i < breakdown.length - 1 && styles.breakdownDivider]}>
              <Text style={styles.breakdownLabel}>{row.label}</Text>
              <View style={styles.breakdownBarWrap}>
                <View style={[styles.breakdownBar, { width: `${row.score}%` }]} />
              </View>
              <Text style={styles.breakdownPct}>{row.score}%</Text>
            </View>
          ))}
        </ParchmentCard>

        {/* Quick stats */}
        <View style={styles.statsRow}>
          <TouchableOpacity style={styles.statFlex} onPress={() => navigation.navigate('Prayers')} activeOpacity={0.8}>
            <ParchmentCard style={styles.statCard} padding={14}>
              <Text style={styles.statValue}>
                <Text style={{ color: COLORS.prayer }}>{prayersDone}</Text>
                <Text style={styles.statOf}>/{targeted.length}</Text>
              </Text>
              <Text style={styles.statName}>Prayers</Text>
            </ParchmentCard>
          </TouchableOpacity>

          <TouchableOpacity style={styles.statFlex} onPress={() => navigation.navigate('Quran')} activeOpacity={0.8}>
            <ParchmentCard style={styles.statCard} padding={14}>
              <Text style={styles.statValue}>
                <Text style={{ color: COLORS.quran }}>{quranAmt}</Text>
                <Text style={styles.statOf}>/{quranGoal} {goalLabel}</Text>
              </Text>
              <Text style={styles.statName}>Quran</Text>
            </ParchmentCard>
          </TouchableOpacity>

          <TouchableOpacity style={styles.statFlex} onPress={() => navigation.navigate('Zikar')} activeOpacity={0.8}>
            <ParchmentCard style={styles.statCard} padding={14}>
              <Text style={styles.statValue}>
                <Text style={{ color: COLORS.zikar }}>{zikarTotal}</Text>
                <Text style={styles.statOf}>/{zikarGoal}</Text>
              </Text>
              <Text style={styles.statName}>Zikar</Text>
            </ParchmentCard>
          </TouchableOpacity>
        </View>

        {/* Journey button */}
        <TouchableOpacity style={styles.journeyBtn} onPress={() => navigation.navigate('Journey')} activeOpacity={0.85}>
          <Text style={styles.journeyBtnText}>My Journey  ›</Text>
        </TouchableOpacity>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: COLORS.parchment },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.parchment },
  scroll:  { paddingHorizontal: 20, alignItems: 'center' },

  header:   { flexDirection: 'row', alignItems: 'flex-start', width: '100%', marginTop: 14, marginBottom: 4 },
  bismillah: { fontSize: 16, color: COLORS.textGold, fontWeight: '500' },
  date:      { fontSize: 12, color: COLORS.textLight, marginTop: 2 },
  gearBtn:   { padding: 6, marginTop: 2 },

  characterSection: { alignItems: 'center', marginTop: 2 },
  stateLabelRow:    { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: -6 },
  stateEn:  { fontSize: 16, color: COLORS.sage, fontWeight: '600' },
  stateAr:  { fontSize: 16, color: COLORS.textGold },

  ringRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 22, marginVertical: 14 },
  streakBadge: { backgroundColor: COLORS.goldLight, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, alignItems: 'center' },
  streakNum:   { fontSize: 26, fontWeight: '700', color: COLORS.goldDark, lineHeight: 30 },
  streakLabel: { fontSize: 11, color: COLORS.goldDark, fontWeight: '500' },

  breakdownCard: { width: '100%', marginBottom: 14 },
  breakdownRow:  { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 5 },
  breakdownDivider: { borderBottomWidth: 1, borderBottomColor: COLORS.divider },
  breakdownLabel:   { width: 56, fontSize: 12, color: COLORS.textMid },
  breakdownBarWrap: { flex: 1, height: 5, backgroundColor: COLORS.parchmentDeep, borderRadius: 3, overflow: 'hidden' },
  breakdownBar:     { height: '100%', backgroundColor: COLORS.sage, borderRadius: 3 },
  breakdownPct:     { width: 36, fontSize: 12, color: COLORS.textMid, textAlign: 'right', fontWeight: '600' },

  statsRow: { flexDirection: 'row', gap: 10, width: '100%', marginBottom: 16 },
  statFlex: { flex: 1 },
  statCard: { alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '700', lineHeight: 22 },
  statOf:    { fontSize: 11, fontWeight: '400', color: COLORS.textLight },
  statName:  { fontSize: 11, color: COLORS.textLight, marginTop: 3 },

  journeyBtn: {
    backgroundColor: COLORS.sage, borderRadius: 16, paddingVertical: 14,
    paddingHorizontal: 36, alignSelf: 'stretch', alignItems: 'center',
    shadowColor: COLORS.sageDark, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22, shadowRadius: 8, elevation: 4,
  },
  journeyBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '600', letterSpacing: 0.5 },
});
