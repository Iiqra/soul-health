import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import Svg, { Path, Circle, Line, Ellipse } from 'react-native-svg';
import ParchmentCard from '../components/ParchmentCard';
import { useHealth } from '../context/HealthContext';
import { useSettings } from '../context/SettingsContext';
import { PRAYERS } from '../constants/spiritualData';
import { COLORS } from '../constants/colors';

// ─── Prayer Time Icons (clean native SVG) ─────────────────────────────────────

function PrayerIcon({ name, color, size = 26 }) {
  const s = size;
  switch (name) {
    case 'fajr':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24">
          {/* Crescent moon */}
          <Path
            d="M 21 12.79 A 9 9 0 1 1 11.21 3 A 7 7 0 0 0 21 12.79 Z"
            stroke={color} strokeWidth={1.7} fill="none" strokeLinecap="round" strokeLinejoin="round"
          />
          {/* Star dot */}
          <Circle cx={19} cy={5} r={1.2} fill={color} />
        </Svg>
      );
    case 'dhuhr':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24">
          <Circle cx={12} cy={12} r={4} stroke={color} strokeWidth={1.7} fill="none" />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => {
            const rad = (deg * Math.PI) / 180;
            const x1 = 12 + Math.cos(rad) * 6;
            const y1 = 12 + Math.sin(rad) * 6;
            const x2 = 12 + Math.cos(rad) * 8;
            const y2 = 12 + Math.sin(rad) * 8;
            return <Line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={1.7} strokeLinecap="round" />;
          })}
        </Svg>
      );
    case 'asr':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24">
          <Circle cx={12} cy={12} r={4} stroke={color} strokeWidth={1.7} fill="none" />
          {[0, 90, 180, 270].map((deg, i) => {
            const rad = (deg * Math.PI) / 180;
            const x1 = 12 + Math.cos(rad) * 6;
            const y1 = 12 + Math.sin(rad) * 6;
            const x2 = 12 + Math.cos(rad) * 8.5;
            const y2 = 12 + Math.sin(rad) * 8.5;
            return <Line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={1.7} strokeLinecap="round" />;
          })}
        </Svg>
      );
    case 'maghrib':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24">
          {/* Horizon line */}
          <Line x1={3} y1={17} x2={21} y2={17} stroke={color} strokeWidth={1.7} strokeLinecap="round" />
          {/* Setting semi-circle */}
          <Path
            d="M 6 17 A 6 6 0 0 1 18 17"
            stroke={color} strokeWidth={1.7} fill="none" strokeLinecap="round"
          />
          {/* Rays above */}
          <Line x1={12} y1={5} x2={12} y2={8}   stroke={color} strokeWidth={1.7} strokeLinecap="round" />
          <Line x1={6}  y1={8} x2={7.5} y2={10} stroke={color} strokeWidth={1.7} strokeLinecap="round" />
          <Line x1={18} y1={8} x2={16.5} y2={10} stroke={color} strokeWidth={1.7} strokeLinecap="round" />
        </Svg>
      );
    case 'isha':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24">
          {/* Crescent (fuller/lower) */}
          <Path
            d="M 17 18 A 6 6 0 1 1 17 6 A 4 4 0 1 0 17 18 Z"
            stroke={color} strokeWidth={1.7} fill="none" strokeLinecap="round" strokeLinejoin="round"
          />
        </Svg>
      );
    default:
      return null;
  }
}

// ─── Toggle Chip ──────────────────────────────────────────────────────────────

function ToggleChip({ optA, optB, value, onChange }) {
  // value: true = optA, false = optB, null = neither
  return (
    <View style={tc.row}>
      <TouchableOpacity
        style={[tc.chip, value === true && tc.chipActive]}
        onPress={() => onChange(value === true ? null : true)}
      >
        <Text style={[tc.text, value === true && tc.textActive]}>{optA}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[tc.chip, value === false && tc.chipAlt]}
        onPress={() => onChange(value === false ? null : false)}
      >
        <Text style={[tc.text, value === false && tc.textActive]}>{optB}</Text>
      </TouchableOpacity>
    </View>
  );
}
function SingleChip({ label, active, onPress }) {
  return (
    <TouchableOpacity style={[tc.chip, active && tc.chipActive]} onPress={onPress}>
      <Text style={[tc.text, active && tc.textActive]}>{label}</Text>
    </TouchableOpacity>
  );
}
const tc = StyleSheet.create({
  row:       { flexDirection: 'row', gap: 6 },
  chip:      { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 14, borderWidth: 1, borderColor: COLORS.gold },
  chipActive: { backgroundColor: COLORS.sage, borderColor: COLORS.sage },
  chipAlt:    { backgroundColor: '#9A7060', borderColor: '#9A7060' },
  text:      { fontSize: 12, color: COLORS.textMid, fontWeight: '500' },
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
  const { record, setPrayerOffered, setPrayerDetail } = useHealth();
  const { settings } = useSettings();

  if (!record || !settings) return null;

  const ps = settings.prayer;
  const targeted = PRAYERS.filter((p) => ps.targetPrayers.includes(p.key));
  const done = targeted.filter((p) => record.prayers[p.key]?.offered).length;

  const handleToggleOffered = async (key) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPrayerOffered(key, !record.prayers[key]?.offered);
  };

  return (
    <View style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

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
            const showDetails =
              isOffered &&
              (ps.trackOnTime || ps.trackCongregation || ps.trackDuaAfter || ps.trackSunnah);

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

                {/* Detail chips (only when offered + settings enabled) */}
                {showDetails && (
                  <View style={styles.chipsContainer}>
                    {ps.trackOnTime && (
                      <ToggleChip
                        optA="On time"
                        optB="Qaza"
                        value={pr.onTime}
                        onChange={(v) => setPrayerDetail(prayer.key, 'onTime', v)}
                      />
                    )}
                    {ps.trackCongregation && (
                      <ToggleChip
                        optA="Jamat"
                        optB="Alone"
                        value={pr.congregation === 'jamat' ? true : pr.congregation === 'alone' ? false : null}
                        onChange={(v) => setPrayerDetail(
                          prayer.key, 'congregation',
                          v === true ? 'jamat' : v === false ? 'alone' : null
                        )}
                      />
                    )}
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

  prayerRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 14,
  },
  prayerInfo: { flex: 1 },
  prayerName: { fontSize: 16, fontWeight: '600', color: COLORS.textDark },
  prayerNameDone: { color: COLORS.sage },
  prayerTime: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },

  checkbox:     { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: COLORS.gold, justifyContent: 'center', alignItems: 'center' },
  checkboxDone: { backgroundColor: COLORS.sage, borderColor: COLORS.sage },
  checkmark:    { color: 'white', fontSize: 13, fontWeight: '700' },

  chipsContainer: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8,
    paddingHorizontal: 16, paddingBottom: 14,
    borderTopWidth: 1, borderTopColor: COLORS.divider,
    paddingTop: 10,
  },

  completeBanner: {
    marginTop: 20, alignItems: 'center', paddingVertical: 18,
    backgroundColor: 'rgba(107,143,113,0.10)', borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(107,143,113,0.25)',
  },
  completeBannerText: { fontSize: 15, fontWeight: '600', color: COLORS.sage },
  completeBannerAr:   { fontSize: 18, color: COLORS.textGold, marginTop: 4 },
});
