import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, Switch, Alert,
  ActivityIndicator, useWindowDimensions, Modal, TextInput, FlatList,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import * as Location from 'expo-location';
import ParchmentCard from '../components/ParchmentCard';
import { useSettings } from '../context/SettingsContext';
import { clearAllData } from '../storage/healthStorage';
import {
  PRAYERS, AZKAR_CATALOG, QURAN_GOAL_TYPES, SADAQA_FREQUENCIES, AZAN_CALCULATION_METHODS,
} from '../constants/spiritualData';
import { COLORS } from '../constants/colors';
import { computeWeights } from '../utils/scoreCalculator';
import { scheduleAzanNotifications, requestNotificationPermission } from '../utils/prayerTimes';
import { addPrayerTimesAsReminders } from '../utils/calendarUtils';

// ─── Shared primitives ────────────────────────────────────────────────────────

function Section({ title, children }) {
  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>{title}</Text>
      <ParchmentCard padding={16}>{children}</ParchmentCard>
    </View>
  );
}
const s = StyleSheet.create({
  section:      { marginBottom: 20 },
  sectionTitle: { fontSize: 12, color: COLORS.textLight, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8, marginLeft: 4 },
});

function Divider() {
  return <View style={{ height: 1, backgroundColor: COLORS.divider, marginVertical: 8 }} />;
}

function RowSwitch({ label, sub, value, onToggle }) {
  return (
    <View style={rs.row}>
      <View style={{ flex: 1 }}>
        <Text style={rs.label}>{label}</Text>
        {sub ? <Text style={rs.sub}>{sub}</Text> : null}
      </View>
      <Switch value={value} onValueChange={onToggle} trackColor={{ false: COLORS.parchmentDeep, true: COLORS.sage }} thumbColor={COLORS.white} />
    </View>
  );
}
const rs = StyleSheet.create({
  row:   { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  label: { fontSize: 15, color: COLORS.textDark, fontWeight: '500' },
  sub:   { fontSize: 12, color: COLORS.textLight, marginTop: 2 },
});

function ChipGroup({ options, value, onSelect }) {
  return (
    <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
      {options.map((opt) => (
        <TouchableOpacity key={opt.key} style={[cg.chip, value === opt.key && cg.chipActive]} onPress={() => onSelect(opt.key)}>
          <Text style={[cg.text, value === opt.key && cg.textActive]}>{opt.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
const cg = StyleSheet.create({
  chip:       { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 16, borderWidth: 1.5, borderColor: COLORS.gold },
  chipActive: { backgroundColor: COLORS.sage, borderColor: COLORS.sage },
  text:       { fontSize: 13, color: COLORS.textMid, fontWeight: '500' },
  textActive: { color: 'white' },
});

function MiniStepper({ value, onChange, min = 1 }) {
  return (
    <View style={ms.row}>
      <TouchableOpacity style={ms.btn} onPress={() => onChange(Math.max(min, value - 1))}>
        <Text style={ms.btnText}>−</Text>
      </TouchableOpacity>
      <Text style={ms.val}>{value}</Text>
      <TouchableOpacity style={ms.btn} onPress={() => onChange(value + 1)}>
        <Text style={ms.btnText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}
const ms = StyleSheet.create({
  row:    { flexDirection: 'row', alignItems: 'center', gap: 10 },
  btn:    { width: 30, height: 30, borderRadius: 15, backgroundColor: COLORS.parchmentDeep, justifyContent: 'center', alignItems: 'center' },
  btnText:{ fontSize: 17, color: COLORS.textDark, fontWeight: '400' },
  val:    { fontSize: 16, fontWeight: '700', color: COLORS.textDark, minWidth: 28, textAlign: 'center' },
});

// ─── Goal row inside the Goals card ──────────────────────────────────────────

function GoalLabel({ label, weight }) {
  return (
    <View style={gl.row}>
      <Text style={gl.label}>{label}</Text>
      {weight != null && (
        <Text style={gl.weight}>{Math.round(weight * 100)}%</Text>
      )}
    </View>
  );
}
const gl = StyleSheet.create({
  row:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  label:  { fontSize: 13, fontWeight: '700', color: COLORS.textDark, textTransform: 'uppercase', letterSpacing: 0.4 },
  weight: { fontSize: 12, fontWeight: '600', color: COLORS.sage, backgroundColor: 'rgba(139,118,214,0.10)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
});

// ─── Prayer target chips ──────────────────────────────────────────────────────

function PrayerChips({ targetPrayers, onToggle }) {
  return (
    <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
      {PRAYERS.map((p) => {
        const active = targetPrayers.includes(p.key);
        return (
          <TouchableOpacity
            key={p.key}
            style={[pc.chip, active && pc.chipActive]}
            onPress={() => onToggle(p.key)}
          >
            <Text style={[pc.name, active && pc.nameActive]}>{p.name}</Text>
            <Text style={[pc.ar, active && pc.arActive]}>{p.arabic}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
const pc = StyleSheet.create({
  chip:       { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 14, borderWidth: 1.5, borderColor: COLORS.gold, alignItems: 'center' },
  chipActive: { backgroundColor: COLORS.sage, borderColor: COLORS.sage },
  name:       { fontSize: 12, fontWeight: '600', color: COLORS.textMid },
  nameActive: { color: 'white' },
  ar:         { fontSize: 11, color: COLORS.textLight, marginTop: 1 },
  arActive:   { color: 'rgba(255,255,255,0.8)' },
});

// ─── Zikar item row (inside Goals card) ──────────────────────────────────────

function ZikarGoalRow({ item, onToggle, onChangeTarget, onRemove, isLast }) {
  return (
    <View>
      <View style={zr.row}>
        <View style={{ flex: 1 }}>
          <Text style={zr.label}>{item.label}</Text>
          {item.arabic ? <Text style={zr.arabic}>{item.arabic}</Text> : null}
        </View>
        <View style={zr.controls}>
          {item.enabled && (
            <MiniStepper value={item.target} onChange={(v) => onChangeTarget(item.key, v)} />
          )}
          <Switch
            value={item.enabled}
            onValueChange={() => onToggle(item.key)}
            trackColor={{ false: COLORS.parchmentDeep, true: COLORS.sage }}
            thumbColor={COLORS.white}
          />
          {onRemove && (
            <TouchableOpacity onPress={() => onRemove(item.key)} style={zr.removeBtn}>
              <Text style={zr.removeBtnText}>×</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}
const zr = StyleSheet.create({
  row:          { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  label:        { fontSize: 14, fontWeight: '600', color: COLORS.textDark },
  arabic:       { fontSize: 13, color: COLORS.textLight, marginTop: 1 },
  controls:     { flexDirection: 'row', alignItems: 'center', gap: 8 },
  removeBtn:    { width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(200,90,90,0.12)', justifyContent: 'center', alignItems: 'center' },
  removeBtnText:{ fontSize: 15, color: '#C85A5A', lineHeight: 20 },
});

// ─── Add Zikar Modal ──────────────────────────────────────────────────────────

function AddZikarModal({ visible, currentKeys, onAdd, onClose }) {
  const [mode, setMode]               = useState('catalog');
  const [customName, setCustomName]   = useState('');
  const [customArabic, setCustomArabic] = useState('');
  const [customTarget, setCustomTarget] = useState(33);

  const available = AZKAR_CATALOG.filter((z) => !currentKeys.includes(z.key));

  const addFromCatalog = (item) => {
    onAdd({ key: item.key, label: item.label, arabic: item.arabic, meaning: item.meaning, target: item.defaultTarget, enabled: true });
    onClose();
  };

  const addCustom = () => {
    if (!customName.trim()) return;
    onAdd({ key: `custom_${Date.now()}`, label: customName.trim(), arabic: customArabic.trim(), target: customTarget, enabled: true, isCustom: true });
    setCustomName(''); setCustomArabic(''); setCustomTarget(33);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={az.container}>
          <View style={az.header}>
            <Text style={az.title}>Add Zikar</Text>
            <TouchableOpacity onPress={onClose}><Text style={az.done}>Done</Text></TouchableOpacity>
          </View>

          <View style={az.tabs}>
            {['catalog', 'custom'].map((t) => (
              <TouchableOpacity key={t} style={[az.tab, mode === t && az.tabActive]} onPress={() => setMode(t)}>
                <Text style={[az.tabText, mode === t && az.tabTextActive]}>{t === 'catalog' ? 'From Catalog' : 'Custom'}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {mode === 'catalog' ? (
            <FlatList
              data={available}
              keyExtractor={(i) => i.key}
              contentContainerStyle={{ paddingBottom: 32 }}
              ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: COLORS.divider }} />}
              ListEmptyComponent={<Text style={az.emptyText}>All catalog azkar already added.</Text>}
              renderItem={({ item }) => (
                <TouchableOpacity style={az.catalogRow} onPress={() => addFromCatalog(item)} activeOpacity={0.7}>
                  <View style={{ flex: 1 }}>
                    <Text style={az.catalogArabic}>{item.arabic}</Text>
                    <Text style={az.catalogLabel}>{item.label}</Text>
                    <Text style={az.catalogSub}>{item.meaning} · {item.defaultTarget}×</Text>
                  </View>
                  <Text style={az.addText}>Add</Text>
                </TouchableOpacity>
              )}
            />
          ) : (
            <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
              <Text style={az.fieldLabel}>Name</Text>
              <TextInput style={az.input} placeholder="e.g. Salawat, Istighfar…" placeholderTextColor={COLORS.textLight} value={customName} onChangeText={setCustomName} />
              <Text style={[az.fieldLabel, { marginTop: 16 }]}>Arabic (optional)</Text>
              <TextInput style={[az.input, { textAlign: 'right', fontSize: 20 }]} placeholder="اكتب هنا" placeholderTextColor={COLORS.textLight} value={customArabic} onChangeText={setCustomArabic} />
              <Text style={[az.fieldLabel, { marginTop: 16 }]}>Daily target</Text>
              <View style={{ marginTop: 8 }}>
                <MiniStepper value={customTarget} onChange={setCustomTarget} />
              </View>
              <TouchableOpacity style={[az.confirmBtn, !customName.trim() && { opacity: 0.4 }]} onPress={addCustom} disabled={!customName.trim()}>
                <Text style={az.confirmText}>Add to My Zikar</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
const az = StyleSheet.create({
  container:    { flex: 1, backgroundColor: COLORS.parchment },
  header:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: COLORS.divider },
  title:        { fontSize: 20, fontWeight: '700', color: COLORS.textDark },
  done:         { fontSize: 16, color: COLORS.sage, fontWeight: '600' },
  tabs:         { flexDirection: 'row', margin: 16, backgroundColor: COLORS.parchmentDeep, borderRadius: 12, padding: 3 },
  tab:          { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center' },
  tabActive:    { backgroundColor: COLORS.white },
  tabText:      { fontSize: 14, color: COLORS.textLight, fontWeight: '500' },
  tabTextActive:{ fontSize: 14, color: COLORS.textDark, fontWeight: '600' },
  catalogRow:   { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14 },
  catalogArabic:{ fontSize: 20, color: COLORS.textDark, lineHeight: 28 },
  catalogLabel: { fontSize: 15, color: COLORS.textDark, fontWeight: '600' },
  catalogSub:   { fontSize: 12, color: COLORS.textLight, marginTop: 2 },
  addText:      { fontSize: 14, color: COLORS.sage, fontWeight: '600', paddingLeft: 12 },
  emptyText:    { textAlign: 'center', color: COLORS.textLight, fontSize: 14, margin: 40 },
  fieldLabel:   { fontSize: 12, color: COLORS.textLight, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8 },
  input:        { backgroundColor: COLORS.parchmentDeep, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, color: COLORS.textDark, borderWidth: 1, borderColor: COLORS.divider },
  confirmBtn:   { marginTop: 28, backgroundColor: COLORS.sage, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  confirmText:  { color: 'white', fontSize: 16, fontWeight: '600' },
});

// ─── Location Search Modal ────────────────────────────────────────────────────

function LocationModal({ visible, currentLocation, onClose, onSelect }) {
  const [query, setQuery]         = useState('');
  const [results, setResults]     = useState([]);
  const [searching, setSearching] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearching(true); setResults([]);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query.trim())}&format=json&limit=6&addressdetails=1`,
        { headers: { 'Accept-Language': 'en', 'User-Agent': 'SoulHealthApp/1.0' } }
      );
      setResults(await res.json());
    } catch { Alert.alert('Search failed', 'Check your internet connection.'); }
    setSearching(false);
  };

  const handleGPS = async () => {
    setGpsLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { Alert.alert('Location Required', 'Please allow location access.'); setGpsLoading(false); return; }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const [place] = await Location.reverseGeocodeAsync({ latitude: loc.coords.latitude, longitude: loc.coords.longitude }).catch(() => [null]);
      const name = place
        ? `${place.city ?? place.district ?? place.subregion ?? ''}, ${place.country ?? ''}`.trim().replace(/^,\s*/, '')
        : `${loc.coords.latitude.toFixed(4)}, ${loc.coords.longitude.toFixed(4)}`;
      onSelect({ lat: loc.coords.latitude, lng: loc.coords.longitude, name });
    } catch { Alert.alert('Error', 'Could not fetch location.'); }
    setGpsLoading(false);
  };

  const handleResult = (item) => {
    const city    = item.address?.city ?? item.address?.town ?? item.address?.village ?? '';
    const country = item.address?.country ?? '';
    const name    = [city, country].filter(Boolean).join(', ') || item.display_name;
    onSelect({ lat: parseFloat(item.lat), lng: parseFloat(item.lon), name });
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={lm.container}>
          <View style={lm.header}>
            <Text style={lm.title}>Set Location</Text>
            <TouchableOpacity onPress={onClose}><Text style={lm.done}>Done</Text></TouchableOpacity>
          </View>
          {currentLocation && (
            <View style={lm.currentBadge}>
              <Text style={lm.currentLabel}>Current</Text>
              <Text style={lm.currentName}>{currentLocation}</Text>
            </View>
          )}
          <TouchableOpacity style={lm.gpsBtn} onPress={handleGPS} disabled={gpsLoading}>
            {gpsLoading ? <ActivityIndicator size="small" color="white" /> : <Text style={lm.gpsBtnText}>Use Current Location (GPS)</Text>}
          </TouchableOpacity>
          <View style={lm.orRow}>
            <View style={lm.orLine} /><Text style={lm.orText}>or search</Text><View style={lm.orLine} />
          </View>
          <View style={lm.searchRow}>
            <TextInput style={lm.input} placeholder="City or country…" placeholderTextColor={COLORS.textLight} value={query} onChangeText={setQuery} onSubmitEditing={handleSearch} returnKeyType="search" autoCorrect={false} />
            <TouchableOpacity style={lm.searchBtn} onPress={handleSearch} disabled={searching}>
              {searching ? <ActivityIndicator size="small" color="white" /> : <Text style={lm.searchBtnText}>Search</Text>}
            </TouchableOpacity>
          </View>
          <FlatList
            data={results}
            keyExtractor={(i) => i.place_id?.toString() ?? i.display_name}
            contentContainerStyle={{ paddingBottom: 32, paddingHorizontal: 20 }}
            ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: COLORS.divider }} />}
            renderItem={({ item }) => {
              const city    = item.address?.city ?? item.address?.town ?? item.address?.village ?? '';
              const country = item.address?.country ?? '';
              const name    = [city, country].filter(Boolean).join(', ') || item.display_name;
              return (
                <TouchableOpacity style={lm.resultItem} onPress={() => handleResult(item)} activeOpacity={0.7}>
                  <Text style={lm.resultName}>{name}</Text>
                  <Text style={lm.resultDetail} numberOfLines={1}>{item.display_name}</Text>
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={!searching && query ? <Text style={lm.emptyText}>No results found.</Text> : null}
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
const lm = StyleSheet.create({
  container:   { flex: 1, backgroundColor: COLORS.parchment, paddingHorizontal: 20 },
  header:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 20, paddingBottom: 16 },
  title:       { fontSize: 20, fontWeight: '700', color: COLORS.textDark },
  done:        { fontSize: 16, color: COLORS.sage, fontWeight: '600' },
  currentBadge:{ backgroundColor: 'rgba(139,118,214,0.08)', borderRadius: 12, padding: 12, marginBottom: 14, borderWidth: 1, borderColor: 'rgba(139,118,214,0.2)' },
  currentLabel:{ fontSize: 11, color: COLORS.sage, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  currentName: { fontSize: 15, color: COLORS.textDark, fontWeight: '500' },
  gpsBtn:      { backgroundColor: COLORS.sage, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginBottom: 18 },
  gpsBtnText:  { color: 'white', fontSize: 15, fontWeight: '600' },
  orRow:       { flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 10 },
  orLine:      { flex: 1, height: 1, backgroundColor: COLORS.divider },
  orText:      { fontSize: 12, color: COLORS.textLight },
  searchRow:   { flexDirection: 'row', gap: 10, marginBottom: 16 },
  input:       { flex: 1, backgroundColor: COLORS.parchmentDeep, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: COLORS.textDark, borderWidth: 1, borderColor: COLORS.divider },
  searchBtn:   { backgroundColor: COLORS.gold, borderRadius: 12, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center', minWidth: 72 },
  searchBtnText:{ color: 'white', fontSize: 14, fontWeight: '600' },
  resultItem:  { paddingVertical: 12 },
  resultName:  { fontSize: 15, color: COLORS.textDark, fontWeight: '600', marginBottom: 2 },
  resultDetail:{ fontSize: 12, color: COLORS.textLight },
  emptyText:   { textAlign: 'center', color: COLORS.textLight, fontSize: 14, marginTop: 32 },
});

// ─── Main Settings Screen ─────────────────────────────────────────────────────

export default function SettingsScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const { settings, updateSettings, completeOnboarding } = useSettings();
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [addZikarVisible, setAddZikarVisible]           = useState(false);
  const [calendarLoading, setCalendarLoading]           = useState(false);

  if (!settings) return null;

  const { prayer, quran, zikar, sadaqa, azan } = settings;
  const weights = computeWeights(settings);

  // ── Prayer helpers ──
  const toggleTargetPrayer = (key) => {
    const next = prayer.targetPrayers.includes(key)
      ? prayer.targetPrayers.filter((k) => k !== key)
      : [...prayer.targetPrayers, key];
    if (next.length === 0) return;
    updateSettings({ prayer: { targetPrayers: next } });
  };

  // ── Zikar helpers ──
  const toggleZikarItem = (key) => {
    const items = zikar.items.map((i) => i.key === key ? { ...i, enabled: !i.enabled } : i);
    updateSettings({ zikar: { items } });
  };
  const updateZikarTarget = (key, target) => {
    const items = zikar.items.map((i) => i.key === key ? { ...i, target } : i);
    updateSettings({ zikar: { items } });
  };
  const addZikarItem = (item) => {
    updateSettings({ zikar: { items: [...zikar.items, item] } });
  };
  const removeZikarItem = (key) => {
    const items = zikar.items.filter((i) => i.key !== key);
    if (items.length === 0) return;
    updateSettings({ zikar: { items } });
  };

  // ── Location ──
  const handleLocationSelect = async ({ lat, lng, name }) => {
    const newAzan = { ...azan, latitude: lat, longitude: lng, locationName: name };
    updateSettings({ azan: newAzan });
    setLocationModalVisible(false);
    if (azan.enabled) {
      const granted = await requestNotificationPermission();
      if (granted) scheduleAzanNotifications({ ...newAzan, enabled: true });
    }
  };

  // ── Azan ──
  const handleToggleAzan = async (val) => {
    updateSettings({ azan: { enabled: val } });
    if (val) {
      const granted = await requestNotificationPermission();
      if (!granted) { Alert.alert('Notifications Required', 'Please allow notifications in your device settings.'); updateSettings({ azan: { enabled: false } }); return; }
      if (azan.latitude && azan.longitude) { scheduleAzanNotifications({ ...azan, enabled: true }); }
      else { Alert.alert('Location Needed', 'Please set your location first.'); updateSettings({ azan: { enabled: false } }); }
    }
  };
  const handleTogglePerPrayer = (key, val) => {
    const perPrayer = { ...azan.perPrayer, [key]: val };
    updateSettings({ azan: { perPrayer } });
    if (azan.enabled && azan.latitude) scheduleAzanNotifications({ ...azan, perPrayer });
  };
  const handleMethodChange = (method) => {
    updateSettings({ azan: { calculationMethod: method } });
    if (azan.enabled && azan.latitude) scheduleAzanNotifications({ ...azan, calculationMethod: method });
  };

  // ── Calendar ──
  const handleSyncCalendar = async () => {
    if (Platform.OS !== 'ios') {
      Alert.alert('iOS Only', 'Google Tasks sync via Reminders is currently available on iOS only.');
      return;
    }
    if (!azan.latitude) { Alert.alert('Location Needed', 'Set your location first so prayer times can be calculated.'); return; }
    setCalendarLoading(true);
    try {
      const count = await addPrayerTimesAsReminders(azan.latitude, azan.longitude, azan.calculationMethod);
      Alert.alert(
        'Tasks Added',
        `${count} prayer times added as tasks for today.\n\nThey appear in Apple Reminders. If you have a Google account linked in iOS Settings → Passwords & Accounts with Reminders enabled, they will sync to Google Tasks automatically.`
      );
    } catch (e) {
      const msg = e.message;
      if (msg === 'ios_only') return;
      if (msg === 'Reminders permission denied') {
        Alert.alert('Permission Required', 'Allow Reminders access in Settings → Soul Health → Reminders.');
      } else {
        Alert.alert('Error', 'Could not add tasks. Please try again.');
      }
    }
    setCalendarLoading(false);
  };

  // ── Reset ──
  const handleReset = () => {
    Alert.alert('Reset All Data', 'This will permanently delete all your tracking history.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete Everything', style: 'destructive', onPress: async () => { await clearAllData(); await completeOnboarding({ ...settings, onboardingDone: false }); } },
    ]);
  };

  return (
    <View style={styles.safe}>
      <ScrollView
        contentContainerStyle={[styles.scroll, isTablet && { maxWidth: 600, alignSelf: 'center', width: '100%' }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>‹ Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Settings</Text>
          <View style={{ width: 60 }} />
        </View>

        {/* ── DAILY GOALS ─────────────────────────────────────────────────── */}
        <Section title="Daily Goals">

          {/* Prayers */}
          <GoalLabel label="Prayers" weight={weights.prayer} />
          <PrayerChips targetPrayers={prayer.targetPrayers} onToggle={toggleTargetPrayer} />

          <Divider />

          {/* Quran */}
          <GoalLabel label="Quran" weight={weights.quran} />
          <Text style={styles.goalFieldLabel}>Track by</Text>
          <ChipGroup options={QURAN_GOAL_TYPES} value={quran.goalType} onSelect={(k) => updateSettings({ quran: { goalType: k } })} />
          <View style={styles.goalRow}>
            <Text style={styles.goalRowLabel}>Daily goal</Text>
            <MiniStepper value={quran.goalAmount} onChange={(v) => updateSettings({ quran: { goalAmount: v } })} />
          </View>

          <Divider />

          {/* Zikar */}
          <GoalLabel label="Zikar" weight={weights.zikar} />
          {zikar.items.map((item, i) => (
            <React.Fragment key={item.key}>
              {i > 0 && <View style={{ height: 1, backgroundColor: COLORS.divider, marginVertical: 4 }} />}
              <ZikarGoalRow
                item={item}
                onToggle={toggleZikarItem}
                onChangeTarget={updateZikarTarget}
                onRemove={zikar.items.length > 1 ? removeZikarItem : null}
              />
            </React.Fragment>
          ))}
          <TouchableOpacity style={styles.addZikarBtn} onPress={() => setAddZikarVisible(true)}>
            <Text style={styles.addZikarText}>+ Add Zikar</Text>
          </TouchableOpacity>

          <Divider />

          {/* Sadaqa */}
          <GoalLabel label="Sadaqa" weight={sadaqa.enabled ? weights.sadaqa : null} />
          <RowSwitch
            label="Track Sadaqa"
            sub="Include charity in your soul score"
            value={sadaqa.enabled}
            onToggle={() => updateSettings({ sadaqa: { enabled: !sadaqa.enabled } })}
          />
          {sadaqa.enabled && (
            <>
              <Text style={[styles.goalFieldLabel, { marginTop: 4 }]}>Frequency</Text>
              <ChipGroup options={SADAQA_FREQUENCIES} value={sadaqa.frequency} onSelect={(k) => updateSettings({ sadaqa: { frequency: k } })} />
            </>
          )}
        </Section>

        {/* ── PRAYER QUALITY ───────────────────────────────────────────────── */}
        <Section title="Prayer Quality">
          <Text style={styles.detailNote}>Each detail you track participates equally in your prayer score.</Text>
          <Divider />
          <RowSwitch label="Congregation (Jamat)" sub="Track whether you prayed with others or alone" value={prayer.trackCongregation} onToggle={() => updateSettings({ prayer: { trackCongregation: !prayer.trackCongregation } })} />
          <Divider />
          <RowSwitch label="On Time or Qaza" sub="Track on-time vs qaza prayers" value={prayer.trackOnTime} onToggle={() => updateSettings({ prayer: { trackOnTime: !prayer.trackOnTime } })} />
          <Divider />
          <RowSwitch label="Dua After Prayer" sub="Track 5-minute dua / reflection" value={prayer.trackDuaAfter} onToggle={() => updateSettings({ prayer: { trackDuaAfter: !prayer.trackDuaAfter } })} />
          <Divider />
          <RowSwitch label="Sunnah Prayers" sub="Track sunnah rakats" value={prayer.trackSunnah} onToggle={() => updateSettings({ prayer: { trackSunnah: !prayer.trackSunnah } })} />
        </Section>

        {/* ── AZAN NOTIFICATIONS ───────────────────────────────────────────── */}
        <Section title="Azan Notifications">
          <RowSwitch label="Enable Azan Alerts" sub="Receive precise prayer time notifications" value={azan.enabled} onToggle={handleToggleAzan} />
          <Divider />
          <View style={styles.locationRow}>
            <View style={{ flex: 1 }}>
              <Text style={rs.label}>Location</Text>
              <Text style={rs.sub}>
                {azan.latitude ? (azan.locationName ?? `${azan.latitude.toFixed(4)}, ${azan.longitude.toFixed(4)}`) : 'Not set — tap to choose'}
              </Text>
            </View>
            <TouchableOpacity style={styles.locBtn} onPress={() => setLocationModalVisible(true)}>
              <Text style={styles.locBtnText}>{azan.latitude ? 'Change' : 'Set'}</Text>
            </TouchableOpacity>
          </View>

          {azan.latitude && (
            <>
              <Divider />
              <Text style={styles.subLabel}>Calculation Method</Text>
              <ChipGroup options={AZAN_CALCULATION_METHODS} value={azan.calculationMethod} onSelect={handleMethodChange} />
              <Divider />
              <Text style={styles.subLabel}>Alert per Prayer</Text>
              <View style={{ gap: 2 }}>
                {PRAYERS.map((p) => (
                  <RowSwitch key={p.key} label={p.name} sub={`${p.arabic} · ${p.time}`} value={azan.perPrayer?.[p.key] ?? true} onToggle={(v) => handleTogglePerPrayer(p.key, v)} />
                ))}
              </View>
              <Divider />
              <TouchableOpacity style={[styles.calendarBtn, calendarLoading && { opacity: 0.6 }]} onPress={handleSyncCalendar} disabled={calendarLoading}>
                {calendarLoading
                  ? <ActivityIndicator size="small" color={COLORS.sage} />
                  : <View style={{ alignItems: 'center' }}>
                      <Text style={styles.calendarBtnTitle}>Add Today's Prayers to Google Tasks</Text>
                      <Text style={styles.calendarBtnSub}>Creates tasks in Reminders · syncs to Google Tasks if your Google account is linked in iOS Settings</Text>
                    </View>}
              </TouchableOpacity>
            </>
          )}
        </Section>

        {/* ── DATA ─────────────────────────────────────────────────────────── */}
        <Section title="Data">
          <TouchableOpacity onPress={handleReset} style={styles.resetBtn}>
            <Text style={styles.resetBtnText}>Reset All Data</Text>
          </TouchableOpacity>
        </Section>

        <View style={{ height: 30 }} />
      </ScrollView>

      <LocationModal
        visible={locationModalVisible}
        currentLocation={azan.locationName ?? (azan.latitude ? `${azan.latitude.toFixed(4)}, ${azan.longitude.toFixed(4)}` : null)}
        onClose={() => setLocationModalVisible(false)}
        onSelect={handleLocationSelect}
      />

      <AddZikarModal
        visible={addZikarVisible}
        currentKeys={zikar.items.map((i) => i.key)}
        onAdd={addZikarItem}
        onClose={() => setAddZikarVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: COLORS.parchment },
  scroll: { paddingHorizontal: 20 },

  header:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 16, paddingBottom: 20 },
  backBtn:  { width: 60 },
  backText: { fontSize: 17, color: COLORS.sage, fontWeight: '500' },
  title:    { fontSize: 22, fontWeight: '700', color: COLORS.textDark },

  // Goals card
  goalFieldLabel: { fontSize: 12, color: COLORS.textLight, fontWeight: '500', marginTop: 2 },
  goalRow:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
  goalRowLabel:   { fontSize: 15, color: COLORS.textDark, fontWeight: '500' },
  addZikarBtn:    { marginTop: 10, borderWidth: 1.5, borderColor: COLORS.sage, borderStyle: 'dashed', borderRadius: 12, paddingVertical: 10, alignItems: 'center' },
  addZikarText:   { fontSize: 14, color: COLORS.sage, fontWeight: '600' },

  // Prayer Quality
  detailNote: { fontSize: 12, color: COLORS.textLight, fontStyle: 'italic', marginBottom: 4 },

  // Azan
  locationRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  locBtn:      { backgroundColor: COLORS.sage, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, minWidth: 72, alignItems: 'center' },
  locBtnText:  { fontSize: 13, color: 'white', fontWeight: '600' },
  subLabel:    { fontSize: 12, color: COLORS.textLight, fontWeight: '600', letterSpacing: 0.4, textTransform: 'uppercase', marginTop: 4, marginBottom: 2 },
  calendarBtn: { borderWidth: 1.5, borderColor: COLORS.sage, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 16, alignItems: 'center', backgroundColor: 'rgba(139,118,214,0.06)' },
  calendarBtnTitle: { fontSize: 14, fontWeight: '600', color: COLORS.sage },
  calendarBtnSub:   { fontSize: 12, color: COLORS.textLight, marginTop: 2, textAlign: 'center' },

  // Data
  resetBtn:     { paddingVertical: 12, alignItems: 'center', borderRadius: 12, backgroundColor: 'rgba(158,80,80,0.08)', borderWidth: 1, borderColor: 'rgba(158,80,80,0.2)' },
  resetBtnText: { fontSize: 15, color: '#9E5050', fontWeight: '600' },
});
