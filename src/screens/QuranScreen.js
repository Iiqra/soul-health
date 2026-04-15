import React, { useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  Modal, FlatList, TextInput,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import Svg, { Path, Line } from 'react-native-svg';
import ParchmentCard from '../components/ParchmentCard';
import { useHealth } from '../context/HealthContext';
import { useSettings } from '../context/SettingsContext';
import { useQuranBookmark } from '../context/QuranBookmarkContext';
import { COLORS } from '../constants/colors';
import { MOTIVATIONAL_VERSES, QURAN_GOAL_TYPES } from '../constants/spiritualData';
import { SURAH_LIST } from '../constants/surahList';

function OpenBook({ color }) {
  return (
    <Svg width={64} height={48} viewBox="0 0 64 48">
      <Path d="M32 8 C22 6 10 7 6 10 L6 42 C10 40 22 39 32 40 Z" fill={color} opacity={0.15} />
      <Path d="M32 8 C22 6 10 7 6 10 L6 42 C10 40 22 39 32 40 Z" stroke={color} strokeWidth={1.5} fill="none" />
      <Path d="M32 8 C42 6 54 7 58 10 L58 42 C54 40 42 39 32 40 Z" fill={color} opacity={0.15} />
      <Path d="M32 8 C42 6 54 7 58 10 L58 42 C54 40 42 39 32 40 Z" stroke={color} strokeWidth={1.5} fill="none" />
      <Path d="M32 8 L32 40" stroke={color} strokeWidth={1.5} />
      <Line x1={14} y1={18} x2={28} y2={17} stroke={color} strokeWidth={1} opacity={0.4} />
      <Line x1={14} y1={24} x2={28} y2={23} stroke={color} strokeWidth={1} opacity={0.4} />
      <Line x1={14} y1={30} x2={28} y2={29} stroke={color} strokeWidth={1} opacity={0.4} />
      <Line x1={36} y1={18} x2={50} y2={17} stroke={color} strokeWidth={1} opacity={0.4} />
      <Line x1={36} y1={24} x2={50} y2={23} stroke={color} strokeWidth={1} opacity={0.4} />
      <Line x1={36} y1={30} x2={50} y2={29} stroke={color} strokeWidth={1} opacity={0.4} />
    </Svg>
  );
}

function ProgressBar({ value, goal }) {
  const pct = goal > 0 ? Math.min(value / goal, 1) : 0;
  return (
    <View style={pb.track}>
      <View style={[pb.fill, { width: `${pct * 100}%` }]} />
    </View>
  );
}
const pb = StyleSheet.create({
  track: { height: 6, backgroundColor: COLORS.parchmentDeep, borderRadius: 3, overflow: 'hidden' },
  fill:  { height: '100%', backgroundColor: COLORS.quran, borderRadius: 3 },
});

// ─── Surah Picker Modal ────────────────────────────────────────────────────────

function SurahPickerModal({ visible, selectedSurah, onSelect, onClose }) {
  const [search, setSearch] = useState('');
  const filtered = search.trim()
    ? SURAH_LIST.filter(
        (s) =>
          s.englishName.toLowerCase().includes(search.toLowerCase()) ||
          s.arabicName.includes(search) ||
          String(s.number).includes(search)
      )
    : SURAH_LIST;

  return (
    <Modal visible={visible} animationType="slide" transparent presentationStyle="overFullScreen">
      <View style={sp.overlay}>
        <View style={sp.sheet}>
          <View style={sp.handle} />
          <Text style={sp.title}>Select Surah</Text>
          <TextInput
            style={sp.search}
            value={search}
            onChangeText={setSearch}
            placeholder="Search surah..."
            placeholderTextColor={COLORS.textLight}
            clearButtonMode="while-editing"
          />
          <FlatList
            data={filtered}
            keyExtractor={(item) => String(item.number)}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[sp.item, selectedSurah?.number === item.number && sp.itemActive]}
                onPress={() => { onSelect(item); onClose(); }}
              >
                <View style={sp.numBadge}>
                  <Text style={sp.numText}>{item.number}</Text>
                </View>
                <View style={sp.itemInfo}>
                  <Text style={sp.itemEn}>{item.englishName}</Text>
                  <Text style={sp.itemSub}>{item.ayahCount} ayahs</Text>
                </View>
                <Text style={sp.itemAr}>{item.arabicName}</Text>
              </TouchableOpacity>
            )}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          />
          <TouchableOpacity style={sp.closeBtn} onPress={onClose}>
            <Text style={sp.closeBtnText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
const sp = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(58,48,53,0.45)' },
  sheet:   { backgroundColor: COLORS.parchment, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 30, maxHeight: '85%' },
  handle:  { width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.parchmentDeep, alignSelf: 'center', marginBottom: 14 },
  title:   { fontSize: 20, fontWeight: '700', color: COLORS.textDark, marginBottom: 12, textAlign: 'center' },
  search:  { backgroundColor: COLORS.parchmentDark, borderRadius: 12, padding: 10, fontSize: 14, color: COLORS.textDark, marginBottom: 12, borderWidth: 1, borderColor: COLORS.divider },
  item:    { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.divider, gap: 12 },
  itemActive: { backgroundColor: 'rgba(107,143,113,0.08)', marginHorizontal: -4, paddingHorizontal: 4, borderRadius: 10 },
  numBadge:{ width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.parchmentDeep, justifyContent: 'center', alignItems: 'center' },
  numText: { fontSize: 12, fontWeight: '700', color: COLORS.textMid },
  itemInfo:{ flex: 1 },
  itemEn:  { fontSize: 14, fontWeight: '600', color: COLORS.textDark },
  itemSub: { fontSize: 11, color: COLORS.textLight, marginTop: 1 },
  itemAr:  { fontSize: 16, color: COLORS.textGold },
  closeBtn:{ marginTop: 12, paddingVertical: 14, backgroundColor: COLORS.parchmentDeep, borderRadius: 14, alignItems: 'center' },
  closeBtnText: { fontSize: 15, color: COLORS.textMid, fontWeight: '500' },
});

// ─── Bookmark Card ─────────────────────────────────────────────────────────────

function BookmarkCard({ bookmark, onUpdateBookmark, onRemoveBookmark }) {
  const [showSurahPicker, setShowSurahPicker] = useState(false);
  const [editingAyah, setEditingAyah] = useState(false);
  const [ayahInput, setAyahInput] = useState('');
  const [noteInput, setNoteInput] = useState('');
  const [editingNote, setEditingNote] = useState(false);

  const selectedSurah = bookmark
    ? SURAH_LIST.find((s) => s.number === bookmark.surahNumber)
    : null;

  const handleSelectSurah = (surah) => {
    const maxAyah = surah.ayahCount;
    const currentAyah = bookmark?.ayahNumber ?? 1;
    onUpdateBookmark({
      surahNumber: surah.number,
      surahName: surah.englishName,
      surahArabic: surah.arabicName,
      ayahNumber: Math.min(currentAyah, maxAyah),
      note: bookmark?.note ?? '',
    });
  };

  const handleAyahSave = () => {
    const num = parseInt(ayahInput, 10);
    const maxAyah = selectedSurah?.ayahCount ?? 999;
    if (!isNaN(num) && num >= 1 && num <= maxAyah) {
      onUpdateBookmark({ ...bookmark, ayahNumber: num });
    }
    setEditingAyah(false);
  };

  const handleNoteSave = () => {
    onUpdateBookmark({ ...bookmark, note: noteInput.trim() });
    setEditingNote(false);
  };

  return (
    <ParchmentCard style={bk.card} padding={16}>
      <View style={bk.header}>
        <Text style={bk.title}>Where I Left Off</Text>
        {bookmark && (
          <TouchableOpacity onPress={onRemoveBookmark}>
            <Text style={bk.clearBtn}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      {bookmark ? (
        <>
          {/* Surah row */}
          <TouchableOpacity style={bk.surahRow} onPress={() => setShowSurahPicker(true)} activeOpacity={0.75}>
            <View style={bk.surahInfo}>
              <Text style={bk.surahEn}>{bookmark.surahName}</Text>
              <Text style={bk.surahAr}>{bookmark.surahArabic}</Text>
            </View>
            <Text style={bk.changeChip}>Change ›</Text>
          </TouchableOpacity>

          {/* Ayah row */}
          <View style={bk.ayahRow}>
            <Text style={bk.ayahLabel}>Ayah</Text>
            {editingAyah ? (
              <View style={bk.ayahEditRow}>
                <TextInput
                  style={bk.ayahInput}
                  value={ayahInput}
                  onChangeText={setAyahInput}
                  keyboardType="numeric"
                  returnKeyType="done"
                  onSubmitEditing={handleAyahSave}
                  autoFocus
                />
                <TouchableOpacity style={bk.saveMiniBtn} onPress={handleAyahSave}>
                  <Text style={bk.saveMiniText}>Save</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity onPress={() => { setAyahInput(String(bookmark.ayahNumber ?? 1)); setEditingAyah(true); }}>
                <Text style={bk.ayahNum}>{bookmark.ayahNumber ?? 1} <Text style={bk.ayahOf}>of {selectedSurah?.ayahCount}</Text></Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Note row */}
          {editingNote ? (
            <View style={bk.noteEditWrap}>
              <TextInput
                style={bk.noteInput}
                value={noteInput}
                onChangeText={setNoteInput}
                placeholder="Add a note..."
                placeholderTextColor={COLORS.textLight}
                multiline
                autoFocus
              />
              <TouchableOpacity style={bk.saveMiniBtn} onPress={handleNoteSave}>
                <Text style={bk.saveMiniText}>Save</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => { setNoteInput(bookmark.note ?? ''); setEditingNote(true); }}
              style={bk.noteTap}
            >
              <Text style={bookmark.note ? bk.noteText : bk.notePlaceholder}>
                {bookmark.note || 'Tap to add a note...'}
              </Text>
            </TouchableOpacity>
          )}
        </>
      ) : (
        <TouchableOpacity style={bk.setBtn} onPress={() => setShowSurahPicker(true)}>
          <Text style={bk.setBtnText}>📖  Set my place in the Quran</Text>
        </TouchableOpacity>
      )}

      <SurahPickerModal
        visible={showSurahPicker}
        selectedSurah={selectedSurah}
        onSelect={handleSelectSurah}
        onClose={() => setShowSurahPicker(false)}
      />
    </ParchmentCard>
  );
}
const bk = StyleSheet.create({
  card:       { marginBottom: 14 },
  header:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  title:      { fontSize: 14, fontWeight: '600', color: COLORS.textDark },
  clearBtn:   { fontSize: 13, color: COLORS.textLight },
  surahRow:   { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.parchmentDark, borderRadius: 12, padding: 12, marginBottom: 10 },
  surahInfo:  { flex: 1 },
  surahEn:    { fontSize: 16, fontWeight: '700', color: COLORS.textDark },
  surahAr:    { fontSize: 14, color: COLORS.textGold, marginTop: 2 },
  changeChip: { fontSize: 13, color: COLORS.sage, fontWeight: '500' },
  ayahRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.divider },
  ayahLabel:  { fontSize: 13, color: COLORS.textLight, fontWeight: '500' },
  ayahEditRow:{ flexDirection: 'row', alignItems: 'center', gap: 8 },
  ayahInput:  { width: 60, borderWidth: 1, borderColor: COLORS.gold, borderRadius: 8, padding: 6, fontSize: 15, color: COLORS.textDark, textAlign: 'center' },
  ayahNum:    { fontSize: 18, fontWeight: '700', color: COLORS.quran },
  ayahOf:     { fontSize: 12, fontWeight: '400', color: COLORS.textLight },
  saveMiniBtn:{ backgroundColor: COLORS.sage, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  saveMiniText:{ fontSize: 12, color: 'white', fontWeight: '600' },
  noteTap:    { marginTop: 8 },
  noteText:   { fontSize: 13, color: COLORS.textMid, fontStyle: 'italic', lineHeight: 18 },
  notePlaceholder: { fontSize: 13, color: COLORS.textLight, fontStyle: 'italic' },
  noteEditWrap: { marginTop: 8, gap: 6 },
  noteInput:  { borderWidth: 1, borderColor: COLORS.divider, borderRadius: 10, padding: 10, fontSize: 13, color: COLORS.textDark, minHeight: 60, textAlignVertical: 'top' },
  setBtn:     { paddingVertical: 14, backgroundColor: COLORS.parchmentDark, borderRadius: 14, alignItems: 'center', borderWidth: 1, borderColor: COLORS.divider },
  setBtnText: { fontSize: 15, color: COLORS.textMid, fontWeight: '500' },
});

// ─── Main screen ───────────────────────────────────────────────────────────────

export default function QuranScreen() {
  const { record, setQuranAmount } = useHealth();
  const { settings, updateSettings } = useSettings();
  const { bookmark, updateBookmark, removeBookmark } = useQuranBookmark();
  const holdTimer = useRef(null);
  const holdInterval = useRef(null);

  if (!record || !settings) return null;

  const amount    = record.quran?.amount ?? 0;
  const goalAmount = settings.quran.goalAmount;
  const goalType   = settings.quran.goalType;
  const goalLabel  = QURAN_GOAL_TYPES.find((t) => t.key === goalType)?.label ?? 'pages';
  const verse      = MOTIVATIONAL_VERSES[new Date().getDate() % MOTIVATIONAL_VERSES.length];

  const startHold = (delta) => {
    holdTimer.current = setTimeout(() => {
      holdInterval.current = setInterval(() => {
        setQuranAmount(Math.max(0, amount + delta));
      }, 120);
    }, 500);
  };
  const stopHold = () => {
    clearTimeout(holdTimer.current);
    clearInterval(holdInterval.current);
  };

  const StepBtn = ({ delta }) => (
    <TouchableOpacity
      style={styles.stepBtn}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setQuranAmount(amount + delta);
      }}
      onLongPress={() => startHold(delta)}
      onPressOut={stopHold}
      delayLongPress={400}
      activeOpacity={0.7}
    >
      <Text style={styles.stepBtnText}>{delta > 0 ? '+' : '−'}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <View style={styles.header}>
          <Text style={styles.title}>Quran</Text>
          <Text style={styles.arabic}>الْقُرْآن</Text>
        </View>

        <View style={styles.bookRow}><OpenBook color={COLORS.quran} /></View>

        {/* Amount counter */}
        <ParchmentCard style={styles.counterCard} padding={24}>
          <Text style={styles.counterLabel}>
            {goalLabel.charAt(0).toUpperCase() + goalLabel.slice(1)} Read Today
          </Text>
          <View style={styles.counterRow}>
            <StepBtn delta={-1} />
            <View style={styles.countDisplay}>
              <Text style={styles.countNum}>{amount}</Text>
              <Text style={styles.countGoal}>of {goalAmount} {goalLabel}</Text>
            </View>
            <StepBtn delta={1} />
          </View>
          <ProgressBar value={amount} goal={goalAmount} />
          <Text style={styles.progressLabel}>
            {amount >= goalAmount
              ? 'Daily goal reached!'
              : `${goalAmount - amount} ${goalLabel} remaining`}
          </Text>
        </ParchmentCard>

        {/* Bookmark */}
        <BookmarkCard
          bookmark={bookmark}
          onUpdateBookmark={updateBookmark}
          onRemoveBookmark={removeBookmark}
        />

        {/* Goal settings */}
        <ParchmentCard style={styles.goalCard} padding={16}>
          <Text style={styles.goalTitle}>Daily Goal</Text>
          <View style={styles.chipRow}>
            {QURAN_GOAL_TYPES.map((t) => (
              <TouchableOpacity
                key={t.key}
                style={[styles.typeChip, goalType === t.key && styles.typeChipActive]}
                onPress={() => updateSettings({ quran: { goalType: t.key } })}
              >
                <Text style={[styles.typeChipText, goalType === t.key && styles.typeChipTextActive]}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.goalAmountRow}>
            <TouchableOpacity
              style={styles.stepBtn}
              onPress={() => updateSettings({ quran: { goalAmount: Math.max(1, goalAmount - 1) } })}
            >
              <Text style={styles.stepBtnText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.goalNum}>{goalAmount} {goalLabel}/day</Text>
            <TouchableOpacity
              style={styles.stepBtn}
              onPress={() => updateSettings({ quran: { goalAmount: goalAmount + 1 } })}
            >
              <Text style={styles.stepBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        </ParchmentCard>

        {/* Verse */}
        <ParchmentCard style={styles.verseCard} padding={18}>
          <Text style={styles.verseText}>{verse}</Text>
        </ParchmentCard>

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: COLORS.parchment },
  scroll: { paddingHorizontal: 20 },

  header:  { alignItems: 'center', paddingTop: 20, paddingBottom: 8 },
  title:   { fontSize: 26, fontWeight: '700', color: COLORS.textDark },
  arabic:  { fontSize: 22, color: COLORS.textGold, marginTop: 2 },

  bookRow: { alignItems: 'center', marginVertical: 12 },

  counterCard: { marginBottom: 14 },
  counterLabel: { textAlign: 'center', fontSize: 13, color: COLORS.textMid, marginBottom: 14, textTransform: 'uppercase', letterSpacing: 0.5 },
  counterRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 24, marginBottom: 20 },

  stepBtn:     { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.parchmentDeep, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(201,169,110,0.3)' },
  stepBtnText: { fontSize: 24, color: COLORS.textDark, fontWeight: '300', lineHeight: 28 },

  countDisplay: { alignItems: 'center', minWidth: 80 },
  countNum:     { fontSize: 56, fontWeight: '700', color: COLORS.quran, lineHeight: 62 },
  countGoal:    { fontSize: 13, color: COLORS.textLight },
  progressLabel: { textAlign: 'center', fontSize: 13, color: COLORS.textMid, marginTop: 10 },

  goalCard:       { marginBottom: 14 },
  goalTitle:      { fontSize: 13, color: COLORS.textLight, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },
  chipRow:        { flexDirection: 'row', gap: 10, marginBottom: 14 },
  typeChip:       { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 16, borderWidth: 1.5, borderColor: COLORS.gold },
  typeChipActive: { backgroundColor: COLORS.sage, borderColor: COLORS.sage },
  typeChipText:   { fontSize: 13, color: COLORS.textMid, fontWeight: '500' },
  typeChipTextActive: { color: 'white' },
  goalAmountRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 18 },
  goalNum:        { fontSize: 17, fontWeight: '600', color: COLORS.textDark, minWidth: 110, textAlign: 'center' },

  verseCard: { backgroundColor: 'rgba(201,169,110,0.07)' },
  verseText: { fontSize: 13, color: COLORS.textMid, lineHeight: 20, fontStyle: 'italic', textAlign: 'center' },
});
