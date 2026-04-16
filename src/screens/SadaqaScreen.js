import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  Modal, TextInput, Alert, useWindowDimensions,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import Svg, { Path, Circle } from 'react-native-svg';
import ParchmentCard from '../components/ParchmentCard';
import { useHealth } from '../context/HealthContext';
import { useSettings } from '../context/SettingsContext';
import { COLORS } from '../constants/colors';
import { SADAQA_TYPES, SADAQA_RECIPIENTS } from '../constants/spiritualData';
import { computeSadaqaScore } from '../utils/scoreCalculator';

function SadaqaIcon({ size = 52 }) {
  const color = COLORS.gold;
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Path
        d="M 10 32 C 10 28 8 24 8 20 C 8 17 10 16 13 17 L 13 22"
        stroke={color} strokeWidth={2} fill="none" strokeLinecap="round"
      />
      <Path d="M 13 17 C 13 14 15 13 17 14 L 17 20" stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" />
      <Path d="M 17 14 C 17 11 19 10 21 12 L 21 20" stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" />
      <Path
        d="M 21 12 C 21 10 24 9 25 12 L 25 20 L 34 16 C 37 15 39 18 37 21 L 28 30 C 26 32 22 34 18 34 L 10 34 L 10 32"
        stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round"
      />
      <Circle cx={30} cy={14} r={6} stroke={color} strokeWidth={2} fill="none" />
    </Svg>
  );
}

// ─── Chip component ───────────────────────────────────────────────────────────

function ChipSelect({ options, value, onSelect }) {
  return (
    <View style={cs.row}>
      {options.map((o) => (
        <TouchableOpacity
          key={o.key}
          style={[cs.chip, value === o.key && cs.chipActive]}
          onPress={() => onSelect(o.key)}
        >
          <Text style={[cs.text, value === o.key && cs.textActive]}>
            {o.icon ? `${o.icon} ` : ''}{o.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
const cs = StyleSheet.create({
  row:        { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip:       { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, borderWidth: 1.5, borderColor: COLORS.gold },
  chipActive: { backgroundColor: COLORS.sage, borderColor: COLORS.sage },
  text:       { fontSize: 12, color: COLORS.textMid, fontWeight: '500' },
  textActive: { color: 'white' },
});

// ─── Add Entry Modal ──────────────────────────────────────────────────────────

function AddEntryModal({ visible, onClose, onAdd }) {
  const [type, setType] = useState('money');
  const [recipient, setRecipient] = useState('poor');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  const handleAdd = () => {
    onAdd({ type, recipient, amount: amount.trim(), note: note.trim() });
    setType('money');
    setRecipient('poor');
    setAmount('');
    setNote('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent presentationStyle="overFullScreen">
      <View style={modal.overlay}>
        <View style={modal.sheet}>
          <View style={modal.handle} />
          <Text style={modal.title}>Record Sadaqa</Text>
          <Text style={modal.arabic}>الصَّدَقَة</Text>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={modal.sectionLabel}>Type of giving</Text>
            <ChipSelect options={SADAQA_TYPES} value={type} onSelect={setType} />

            <Text style={modal.sectionLabel}>Given to</Text>
            <ChipSelect options={SADAQA_RECIPIENTS} value={recipient} onSelect={setRecipient} />

            <Text style={modal.sectionLabel}>Amount (optional)</Text>
            <TextInput
              style={modal.input}
              value={amount}
              onChangeText={setAmount}
              placeholder="e.g. 20, a meal, one hour..."
              placeholderTextColor={COLORS.textLight}
              returnKeyType="done"
            />

            <Text style={modal.sectionLabel}>Note (optional)</Text>
            <TextInput
              style={[modal.input, modal.inputMulti]}
              value={note}
              onChangeText={setNote}
              placeholder="Any details you'd like to remember..."
              placeholderTextColor={COLORS.textLight}
              multiline
              numberOfLines={3}
              returnKeyType="done"
            />

            <View style={modal.btnRow}>
              <TouchableOpacity style={modal.cancelBtn} onPress={onClose}>
                <Text style={modal.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={modal.addBtn} onPress={handleAdd}>
                <Text style={modal.addText}>Record</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
const modal = StyleSheet.create({
  overlay:  { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(58,48,53,0.45)' },
  sheet:    { backgroundColor: COLORS.parchment, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, maxHeight: '90%' },
  handle:   { width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.parchmentDeep, alignSelf: 'center', marginBottom: 16 },
  title:    { fontSize: 22, fontWeight: '700', color: COLORS.textDark, textAlign: 'center' },
  arabic:   { fontSize: 18, color: COLORS.textGold, textAlign: 'center', marginTop: 2, marginBottom: 20 },
  sectionLabel: { fontSize: 11, color: COLORS.textLight, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8, marginTop: 16 },
  input:    { backgroundColor: COLORS.parchmentDark, borderRadius: 12, padding: 12, fontSize: 14, color: COLORS.textDark, borderWidth: 1, borderColor: COLORS.divider },
  inputMulti: { height: 80, textAlignVertical: 'top' },
  btnRow:   { flexDirection: 'row', gap: 12, marginTop: 24 },
  cancelBtn:{ flex: 1, paddingVertical: 14, borderRadius: 14, backgroundColor: COLORS.parchmentDeep, alignItems: 'center' },
  cancelText:{ fontSize: 15, color: COLORS.textMid, fontWeight: '500' },
  addBtn:   { flex: 2, paddingVertical: 14, borderRadius: 14, backgroundColor: COLORS.sage, alignItems: 'center' },
  addText:  { fontSize: 15, color: 'white', fontWeight: '700' },
});

// ─── Entry Row ────────────────────────────────────────────────────────────────

function EntryRow({ entry, onDelete }) {
  const typeObj = SADAQA_TYPES.find((t) => t.key === entry.type) ?? SADAQA_TYPES[5];
  const recipientObj = SADAQA_RECIPIENTS.find((r) => r.key === entry.recipient) ?? SADAQA_RECIPIENTS[6];

  return (
    <View style={er.row}>
      <View style={er.iconWrap}>
        <Text style={er.icon}>{typeObj.icon}</Text>
      </View>
      <View style={er.info}>
        <Text style={er.main}>{typeObj.label} → {recipientObj.label}</Text>
        {!!entry.amount && <Text style={er.sub}>{entry.amount}</Text>}
        {!!entry.note   && <Text style={er.note}>{entry.note}</Text>}
      </View>
      <TouchableOpacity onPress={onDelete} style={er.deleteBtn}>
        <Text style={er.deleteText}>✕</Text>
      </TouchableOpacity>
    </View>
  );
}
const er = StyleSheet.create({
  row:       { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.divider },
  iconWrap:  { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(201,169,110,0.12)', justifyContent: 'center', alignItems: 'center' },
  icon:      { fontSize: 18 },
  info:      { flex: 1 },
  main:      { fontSize: 14, fontWeight: '600', color: COLORS.textDark },
  sub:       { fontSize: 12, color: COLORS.textMid, marginTop: 2 },
  note:      { fontSize: 12, color: COLORS.textLight, marginTop: 2, fontStyle: 'italic' },
  deleteBtn: { padding: 4 },
  deleteText:{ fontSize: 14, color: COLORS.textLight },
});

// ─── Weekly dot grid ──────────────────────────────────────────────────────────

function WeekDots({ history, todayEntries }) {
  const dots = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    const rec = history.find((r) => r.date === key);
    const done = i === 0
      ? (todayEntries?.length ?? 0) > 0
      : (rec?.sadaqa?.entries?.length ?? 0) > 0;
    const isToday = i === 0;
    dots.push({ key, done, isToday, label: d.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 1) });
  }
  return (
    <View style={wd.row}>
      {dots.map((dot) => (
        <View key={dot.key} style={wd.col}>
          <View style={[wd.dot, dot.done && wd.dotDone, dot.isToday && wd.dotToday]} />
          <Text style={[wd.label, dot.isToday && wd.labelToday]}>{dot.label}</Text>
        </View>
      ))}
    </View>
  );
}
const wd = StyleSheet.create({
  row:        { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 8 },
  col:        { alignItems: 'center', gap: 4 },
  dot:        { width: 14, height: 14, borderRadius: 7, backgroundColor: COLORS.parchmentDeep, borderWidth: 1.5, borderColor: COLORS.divider },
  dotDone:    { backgroundColor: COLORS.gold, borderColor: COLORS.goldDark },
  dotToday:   { borderColor: COLORS.sage },
  label:      { fontSize: 10, color: COLORS.textLight },
  labelToday: { color: COLORS.sage, fontWeight: '600' },
});

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function SadaqaScreen() {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const { record, history, addSadaqaEntry, deleteSadaqaEntry } = useHealth();
  const { settings } = useSettings();
  const [showModal, setShowModal] = useState(false);

  if (!record || !settings) return null;

  if (!settings.sadaqa.enabled) {
    return (
      <View style={styles.safe}>
        <View style={styles.disabledWrap}>
          <SadaqaIcon size={72} />
          <Text style={styles.disabledTitle}>Sadaqa not enabled</Text>
          <Text style={styles.disabledSub}>Enable it from Settings to start tracking your acts of giving.</Text>
        </View>
      </View>
    );
  }

  const entries = record.sadaqa?.entries ?? [];
  const freq    = settings.sadaqa.frequency;
  const score   = computeSadaqaScore(record.sadaqa, settings.sadaqa, history);

  const handleDelete = (id) => {
    Alert.alert('Remove Entry', 'Remove this sadaqa entry?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => deleteSadaqaEntry(id) },
    ]);
  };

  const handleAdd = async (entry) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    addSadaqaEntry(entry);
  };

  return (
    <View style={styles.safe}>
      <ScrollView contentContainerStyle={[styles.scroll, isTablet && { maxWidth: 600, alignSelf: 'center', width: '100%' }]} showsVerticalScrollIndicator={false}>

        <View style={styles.header}>
          <Text style={styles.title}>Sadaqa</Text>
          <Text style={styles.arabic}>الصَّدَقَة</Text>
        </View>

        <Text style={styles.verse}>
          "The believer's shade on the Day of Resurrection will be his charity." — Hadith
        </Text>

        {/* Score chip */}
        <View style={styles.scoreRow}>
          <View style={[styles.scoreChip, { backgroundColor: entries.length > 0 ? 'rgba(201,169,110,0.15)' : COLORS.parchmentDeep }]}>
            <Text style={[styles.scoreNum, { color: entries.length > 0 ? COLORS.goldDark : COLORS.textLight }]}>
              {score}%
            </Text>
            <Text style={[styles.scoreLabel, { color: entries.length > 0 ? COLORS.goldDark : COLORS.textLight }]}>
              of {freq} goal
            </Text>
          </View>
          <SadaqaIcon size={48} />
        </View>

        {/* Entry list */}
        <ParchmentCard style={styles.entriesCard} padding={16}>
          <View style={styles.entriesHeader}>
            <Text style={styles.entriesTitle}>
              Today{entries.length > 0 ? ` · ${entries.length}` : ''}
            </Text>
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => setShowModal(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.addBtnText}>+ Add</Text>
            </TouchableOpacity>
          </View>

          {entries.length === 0 ? (
            <Text style={styles.emptyText}>
              No entries yet. Tap "Add" to record an act of giving.
            </Text>
          ) : (
            entries.map((e) => (
              <EntryRow key={e.id} entry={e} onDelete={() => handleDelete(e.id)} />
            ))
          )}
        </ParchmentCard>

        {/* Weekly dots */}
        {freq === 'weekly' && (
          <ParchmentCard style={styles.weekCard} padding={16}>
            <Text style={styles.weekTitle}>This Week</Text>
            <WeekDots history={history} todayEntries={entries} />
          </ParchmentCard>
        )}

        <Text style={styles.freqNote}>
          Goal: give sadaqa at least once {freq === 'daily' ? 'every day' : freq === 'weekly' ? 'per week' : 'per month'}.
        </Text>

        <View style={{ height: 30 }} />
      </ScrollView>

      <AddEntryModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onAdd={handleAdd}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: COLORS.parchment },
  scroll: { paddingHorizontal: 20 },

  header:  { alignItems: 'center', paddingTop: 20, paddingBottom: 8 },
  title:   { fontSize: 26, fontWeight: '700', color: COLORS.textDark },
  arabic:  { fontSize: 22, color: COLORS.textGold, marginTop: 2 },
  verse:   { fontSize: 13, color: COLORS.textMid, fontStyle: 'italic', textAlign: 'center', marginBottom: 16, lineHeight: 20 },

  scoreRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20, marginBottom: 16 },
  scoreChip: { borderRadius: 18, paddingHorizontal: 20, paddingVertical: 12, alignItems: 'center' },
  scoreNum:  { fontSize: 32, fontWeight: '700', lineHeight: 36 },
  scoreLabel:{ fontSize: 12, marginTop: 2, fontWeight: '500' },

  entriesCard:   { marginBottom: 16 },
  entriesHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  entriesTitle:  { fontSize: 14, fontWeight: '600', color: COLORS.textDark },
  addBtn:        { backgroundColor: COLORS.sage, paddingHorizontal: 16, paddingVertical: 7, borderRadius: 14 },
  addBtnText:    { color: 'white', fontSize: 13, fontWeight: '600' },
  emptyText:     { fontSize: 13, color: COLORS.textLight, fontStyle: 'italic', textAlign: 'center', paddingVertical: 16 },

  weekCard:  { marginBottom: 16 },
  weekTitle: { fontSize: 13, color: COLORS.textLight, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },
  freqNote:  { fontSize: 12, color: COLORS.textLight, textAlign: 'center', fontStyle: 'italic' },

  disabledWrap:  { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  disabledTitle: { fontSize: 20, fontWeight: '600', color: COLORS.textMid, marginTop: 20 },
  disabledSub:   { fontSize: 14, color: COLORS.textLight, textAlign: 'center', marginTop: 8, lineHeight: 20 },
});
