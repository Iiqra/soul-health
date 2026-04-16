import React, { useState, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Animated, Dimensions, Switch, ActivityIndicator,
  Modal, TextInput, FlatList, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import SoulCharacter from '../components/SoulCharacter';
import { useSettings } from '../context/SettingsContext';
import { DEFAULT_SETTINGS } from '../storage/settingsStorage';
import { PRAYERS, ZIKAR_PRESETS, AZKAR_CATALOG, QURAN_GOAL_TYPES, SADAQA_FREQUENCIES, AZAN_CALCULATION_METHODS } from '../constants/spiritualData';
import { COLORS } from '../constants/colors';
import { computeWeights } from '../utils/scoreCalculator';
import { requestNotificationPermission, scheduleAzanNotifications } from '../utils/prayerTimes';

const { width: SCREEN_W } = Dimensions.get('window');

const STEPS = ['welcome', 'prayers', 'prayerDetails', 'quran', 'zikar', 'sadaqa', 'location', 'summary'];

// Background color per step
const STEP_BG = {
  welcome:      COLORS.parchment,
  prayers:      COLORS.prayerBg,
  prayerDetails:COLORS.prayerBg,
  quran:        COLORS.quranBg,
  zikar:        COLORS.zikarBg,
  sadaqa:       COLORS.sadaqaBg,
  location:     COLORS.locationBg,
  summary:      COLORS.parchment,
};

// ─── Reusable sub-components ──────────────────────────────────────────────────

function StepHeader({ title, arabic, subtitle }) {
  return (
    <View style={sh.container}>
      <Text style={sh.title}>{title}</Text>
      {arabic ? <Text style={sh.arabic}>{arabic}</Text> : null}
      {subtitle ? <Text style={sh.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}
const sh = StyleSheet.create({
  container: { alignItems: 'center', marginBottom: 28 },
  title:    { fontSize: 26, fontWeight: '700', color: COLORS.textDark },
  arabic:   { fontSize: 20, color: COLORS.textGold, marginTop: 4 },
  subtitle: { fontSize: 14, color: COLORS.textMid, marginTop: 8, textAlign: 'center', lineHeight: 20 },
});

function CheckRow({ label, sub, value, onToggle }) {
  return (
    <TouchableOpacity style={cr.row} onPress={onToggle} activeOpacity={0.75}>
      <View style={[cr.box, value && cr.boxChecked]}>
        {value && <Text style={cr.check}>✓</Text>}
      </View>
      <View style={cr.text}>
        <Text style={cr.label}>{label}</Text>
        {sub ? <Text style={cr.sub}>{sub}</Text> : null}
      </View>
    </TouchableOpacity>
  );
}
const cr = StyleSheet.create({
  row:        { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 14 },
  box:        { width: 24, height: 24, borderRadius: 7, borderWidth: 2, borderColor: COLORS.gold, justifyContent: 'center', alignItems: 'center' },
  boxChecked: { backgroundColor: COLORS.sage, borderColor: COLORS.sage },
  check:      { color: 'white', fontSize: 13, fontWeight: '700' },
  text:       { flex: 1 },
  label:      { fontSize: 15, color: COLORS.textDark, fontWeight: '500' },
  sub:        { fontSize: 12, color: COLORS.textLight, marginTop: 2 },
});

function ChipRow({ options, value, onSelect }) {
  return (
    <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
      {options.map((opt) => (
        <TouchableOpacity
          key={opt.key}
          style={[chip.base, value === opt.key && chip.active]}
          onPress={() => onSelect(opt.key)}
        >
          <Text style={[chip.label, value === opt.key && chip.labelActive]}>
            {opt.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
const chip = StyleSheet.create({
  base:        { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: COLORS.gold },
  active:      { backgroundColor: COLORS.sage, borderColor: COLORS.sage },
  label:       { fontSize: 14, color: COLORS.textMid, fontWeight: '500' },
  labelActive: { color: 'white' },
});

function Stepper({ value, onChange, min = 1, max = 100 }) {
  return (
    <View style={stp.row}>
      <TouchableOpacity style={stp.btn} onPress={() => onChange(Math.max(min, value - 1))} disabled={value <= min}>
        <Text style={[stp.btnText, value <= min && { opacity: 0.3 }]}>−</Text>
      </TouchableOpacity>
      <Text style={stp.value}>{value}</Text>
      <TouchableOpacity style={stp.btn} onPress={() => onChange(Math.min(max, value + 1))} disabled={value >= max}>
        <Text style={[stp.btnText, value >= max && { opacity: 0.3 }]}>+</Text>
      </TouchableOpacity>
    </View>
  );
}
const stp = StyleSheet.create({
  row:     { flexDirection: 'row', alignItems: 'center', gap: 20 },
  btn:     { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.6)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.divider },
  btnText: { fontSize: 22, color: COLORS.textDark, fontWeight: '300' },
  value:   { fontSize: 32, fontWeight: '700', color: COLORS.textDark, minWidth: 48, textAlign: 'center' },
});

function SectionCard({ children, style }) {
  return <View style={[sc.card, style]}>{children}</View>;
}
const sc = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255,255,255,0.75)', borderRadius: 18, padding: 20, marginBottom: 16,
    borderWidth: 1, borderColor: 'rgba(201,169,110,0.2)',
    shadowColor: '#8B6830', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 2,
  },
});

// ─── Step Components ──────────────────────────────────────────────────────────

function WelcomeStep() {
  return (
    <View style={styles.stepContent}>
      <Text style={styles.bismillah}>بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</Text>
      <SoulCharacter health={85} size={160} />
      <Text style={styles.appName}>Soul Health</Text>
      <Text style={styles.welcomeBody}>
        Track your daily prayers, Quran, and zikar.{'\n'}
        Watch your spiritual companion Noor reflect{'\n'}
        the health of your soul — and grow.
      </Text>
      <Text style={styles.welcomeSub}>Let's set up your personalised journey.</Text>
    </View>
  );
}

function PrayerTargetStep({ setup, setSetup }) {
  const toggle = (key) => {
    const current = setup.prayer.targetPrayers;
    const next = current.includes(key) ? current.filter((k) => k !== key) : [...current, key];
    if (next.length === 0) return;
    setSetup((s) => ({ ...s, prayer: { ...s.prayer, targetPrayers: next } }));
  };
  return (
    <ScrollView style={styles.stepScroll} showsVerticalScrollIndicator={false}>
      <StepHeader
        title="Prayers"
        arabic="الصَّلَاة"
        subtitle="Which prayers would you like to track? Start with what feels right — you can add more anytime."
      />
      <SectionCard>
        {PRAYERS.map((p) => (
          <CheckRow
            key={p.key}
            label={p.name}
            sub={`${p.arabic} · ${p.time}`}
            value={setup.prayer.targetPrayers.includes(p.key)}
            onToggle={() => toggle(p.key)}
          />
        ))}
      </SectionCard>
    </ScrollView>
  );
}

function PrayerDetailsStep({ setup, setSetup }) {
  const update = (field, val) => setSetup((s) => ({ ...s, prayer: { ...s.prayer, [field]: val } }));
  return (
    <ScrollView style={styles.stepScroll} showsVerticalScrollIndicator={false}>
      <StepHeader
        title="Prayer Quality"
        subtitle="Every detail you choose to track reflects equally in your soul's health — not as a bonus, but as a full part of each prayer's score."
      />
      <SectionCard>
        <CheckRow
          label="Congregation (Jamat)"
          sub="Whether you prayed with others or alone — both matter."
          value={setup.prayer.trackCongregation}
          onToggle={() => update('trackCongregation', !setup.prayer.trackCongregation)}
        />
        <View style={styles.dividerLine} />
        <CheckRow
          label="On Time or Qaza"
          sub="Track whether your prayer was on time. Qaza still earns partial credit."
          value={setup.prayer.trackOnTime}
          onToggle={() => update('trackOnTime', !setup.prayer.trackOnTime)}
        />
        <View style={styles.dividerLine} />
        <CheckRow
          label="Dua After Prayer"
          sub="A few minutes of heartfelt supplication after salah."
          value={setup.prayer.trackDuaAfter}
          onToggle={() => update('trackDuaAfter', !setup.prayer.trackDuaAfter)}
        />
        <View style={styles.dividerLine} />
        <CheckRow
          label="Sunnah Prayers"
          sub="Sunnah rakats before and after fard — each act of khushoo' counts."
          value={setup.prayer.trackSunnah}
          onToggle={() => update('trackSunnah', !setup.prayer.trackSunnah)}
        />
      </SectionCard>
      <Text style={styles.hint}>
        Each detail you track reflects equally in your prayer score. If you feel ready to add this level of focus, enable it here.
      </Text>
    </ScrollView>
  );
}

function QuranStep({ setup, setSetup }) {
  const update = (field, val) => setSetup((s) => ({ ...s, quran: { ...s.quran, [field]: val } }));
  return (
    <ScrollView style={styles.stepScroll} showsVerticalScrollIndicator={false}>
      <StepHeader title="Quran" arabic="الْقُرْآن" subtitle="How would you like to measure your daily recitation?" />
      <SectionCard>
        <Text style={styles.fieldLabel}>Track by</Text>
        <ChipRow options={QURAN_GOAL_TYPES} value={setup.quran.goalType} onSelect={(key) => update('goalType', key)} />
      </SectionCard>
      <SectionCard>
        <Text style={styles.fieldLabel}>Daily goal</Text>
        <View style={styles.stepperRow}>
          <Stepper value={setup.quran.goalAmount} onChange={(v) => update('goalAmount', v)} min={1} max={100} />
          <Text style={styles.stepperUnit}>
            {QURAN_GOAL_TYPES.find((t) => t.key === setup.quran.goalType)?.label ?? ''} / day
          </Text>
        </View>
      </SectionCard>
    </ScrollView>
  );
}

function ZikarStep({ setup, setSetup }) {
  const [showPicker, setShowPicker]     = useState(false);
  const [pickerMode, setPickerMode]     = useState('catalog'); // 'catalog' | 'custom'
  const [customName, setCustomName]     = useState('');
  const [customArabic, setCustomArabic] = useState('');
  const [customTarget, setCustomTarget] = useState(33);

  const currentKeys    = setup.zikar.items.map((i) => i.key);
  const availableCatalog = AZKAR_CATALOG.filter((z) => !currentKeys.includes(z.key));

  const addFromCatalog = (item) => {
    setSetup((s) => ({
      ...s,
      zikar: {
        ...s.zikar,
        items: [...s.zikar.items, {
          key: item.key, label: item.label, arabic: item.arabic,
          meaning: item.meaning, target: item.defaultTarget, enabled: true,
        }],
      },
    }));
    setShowPicker(false);
  };

  const addCustom = () => {
    if (!customName.trim()) return;
    setSetup((s) => ({
      ...s,
      zikar: {
        ...s.zikar,
        items: [...s.zikar.items, {
          key: `custom_${Date.now()}`, label: customName.trim(),
          arabic: customArabic.trim(), target: customTarget,
          enabled: true, isCustom: true,
        }],
      },
    }));
    setCustomName(''); setCustomArabic(''); setCustomTarget(33);
    setShowPicker(false);
  };

  const removeItem = (key) =>
    setSetup((s) => ({ ...s, zikar: { ...s.zikar, items: s.zikar.items.filter((i) => i.key !== key) } }));

  const toggleItem = (key) =>
    setSetup((s) => ({
      ...s,
      zikar: { ...s.zikar, items: s.zikar.items.map((i) => i.key === key ? { ...i, enabled: !i.enabled } : i) },
    }));

  const updateTarget = (key, target) =>
    setSetup((s) => ({
      ...s,
      zikar: { ...s.zikar, items: s.zikar.items.map((i) => i.key === key ? { ...i, target } : i) },
    }));

  return (
    <ScrollView style={styles.stepScroll} showsVerticalScrollIndicator={false}>
      <StepHeader
        title="Zikar"
        arabic="الذِّكْر"
        subtitle="Build your daily remembrance list. Start with Allahu Akbar and add more."
      />

      {setup.zikar.items.map((item) => (
        <SectionCard key={item.key}>
          <View style={styles.zikarItemHeader}>
            <View style={{ flex: 1 }}>
              {item.arabic ? <Text style={styles.zikarArabic}>{item.arabic}</Text> : null}
              <Text style={styles.zikarLabel}>{item.label}</Text>
              {item.meaning ? <Text style={styles.zikarMeaning}>{item.meaning}</Text> : null}
            </View>
            <Switch
              value={item.enabled}
              onValueChange={() => toggleItem(item.key)}
              trackColor={{ false: COLORS.parchmentDeep, true: COLORS.sage }}
              thumbColor={COLORS.white}
            />
            {/* Allow removing any item except the last one */}
            {setup.zikar.items.length > 1 && (
              <TouchableOpacity onPress={() => removeItem(item.key)} style={zk.removeBtn}>
                <Text style={zk.removeBtnText}>×</Text>
              </TouchableOpacity>
            )}
          </View>
          {item.enabled && (
            <View style={styles.zikarTarget}>
              <Text style={styles.fieldLabel}>Daily target</Text>
              <Stepper value={item.target} onChange={(v) => updateTarget(item.key, v)} min={1} max={999} />
            </View>
          )}
        </SectionCard>
      ))}

      {/* Add Zikar button */}
      <TouchableOpacity style={zk.addBtn} onPress={() => { setPickerMode('catalog'); setShowPicker(true); }}>
        <Text style={zk.addBtnText}>+ Add Zikar</Text>
      </TouchableOpacity>

      {/* Picker Modal */}
      <Modal visible={showPicker} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowPicker(false)}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={zk.modalContainer}>
            {/* Modal header */}
            <View style={zk.modalHeader}>
              <Text style={zk.modalTitle}>Add Zikar</Text>
              <TouchableOpacity onPress={() => setShowPicker(false)}>
                <Text style={zk.modalClose}>Done</Text>
              </TouchableOpacity>
            </View>

            {/* Tab switcher */}
            <View style={zk.tabs}>
              <TouchableOpacity
                style={[zk.tab, pickerMode === 'catalog' && zk.tabActive]}
                onPress={() => setPickerMode('catalog')}
              >
                <Text style={[zk.tabText, pickerMode === 'catalog' && zk.tabTextActive]}>From Catalog</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[zk.tab, pickerMode === 'custom' && zk.tabActive]}
                onPress={() => setPickerMode('custom')}
              >
                <Text style={[zk.tabText, pickerMode === 'custom' && zk.tabTextActive]}>Custom</Text>
              </TouchableOpacity>
            </View>

            {pickerMode === 'catalog' ? (
              <FlatList
                data={availableCatalog}
                keyExtractor={(item) => item.key}
                contentContainerStyle={{ paddingBottom: 32 }}
                ListEmptyComponent={
                  <Text style={zk.emptyText}>You've added all available azkar!</Text>
                }
                ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: COLORS.divider }} />}
                renderItem={({ item }) => (
                  <TouchableOpacity style={zk.catalogItem} onPress={() => addFromCatalog(item)} activeOpacity={0.7}>
                    <View style={{ flex: 1 }}>
                      <Text style={zk.catalogArabic}>{item.arabic}</Text>
                      <Text style={zk.catalogLabel}>{item.label}</Text>
                      <Text style={zk.catalogMeaning}>{item.meaning} · {item.defaultTarget}×</Text>
                    </View>
                    <Text style={zk.catalogAdd}>Add</Text>
                  </TouchableOpacity>
                )}
              />
            ) : (
              <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
                <Text style={styles.fieldLabel}>Name</Text>
                <TextInput
                  style={zk.input}
                  placeholder="e.g. Salawat, Istighfar…"
                  placeholderTextColor={COLORS.textLight}
                  value={customName}
                  onChangeText={setCustomName}
                />
                <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Arabic (optional)</Text>
                <TextInput
                  style={[zk.input, { textAlign: 'right', fontSize: 20 }]}
                  placeholder="اكتب هنا"
                  placeholderTextColor={COLORS.textLight}
                  value={customArabic}
                  onChangeText={setCustomArabic}
                />
                <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Daily target</Text>
                <View style={{ marginTop: 4 }}>
                  <Stepper value={customTarget} onChange={setCustomTarget} min={1} max={999} />
                </View>
                <TouchableOpacity
                  style={[zk.addConfirmBtn, !customName.trim() && { opacity: 0.4 }]}
                  onPress={addCustom}
                  disabled={!customName.trim()}
                >
                  <Text style={zk.addConfirmText}>Add to My Zikar</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScrollView>
  );
}

const zk = StyleSheet.create({
  removeBtn:     { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(200,90,90,0.1)', justifyContent: 'center', alignItems: 'center', marginLeft: 8 },
  removeBtnText: { fontSize: 18, color: '#C85A5A', lineHeight: 22 },
  addBtn:        { borderWidth: 1.5, borderColor: COLORS.sage, borderStyle: 'dashed', borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginBottom: 20 },
  addBtnText:    { fontSize: 15, color: COLORS.sage, fontWeight: '600' },

  modalContainer: { flex: 1, backgroundColor: COLORS.parchment },
  modalHeader:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: COLORS.divider },
  modalTitle:     { fontSize: 20, fontWeight: '700', color: COLORS.textDark },
  modalClose:     { fontSize: 16, color: COLORS.sage, fontWeight: '600' },

  tabs:         { flexDirection: 'row', marginHorizontal: 20, marginVertical: 12, backgroundColor: COLORS.parchmentDeep, borderRadius: 12, padding: 3 },
  tab:          { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center' },
  tabActive:    { backgroundColor: COLORS.white },
  tabText:      { fontSize: 14, color: COLORS.textLight, fontWeight: '500' },
  tabTextActive:{ fontSize: 14, color: COLORS.textDark, fontWeight: '600' },

  catalogItem:   { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14 },
  catalogArabic: { fontSize: 20, color: COLORS.textDark, lineHeight: 28 },
  catalogLabel:  { fontSize: 15, color: COLORS.textDark, fontWeight: '600' },
  catalogMeaning:{ fontSize: 12, color: COLORS.textLight, marginTop: 2 },
  catalogAdd:    { fontSize: 14, color: COLORS.sage, fontWeight: '600', paddingLeft: 12 },
  emptyText:     { textAlign: 'center', color: COLORS.textLight, fontSize: 14, margin: 40 },

  input:          { backgroundColor: COLORS.parchmentDeep, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, color: COLORS.textDark, borderWidth: 1, borderColor: COLORS.divider },
  addConfirmBtn:  { marginTop: 28, backgroundColor: COLORS.sage, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  addConfirmText: { color: 'white', fontSize: 16, fontWeight: '600' },
});

function SadaqaStep({ setup, setSetup }) {
  const update = (field, val) => setSetup((s) => ({ ...s, sadaqa: { ...s.sadaqa, [field]: val } }));
  return (
    <ScrollView style={styles.stepScroll} showsVerticalScrollIndicator={false}>
      <StepHeader title="Sadaqa" arabic="الصَّدَقَة" subtitle="Track your acts of giving and generosity. Every entry — how much, to whom, what kind — reflects in your soul." />
      <SectionCard>
        <View style={styles.switchRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.switchLabel}>Track Sadaqa</Text>
            <Text style={styles.switchSub}>When ready, you can record each act of giving with details</Text>
          </View>
          <Switch
            value={setup.sadaqa.enabled}
            onValueChange={(v) => update('enabled', v)}
            trackColor={{ false: COLORS.parchmentDeep, true: COLORS.sage }}
            thumbColor={COLORS.white}
          />
        </View>
      </SectionCard>
      {setup.sadaqa.enabled && (
        <SectionCard>
          <Text style={styles.fieldLabel}>How often is your goal?</Text>
          <View style={{ marginTop: 10 }}>
            <ChipRow options={SADAQA_FREQUENCIES} value={setup.sadaqa.frequency} onSelect={(key) => update('frequency', key)} />
          </View>
        </SectionCard>
      )}
    </ScrollView>
  );
}

function LocationStep({ setup, setSetup }) {
  const [gpsLoading, setGpsLoading]   = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching]     = useState(false);

  const updateAzan = (field, val) => setSetup((s) => ({ ...s, azan: { ...s.azan, [field]: val } }));
  const azan = setup.azan ?? DEFAULT_SETTINGS.azan;

  const handleGPS = async () => {
    setGpsLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { setGpsLoading(false); return; }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const [place] = await Location.reverseGeocodeAsync({ latitude: loc.coords.latitude, longitude: loc.coords.longitude }).catch(() => [null]);
      const locationName = place
        ? `${place.city ?? place.district ?? ''}, ${place.country ?? ''}`.trim().replace(/^,\s*/, '')
        : `${loc.coords.latitude.toFixed(4)}, ${loc.coords.longitude.toFixed(4)}`;
      setSetup((s) => ({ ...s, azan: { ...s.azan, latitude: loc.coords.latitude, longitude: loc.coords.longitude, locationName } }));
      setSearchResults([]);
    } catch (e) { console.warn('Location fetch error:', e); }
    setGpsLoading(false);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    setSearchResults([]);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery.trim())}&format=json&limit=5&addressdetails=1`,
        { headers: { 'Accept-Language': 'en', 'User-Agent': 'SoulHealthApp/1.0' } }
      );
      setSearchResults(await res.json());
    } catch { /* silent fail */ }
    setSearching(false);
  };

  const handleResultSelect = (item) => {
    const city    = item.address?.city ?? item.address?.town ?? item.address?.village ?? '';
    const country = item.address?.country ?? '';
    const name    = [city, country].filter(Boolean).join(', ') || item.display_name;
    setSetup((s) => ({ ...s, azan: { ...s.azan, latitude: parseFloat(item.lat), longitude: parseFloat(item.lon), locationName: name } }));
    setSearchResults([]);
    setSearchQuery('');
  };

  return (
    <ScrollView style={styles.stepScroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <StepHeader
        title="Azan Notifications"
        subtitle="Get precise prayer time alerts based on your location. Calculated offline — no internet needed after setup."
      />

      <SectionCard>
        <View style={styles.switchRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.switchLabel}>Enable Azan Alerts</Text>
            <Text style={styles.switchSub}>Notify me at each prayer time</Text>
          </View>
          <Switch
            value={azan.enabled}
            onValueChange={(v) => updateAzan('enabled', v)}
            trackColor={{ false: COLORS.parchmentDeep, true: COLORS.sage }}
            thumbColor={COLORS.white}
          />
        </View>
      </SectionCard>

      {azan.enabled && (
        <>
          <SectionCard>
            <Text style={styles.fieldLabel}>Your Location</Text>

            {/* Current location badge */}
            {azan.latitude ? (
              <View style={styles.locationBox}>
                <Text style={styles.locationText}>
                  📍 {azan.locationName ?? `${azan.latitude.toFixed(4)}, ${azan.longitude.toFixed(4)}`}
                </Text>
              </View>
            ) : null}

            {/* GPS button */}
            <TouchableOpacity
              style={[styles.locFetchBtn, gpsLoading && { opacity: 0.6 }, azan.latitude && { marginTop: 10, backgroundColor: 'transparent', borderWidth: 1.5, borderColor: COLORS.sage }]}
              onPress={handleGPS}
              disabled={gpsLoading}
            >
              {gpsLoading
                ? <ActivityIndicator color={azan.latitude ? COLORS.sage : 'white'} size="small" />
                : <Text style={[styles.locFetchText, azan.latitude && { color: COLORS.sage }]}>
                    {azan.latitude ? 'Use GPS Instead' : '📍  Use My Current Location'}
                  </Text>}
            </TouchableOpacity>

            {/* Search divider */}
            <View style={loc.dividerRow}>
              <View style={loc.dividerLine} />
              <Text style={loc.dividerText}>or search by city</Text>
              <View style={loc.dividerLine} />
            </View>

            {/* City search */}
            <View style={loc.searchRow}>
              <TextInput
                style={loc.input}
                placeholder="City name…"
                placeholderTextColor={COLORS.textLight}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={handleSearch}
                returnKeyType="search"
                autoCorrect={false}
              />
              <TouchableOpacity style={loc.searchBtn} onPress={handleSearch} disabled={searching}>
                {searching
                  ? <ActivityIndicator size="small" color="white" />
                  : <Text style={loc.searchBtnText}>Search</Text>}
              </TouchableOpacity>
            </View>

            {/* Results */}
            {searchResults.map((item) => {
              const city    = item.address?.city ?? item.address?.town ?? item.address?.village ?? '';
              const country = item.address?.country ?? '';
              const name    = [city, country].filter(Boolean).join(', ') || item.display_name;
              return (
                <TouchableOpacity
                  key={item.place_id?.toString() ?? item.display_name}
                  style={loc.resultItem}
                  onPress={() => handleResultSelect(item)}
                  activeOpacity={0.7}
                >
                  <Text style={loc.resultName}>{name}</Text>
                  <Text style={loc.resultDetail} numberOfLines={1}>{item.display_name}</Text>
                </TouchableOpacity>
              );
            })}

            {!azan.latitude && searchResults.length === 0 && (
              <Text style={styles.hint}>
                GPS is one-time only. Used to calculate prayer times. Not shared or stored remotely.
              </Text>
            )}
          </SectionCard>

          {azan.latitude && (
            <>
              <SectionCard>
                <Text style={styles.fieldLabel}>Calculation Method</Text>
                <ChipRow
                  options={AZAN_CALCULATION_METHODS}
                  value={azan.calculationMethod}
                  onSelect={(key) => updateAzan('calculationMethod', key)}
                />
                <Text style={styles.hint}>Choose the method used in your country or region.</Text>
              </SectionCard>

              <SectionCard>
                <Text style={styles.fieldLabel}>Alert for each prayer</Text>
                {PRAYERS.map((p) => (
                  <View key={p.key} style={styles.prayerToggleRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.prayerToggleName}>{p.name}</Text>
                      <Text style={styles.prayerToggleAr}>{p.arabic}</Text>
                    </View>
                    <Switch
                      value={azan.perPrayer?.[p.key] ?? true}
                      onValueChange={(v) => setSetup((s) => ({
                        ...s,
                        azan: { ...s.azan, perPrayer: { ...s.azan.perPrayer, [p.key]: v } },
                      }))}
                      trackColor={{ false: COLORS.parchmentDeep, true: COLORS.sage }}
                      thumbColor={COLORS.white}
                    />
                  </View>
                ))}
              </SectionCard>
            </>
          )}
        </>
      )}

      {!azan.enabled && (
        <Text style={styles.hint}>You can enable Azan notifications anytime from Settings.</Text>
      )}
    </ScrollView>
  );
}

const loc = StyleSheet.create({
  dividerRow:  { flexDirection: 'row', alignItems: 'center', marginVertical: 12, gap: 8 },
  dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.divider },
  dividerText: { fontSize: 12, color: COLORS.textLight, fontWeight: '500' },
  searchRow:   { flexDirection: 'row', gap: 8, marginBottom: 4 },
  input:       { flex: 1, backgroundColor: COLORS.parchmentDeep, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, color: COLORS.textDark, borderWidth: 1, borderColor: COLORS.divider },
  searchBtn:   { backgroundColor: COLORS.gold, borderRadius: 10, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center' },
  searchBtnText: { color: 'white', fontSize: 13, fontWeight: '600' },
  resultItem:  { paddingVertical: 10, borderTopWidth: 1, borderTopColor: COLORS.divider },
  resultName:  { fontSize: 15, color: COLORS.textDark, fontWeight: '600' },
  resultDetail:{ fontSize: 11, color: COLORS.textLight, marginTop: 1 },
});

function SummaryStep({ setup }) {
  const weights = computeWeights(setup);
  const targetCount = setup.prayer.targetPrayers.length;
  const enabledZikar = setup.zikar.items.filter((i) => i.enabled).length;
  const goalLabel = QURAN_GOAL_TYPES.find((t) => t.key === setup.quran.goalType)?.label ?? 'pages';

  const rows = [
    { label: 'Prayers', sub: `${targetCount} of 5 prayers`, weight: weights.prayer },
    { label: 'Quran',   sub: `${setup.quran.goalAmount} ${goalLabel} / day`, weight: weights.quran },
    enabledZikar > 0 && { label: 'Zikar', sub: `${enabledZikar} type${enabledZikar > 1 ? 's' : ''}`, weight: weights.zikar },
    setup.sadaqa.enabled && { label: 'Sadaqa', sub: setup.sadaqa.frequency, weight: weights.sadaqa },
  ].filter(Boolean);

  return (
    <ScrollView style={styles.stepScroll} showsVerticalScrollIndicator={false}>
      <View style={{ alignItems: 'center', marginBottom: 20 }}>
        <SoulCharacter health={78} size={120} />
        <Text style={styles.appName}>Your Journey Begins</Text>
        <Text style={styles.welcomeSub}>Here's how your soul score will be calculated:</Text>
      </View>
      <SectionCard>
        {rows.map((row, i) => (
          <View key={row.label}>
            {i > 0 && <View style={styles.dividerLine} />}
            <View style={styles.summaryRow}>
              <View>
                <Text style={styles.summaryLabel}>{row.label}</Text>
                <Text style={styles.summarySub}>{row.sub}</Text>
              </View>
              <Text style={styles.summaryWeight}>{Math.round(row.weight * 100)}%</Text>
            </View>
          </View>
        ))}
      </SectionCard>
      {setup.azan?.enabled && setup.azan?.latitude && (
        <SectionCard>
          <Text style={styles.fieldLabel}>Azan notifications enabled</Text>
          <Text style={{ fontSize: 13, color: COLORS.textMid }}>
            📍 {setup.azan.locationName ?? 'Location set'} · {setup.azan.calculationMethod}
          </Text>
        </SectionCard>
      )}
      <Text style={styles.hint}>Every detail you track participates equally. No shortcuts — no bonuses. Just sincerity.</Text>
    </ScrollView>
  );
}

// ─── Main Onboarding Flow ─────────────────────────────────────────────────────

export default function OnboardingFlow() {
  const { completeOnboarding } = useSettings();
  const [step, setStep] = useState(0);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const [setup, setSetup] = useState({
    prayer: { ...DEFAULT_SETTINGS.prayer },
    quran:  { ...DEFAULT_SETTINGS.quran  },
    zikar:  {
      ...DEFAULT_SETTINGS.zikar,
      // Start with only Allahu Akbar; user adds more during onboarding
      items: [{ key: 'allahuakbar', label: 'Allahu Akbar', arabic: 'ٱللَّهُ أَكْبَرُ', meaning: 'Allah is the Greatest', target: 34, enabled: true }],
    },
    sadaqa: { ...DEFAULT_SETTINGS.sadaqa },
    azan:   { ...DEFAULT_SETTINGS.azan   },
  });

  const isLastStep = step === STEPS.length - 1;
  const currentBg = STEP_BG[STEPS[step]] ?? COLORS.parchment;

  const navigate = (nextStep) => {
    const dir = nextStep > step ? -1 : 1;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.timing(slideAnim, {
      toValue: dir * SCREEN_W,
      duration: 230,
      useNativeDriver: true,
    }).start(() => {
      setStep(nextStep);
      slideAnim.setValue(-dir * SCREEN_W);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 230,
        useNativeDriver: true,
      }).start();
    });
  };

  const handleFinish = async () => {
    const finalSettings = { ...DEFAULT_SETTINGS, ...setup, onboardingDone: true };

    // Schedule azan notifications if enabled
    if (setup.azan?.enabled && setup.azan?.latitude) {
      const granted = await requestNotificationPermission();
      if (granted) scheduleAzanNotifications(setup.azan);
    }

    completeOnboarding(finalSettings);
  };

  const renderStep = () => {
    switch (STEPS[step]) {
      case 'welcome':       return <WelcomeStep />;
      case 'prayers':       return <PrayerTargetStep setup={setup} setSetup={setSetup} />;
      case 'prayerDetails': return <PrayerDetailsStep setup={setup} setSetup={setSetup} />;
      case 'quran':         return <QuranStep setup={setup} setSetup={setSetup} />;
      case 'zikar':         return <ZikarStep setup={setup} setSetup={setSetup} />;
      case 'sadaqa':        return <SadaqaStep setup={setup} setSetup={setSetup} />;
      case 'location':      return <LocationStep setup={setup} setSetup={setSetup} />;
      case 'summary':       return <SummaryStep setup={setup} />;
      default:              return null;
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: currentBg }]} edges={['bottom']}>
      {/* Step dots */}
      <View style={styles.dotsRow}>
        {STEPS.map((_, i) => (
          <View key={i} style={[styles.dot, i === step && styles.dotActive]} />
        ))}
      </View>

      {/* Animated step content */}
      <Animated.View style={[styles.content, { transform: [{ translateX: slideAnim }] }]}>
        {renderStep()}
      </Animated.View>

      {/* Navigation */}
      <View style={styles.navRow}>
        {step > 0 ? (
          <TouchableOpacity style={styles.backBtn} onPress={() => navigate(step - 1)}>
            <Text style={styles.backBtnText}>‹ Back</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ flex: 1 }} />
        )}

        <TouchableOpacity
          style={[styles.nextBtn, isLastStep && styles.finishBtn]}
          onPress={isLastStep ? handleFinish : () => navigate(step + 1)}
        >
          <Text style={styles.nextBtnText}>
            {isLastStep ? 'Start My Journey' : step === 0 ? 'Begin Setup' : 'Continue'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },

  dotsRow:   { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingTop: 12, paddingBottom: 4 },
  dot:       { width: 7, height: 7, borderRadius: 3.5, backgroundColor: 'rgba(58,48,53,0.15)' },
  dotActive: { backgroundColor: COLORS.sage, width: 20 },

  content:     { flex: 1, paddingHorizontal: 24 },
  stepContent: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 20 },
  stepScroll:  { flex: 1, paddingTop: 16 },

  bismillah:   { fontSize: 20, color: COLORS.textGold, marginBottom: 8, textAlign: 'center' },
  appName:     { fontSize: 28, fontWeight: '700', color: COLORS.textDark, marginTop: 8 },
  welcomeBody: { fontSize: 15, color: COLORS.textMid, textAlign: 'center', lineHeight: 24, marginTop: 14 },
  welcomeSub:  { fontSize: 13, color: COLORS.textLight, marginTop: 12, textAlign: 'center' },

  dividerLine: { height: 1, backgroundColor: COLORS.divider, marginVertical: 6 },
  hint:        { fontSize: 12, color: COLORS.textLight, textAlign: 'center', marginTop: 4, marginBottom: 12, fontStyle: 'italic', lineHeight: 18 },
  fieldLabel:  { fontSize: 12, color: COLORS.textLight, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 10 },

  stepperRow:  { flexDirection: 'row', alignItems: 'center', gap: 20, marginTop: 4 },
  stepperUnit: { fontSize: 14, color: COLORS.textMid },

  switchRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  switchLabel: { fontSize: 16, fontWeight: '600', color: COLORS.textDark },
  switchSub:   { fontSize: 12, color: COLORS.textLight, marginTop: 2 },

  zikarItemHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  zikarArabic:     { fontSize: 22, color: COLORS.textDark, lineHeight: 30 },
  zikarLabel:      { fontSize: 13, color: COLORS.textMid },
  zikarMeaning:    { fontSize: 11, color: COLORS.textLight, marginTop: 1 },
  zikarTarget:     { marginTop: 12, borderTopWidth: 1, borderTopColor: COLORS.divider, paddingTop: 12 },

  locationBox:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(107,143,113,0.1)', borderRadius: 12, padding: 12, marginTop: 4 },
  locationText:    { fontSize: 14, color: COLORS.textDark, fontWeight: '500', flex: 1 },
  locUpdateBtn:    { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, backgroundColor: COLORS.sage },
  locUpdateText:   { fontSize: 12, color: 'white', fontWeight: '600' },
  locFetchBtn:     { paddingVertical: 14, borderRadius: 14, backgroundColor: COLORS.sage, alignItems: 'center', marginTop: 8 },
  locFetchText:    { fontSize: 15, color: 'white', fontWeight: '600' },

  prayerToggleRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  prayerToggleName:{ fontSize: 15, color: COLORS.textDark, fontWeight: '500' },
  prayerToggleAr:  { fontSize: 13, color: COLORS.textLight },

  summaryRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  summaryLabel:  { fontSize: 15, fontWeight: '600', color: COLORS.textDark },
  summarySub:    { fontSize: 12, color: COLORS.textLight, marginTop: 2 },
  summaryWeight: { fontSize: 18, fontWeight: '700', color: COLORS.sage },

  navRow: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24,
    paddingVertical: 16, gap: 14,
  },
  backBtn:     { flex: 1 },
  backBtnText: { fontSize: 17, color: COLORS.sage, fontWeight: '500' },
  nextBtn: {
    flex: 2, backgroundColor: COLORS.sage, borderRadius: 16,
    paddingVertical: 15, alignItems: 'center',
    shadowColor: COLORS.sageDark, shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2, shadowRadius: 6, elevation: 3,
  },
  finishBtn:   { backgroundColor: COLORS.gold },
  nextBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },
});
