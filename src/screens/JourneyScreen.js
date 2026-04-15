import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import Svg, { Rect, Text as SvgText, Line } from 'react-native-svg';
import ParchmentCard from '../components/ParchmentCard';
import { useHealth } from '../context/HealthContext';
import { scoreToState, computeStreak } from '../utils/scoreCalculator';
import { CHARACTER_STATE_LABELS } from '../constants/spiritualData';
import { COLORS } from '../constants/colors';

const STATE_COLORS = {
  withered: '#9A9A9A',
  struggling: '#A89068',
  neutral: COLORS.sage,
  glowing: COLORS.gold,
  radiant: COLORS.goldBright,
};

function WeekChart({ history }) {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    const record = history.find((r) => r.date === key);
    days.push({
      label: d.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 2),
      score: record ? record.score : 0,
      date: key,
      isToday: i === 0,
    });
  }

  const chartW = 280;
  const chartH = 110;
  const barW   = 28;
  const gap    = (chartW - barW * 7) / 8;

  return (
    <Svg width={chartW} height={chartH + 20} viewBox={`0 0 ${chartW} ${chartH + 20}`}>
      <Line x1={0} y1={chartH} x2={chartW} y2={chartH} stroke={COLORS.divider} strokeWidth={1} />
      {days.map((day, i) => {
        const x     = gap + i * (barW + gap);
        const barH  = (day.score / 100) * (chartH - 10);
        const y     = chartH - barH;
        const state = scoreToState(day.score);
        const color = day.score === 0 ? COLORS.parchmentDeep : STATE_COLORS[state];
        return (
          <React.Fragment key={day.date}>
            <Rect
              x={x} y={y} width={barW} height={Math.max(barH, 3)} rx={6}
              fill={color} opacity={day.isToday ? 1 : 0.7}
              stroke={day.isToday ? COLORS.gold : 'none'}
              strokeWidth={day.isToday ? 2 : 0}
            />
            <SvgText
              x={x + barW / 2} y={chartH + 16}
              textAnchor="middle" fontSize={10}
              fill={day.isToday ? COLORS.sage : COLORS.textLight}
              fontWeight={day.isToday ? 'bold' : 'normal'}
            >
              {day.label}
            </SvgText>
          </React.Fragment>
        );
      })}
    </Svg>
  );
}

function HistoryRow({ record }) {
  const state = scoreToState(record.score);
  const label = CHARACTER_STATE_LABELS[state];

  // Handle new schema (prayer values are objects) and old schema (booleans)
  const prayersDone = Object.values(record.prayers || {}).filter((p) =>
    typeof p === 'object' ? p?.offered === true : p === true
  ).length;

  const d = new Date(record.date + 'T00:00:00');
  const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <View style={hr.row}>
      <View style={[hr.dot, { backgroundColor: STATE_COLORS[state] }]} />
      <View style={hr.info}>
        <Text style={hr.date}>{dateStr}</Text>
        <Text style={hr.state}>{label.en}</Text>
      </View>
      <View style={hr.stats}>
        <Text style={hr.stat}>🕌 {prayersDone} prayers</Text>
        <Text style={hr.stat}>
          📖 {record.quran?.pagesRead ?? record.quran?.amount ?? 0} pg
        </Text>
      </View>
      <View style={[hr.badge, { backgroundColor: STATE_COLORS[state] + '22' }]}>
        <Text style={[hr.badgeNum, { color: STATE_COLORS[state] }]}>{record.score}</Text>
      </View>
    </View>
  );
}
const hr = StyleSheet.create({
  row:      { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: COLORS.divider },
  dot:      { width: 10, height: 10, borderRadius: 5 },
  info:     { flex: 1 },
  date:     { fontSize: 13, fontWeight: '600', color: COLORS.textDark },
  state:    { fontSize: 11, color: COLORS.textLight, marginTop: 1 },
  stats:    { gap: 2 },
  stat:     { fontSize: 11, color: COLORS.textMid },
  badge:    { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  badgeNum: { fontSize: 15, fontWeight: '700' },
});

export default function JourneyScreen({ navigation }) {
  const { history } = useHealth();
  const streak = computeStreak(history);

  return (
    <View style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>‹ Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>My Journey</Text>
          <View style={{ width: 60 }} />
        </View>

        {streak > 0 && (
          <ParchmentCard style={styles.streakCard} padding={18}>
            <Text style={styles.streakLabel}>Current Streak</Text>
            <Text style={styles.streakNum}>{streak} day{streak !== 1 ? 's' : ''}</Text>
            <Text style={styles.streakSub}>Consistency is worship.</Text>
          </ParchmentCard>
        )}

        <ParchmentCard style={styles.chartCard} padding={20}>
          <Text style={styles.sectionTitle}>Last 7 Days</Text>
          {history.length > 0 ? (
            <WeekChart history={history} />
          ) : (
            <Text style={styles.emptyText}>Start tracking to see your progress here.</Text>
          )}
        </ParchmentCard>

        <ParchmentCard style={styles.historyCard} padding={16}>
          <Text style={styles.sectionTitle}>History</Text>
          {history.length === 0 ? (
            <Text style={styles.emptyText}>No history yet. Keep tracking daily!</Text>
          ) : (
            history.slice(0, 30).map((r) => <HistoryRow key={r.date} record={r} />)
          )}
        </ParchmentCard>

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: COLORS.parchment },
  scroll: { paddingHorizontal: 20 },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 16, paddingBottom: 16 },
  backBtn:  { width: 60 },
  backText: { fontSize: 17, color: COLORS.sage, fontWeight: '500' },
  title:    { fontSize: 22, fontWeight: '700', color: COLORS.textDark },

  streakCard: { marginBottom: 16, alignItems: 'center' },
  streakLabel: { fontSize: 13, color: COLORS.textMid },
  streakNum:   { fontSize: 40, fontWeight: '700', color: COLORS.gold, lineHeight: 48 },
  streakSub:   { fontSize: 12, color: COLORS.textMid, fontStyle: 'italic', marginTop: 2 },

  chartCard:    { marginBottom: 16, alignItems: 'center' },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: COLORS.textDark, marginBottom: 14 },
  emptyText:    { fontSize: 13, color: COLORS.textLight, fontStyle: 'italic', textAlign: 'center' },

  historyCard: { marginBottom: 16 },
});
