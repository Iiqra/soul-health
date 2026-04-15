import React, { useRef } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, Animated, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useHealth } from '../context/HealthContext';
import { useSettings } from '../context/SettingsContext';
import { COLORS } from '../constants/colors';

const CARD_TINTS = [
  { color: '#7A8FA8', bg: 'rgba(122,143,168,0.07)', bar: '#7A8FA8' },
  { color: '#8A9A6A', bg: 'rgba(138,154,106,0.07)', bar: '#8A9A6A' },
  { color: '#A87A60', bg: 'rgba(168,122,96,0.07)',  bar: '#A87A60' },
];

function ZikarCard({ item, count, index, onIncrement, onReset }) {
  const tint   = CARD_TINTS[index % CARD_TINTS.length];
  const done   = count >= item.target;
  const pct    = Math.min(count / item.target, 1);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Subtle scale pulse — native thread
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.04, duration: 70,  useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1,    duration: 130, useNativeDriver: true }),
    ]).start();
    onIncrement(item.key);
  };

  const handleLongPress = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      'Reset count',
      `Reset ${item.label} to zero?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: () => onReset(item.key) },
      ]
    );
  };

  return (
    <Animated.View style={[styles.cardWrap, { transform: [{ scale: scaleAnim }] }]}>
      {/* Entire card is the tap target */}
      <TouchableOpacity
        onPress={handlePress}
        onLongPress={handleLongPress}
        activeOpacity={0.88}
        delayLongPress={600}
      >
        <View style={[styles.card, { backgroundColor: tint.bg }]}>
          {/* Reset corner button */}
          <TouchableOpacity
            style={styles.resetCorner}
            onPress={() => {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              Alert.alert('Reset', `Reset ${item.label}?`, [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Reset', style: 'destructive', onPress: () => onReset(item.key) },
              ]);
            }}
            hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
          >
            <Text style={[styles.resetIcon, { color: tint.color }]}>↺</Text>
          </TouchableOpacity>

          {/* Arabic */}
          <Text style={styles.arabic}>{item.arabic}</Text>
          <Text style={styles.label}>{item.label}</Text>
          <Text style={styles.meaning}>{item.meaning}</Text>

          {/* Count display */}
          <View style={styles.countRow}>
            <Text style={[styles.count, { color: tint.color }]}>{count}</Text>
            <Text style={styles.countOf}>/{item.target}</Text>
          </View>

          {done && (
            <View style={[styles.doneBadge, { borderColor: tint.color }]}>
              <Text style={[styles.doneText, { color: tint.color }]}>Complete ✓</Text>
            </View>
          )}

          <Text style={styles.tapHint}>{done ? 'keep going' : 'tap anywhere to count'}</Text>

          {/* Progress bar flush at bottom */}
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${pct * 100}%`, backgroundColor: tint.bar }]} />
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function ZikarScreen() {
  const { record, incrementZikar, resetZikar } = useHealth();
  const { settings } = useSettings();

  if (!record || !settings) return null;

  const enabledItems = settings.zikar.items.filter((i) => i.enabled);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <View style={styles.header}>
          <Text style={styles.title}>Zikar</Text>
          <Text style={styles.arabic2}>الذِّكْر</Text>
        </View>

        <Text style={styles.subtitle}>
          "Remember Me, and I will remember you." — Quran 2:152
        </Text>

        <View style={styles.list}>
          {enabledItems.map((item, i) => (
            <ZikarCard
              key={item.key}
              item={item}
              count={record.zikar[item.key] ?? 0}
              index={i}
              onIncrement={incrementZikar}
              onReset={resetZikar}
            />
          ))}
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: COLORS.parchment },
  scroll: { paddingHorizontal: 20 },

  header:   { alignItems: 'center', paddingTop: 20, paddingBottom: 4 },
  title:    { fontSize: 26, fontWeight: '700', color: COLORS.textDark },
  arabic2:  { fontSize: 22, color: COLORS.textGold, marginTop: 2 },
  subtitle: { fontSize: 13, color: COLORS.textMid, fontStyle: 'italic', textAlign: 'center', marginBottom: 20, paddingHorizontal: 10 },

  list: { gap: 16 },

  cardWrap: { },
  card: {
    borderRadius: 20,
    paddingTop: 20,
    paddingHorizontal: 22,
    paddingBottom: 0,           // progress bar sits flush at bottom
    borderWidth: 1,
    borderColor: 'rgba(201,169,110,0.18)',
    overflow: 'hidden',
    shadowColor: '#8B6830',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
    backgroundColor: COLORS.surface,
  },

  resetCorner: {
    position: 'absolute', top: 14, right: 16, zIndex: 10,
  },
  resetIcon: { fontSize: 20, fontWeight: '400' },

  arabic:  { fontSize: 34, textAlign: 'center', color: COLORS.textDark, letterSpacing: 1.5, lineHeight: 46, marginBottom: 2 },
  label:   { fontSize: 16, fontWeight: '600', color: COLORS.textDark, textAlign: 'center' },
  meaning: { fontSize: 12, color: COLORS.textLight, textAlign: 'center', marginBottom: 16 },

  countRow:  { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', gap: 2, marginBottom: 10 },
  count:     { fontSize: 56, fontWeight: '700', lineHeight: 64 },
  countOf:   { fontSize: 18, color: COLORS.textLight, fontWeight: '400' },

  doneBadge:  { alignSelf: 'center', borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 4, marginBottom: 8 },
  doneText:   { fontSize: 13, fontWeight: '600' },
  tapHint:    { fontSize: 11, color: COLORS.textLight, textAlign: 'center', marginBottom: 14 },

  progressTrack: { height: 4, backgroundColor: COLORS.parchmentDeep, marginTop: 0, marginHorizontal: -22 },
  progressFill:  { height: '100%' },
});
