import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, Switch, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import ParchmentCard from '../components/ParchmentCard';
import { useSettings } from '../context/SettingsContext';
import { clearAllData } from '../storage/healthStorage';
import { PRAYERS, ZIKAR_PRESETS, QURAN_GOAL_TYPES, SADAQA_FREQUENCIES, AZAN_CALCULATION_METHODS } from '../constants/spiritualData';
import { COLORS } from '../constants/colors';
import { computeWeights } from '../utils/scoreCalculator';
import { scheduleAzanNotifications, requestNotificationPermission } from '../utils/prayerTimes';

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
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: COLORS.parchmentDeep, true: COLORS.sage }}
        thumbColor={COLORS.white}
      />
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
        <TouchableOpacity
          key={opt.key}
          style={[cg.chip, value === opt.key && cg.chipActive]}
          onPress={() => onSelect(opt.key)}
        >
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

export default function SettingsScreen({ navigation }) {
  const { settings, updateSettings, completeOnboarding } = useSettings();
  const [fetchingLocation, setFetchingLocation] = useState(false);

  if (!settings) return null;

  const { prayer, quran, zikar, sadaqa, azan } = settings;
  const weights = computeWeights(settings);

  const updatePrayer = (field, val) => updateSettings({ prayer: { [field]: val } });
  const updateQuran  = (field, val) => updateSettings({ quran:  { [field]: val } });
  const updateSadaqa = (field, val) => updateSettings({ sadaqa: { [field]: val } });
  const updateAzan   = (field, val) => updateSettings({ azan:   { [field]: val } });

  const toggleTargetPrayer = (key) => {
    const current = prayer.targetPrayers;
    const next = current.includes(key)
      ? current.filter((k) => k !== key)
      : [...current, key];
    if (next.length === 0) return;
    updatePrayer('targetPrayers', next);
  };

  const toggleZikarItem = (key) => {
    const items = zikar.items.map((i) => i.key === key ? { ...i, enabled: !i.enabled } : i);
    updateSettings({ zikar: { items } });
  };

  const handleFetchLocation = async () => {
    setFetchingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Location Required', 'Please allow location access to calculate precise prayer times.');
        setFetchingLocation(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const [place] = await Location.reverseGeocodeAsync({ latitude: loc.coords.latitude, longitude: loc.coords.longitude }).catch(() => [null]);
      const locationName = place ? `${place.city ?? place.district ?? ''}, ${place.country ?? ''}`.trim().replace(/^,\s*/, '') : null;

      const newAzan = {
        ...azan,
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        locationName,
      };
      updateSettings({ azan: newAzan });

      // Reschedule if azan is enabled
      if (azan.enabled) {
        const granted = await requestNotificationPermission();
        if (granted) scheduleAzanNotifications({ ...azan, ...newAzan });
      }
    } catch (e) {
      Alert.alert('Error', 'Could not fetch location. Please try again.');
    }
    setFetchingLocation(false);
  };

  const handleToggleAzan = async (val) => {
    updateAzan('enabled', val);
    if (val) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        Alert.alert('Notifications Required', 'Please allow notifications to receive Azan alerts.');
        updateAzan('enabled', false);
        return;
      }
      if (azan.latitude && azan.longitude) {
        scheduleAzanNotifications({ ...azan, enabled: true });
      } else {
        Alert.alert('Location Needed', 'Please set your location first to enable Azan notifications.');
        updateAzan('enabled', false);
      }
    }
  };

  const handleTogglePerPrayer = (key, val) => {
    const perPrayer = { ...azan.perPrayer, [key]: val };
    updateSettings({ azan: { perPrayer } });
    if (azan.enabled && azan.latitude && azan.longitude) {
      scheduleAzanNotifications({ ...azan, perPrayer });
    }
  };

  const handleMethodChange = (method) => {
    updateAzan('calculationMethod', method);
    if (azan.enabled && azan.latitude && azan.longitude) {
      scheduleAzanNotifications({ ...azan, calculationMethod: method });
    }
  };

  const handleReset = () => {
    Alert.alert(
      'Reset All Data',
      'This will permanently delete all your tracking history. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Everything',
          style: 'destructive',
          onPress: async () => {
            await clearAllData();
            await completeOnboarding({ ...settings, onboardingDone: false });
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>‹ Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Settings</Text>
          <View style={{ width: 60 }} />
        </View>

        {/* Score weights */}
        <Section title="Score Weights">
          <View style={{ gap: 6 }}>
            {[
              { l: 'Prayers', w: weights.prayer },
              { l: 'Quran',   w: weights.quran   },
              { l: 'Zikar',   w: weights.zikar   },
              sadaqa.enabled && { l: 'Sadaqa', w: weights.sadaqa },
            ].filter(Boolean).map((row) => (
              <View key={row.l} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 14, color: COLORS.textMid }}>{row.l}</Text>
                <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.sage }}>
                  {Math.round(row.w * 100)}%
                </Text>
              </View>
            ))}
          </View>
        </Section>

        {/* Prayer targets */}
        <Section title="Prayers — Target">
          {PRAYERS.map((p, i) => (
            <React.Fragment key={p.key}>
              {i > 0 && <Divider />}
              <RowSwitch
                label={p.name}
                sub={`${p.arabic} · ${p.time}`}
                value={prayer.targetPrayers.includes(p.key)}
                onToggle={() => toggleTargetPrayer(p.key)}
              />
            </React.Fragment>
          ))}
        </Section>

        {/* Prayer details */}
        <Section title="Prayers — Details">
          <Text style={styles.detailNote}>Each tracked detail participates equally in your prayer score.</Text>
          <Divider />
          <RowSwitch label="Congregation (Jamat)" sub="Track whether you prayed in congregation or alone" value={prayer.trackCongregation} onToggle={() => updatePrayer('trackCongregation', !prayer.trackCongregation)} />
          <Divider />
          <RowSwitch label="On Time or Qaza" sub="Track on-time vs qaza prayers" value={prayer.trackOnTime} onToggle={() => updatePrayer('trackOnTime', !prayer.trackOnTime)} />
          <Divider />
          <RowSwitch label="Dua After Prayer" sub="Track 5-minute dua / reflection" value={prayer.trackDuaAfter} onToggle={() => updatePrayer('trackDuaAfter', !prayer.trackDuaAfter)} />
          <Divider />
          <RowSwitch label="Sunnah Prayers" sub="Track sunnah rakats" value={prayer.trackSunnah} onToggle={() => updatePrayer('trackSunnah', !prayer.trackSunnah)} />
        </Section>

        {/* Azan notifications */}
        <Section title="Azan Notifications">
          <RowSwitch
            label="Enable Azan Alerts"
            sub="Receive precise prayer time notifications"
            value={azan.enabled}
            onToggle={handleToggleAzan}
          />

          <Divider />

          {/* Location */}
          <View style={styles.locationRow}>
            <View style={{ flex: 1 }}>
              <Text style={rs.label}>Location</Text>
              <Text style={rs.sub}>
                {azan.latitude
                  ? azan.locationName ?? `${azan.latitude.toFixed(4)}, ${azan.longitude.toFixed(4)}`
                  : 'Not set'}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.locBtn, fetchingLocation && { opacity: 0.6 }]}
              onPress={handleFetchLocation}
              disabled={fetchingLocation}
            >
              {fetchingLocation
                ? <ActivityIndicator size="small" color="white" />
                : <Text style={styles.locBtnText}>Update</Text>}
            </TouchableOpacity>
          </View>

          {azan.latitude && (
            <>
              <Divider />
              <Text style={styles.subSectionLabel}>Calculation Method</Text>
              <ChipGroup
                options={AZAN_CALCULATION_METHODS}
                value={azan.calculationMethod}
                onSelect={handleMethodChange}
              />

              <Divider />
              <Text style={styles.subSectionLabel}>Alert per Prayer</Text>
              <View style={{ gap: 2 }}>
                {PRAYERS.map((p) => (
                  <RowSwitch
                    key={p.key}
                    label={p.name}
                    sub={`${p.arabic} · ${p.time}`}
                    value={azan.perPrayer?.[p.key] ?? true}
                    onToggle={(v) => handleTogglePerPrayer(p.key, v)}
                  />
                ))}
              </View>
            </>
          )}
        </Section>

        {/* Quran */}
        <Section title="Quran">
          <Text style={{ fontSize: 13, color: COLORS.textLight, marginBottom: 4 }}>Track by</Text>
          <ChipGroup options={QURAN_GOAL_TYPES} value={quran.goalType} onSelect={(k) => updateQuran('goalType', k)} />
          <Divider />
          <View style={styles.goalRow}>
            <Text style={{ fontSize: 15, color: COLORS.textDark }}>Daily goal</Text>
            <View style={styles.miniStepper}>
              <TouchableOpacity onPress={() => updateQuran('goalAmount', Math.max(1, quran.goalAmount - 1))} style={styles.miniBtn}>
                <Text style={styles.miniBtnText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.miniVal}>{quran.goalAmount}</Text>
              <TouchableOpacity onPress={() => updateQuran('goalAmount', quran.goalAmount + 1)} style={styles.miniBtn}>
                <Text style={styles.miniBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Section>

        {/* Zikar */}
        <Section title="Zikar">
          {ZIKAR_PRESETS.map((z, i) => {
            const item = zikar.items.find((it) => it.key === z.key);
            return (
              <React.Fragment key={z.key}>
                {i > 0 && <Divider />}
                <RowSwitch
                  label={z.label}
                  sub={z.arabic}
                  value={item?.enabled ?? true}
                  onToggle={() => toggleZikarItem(z.key)}
                />
              </React.Fragment>
            );
          })}
        </Section>

        {/* Sadaqa */}
        <Section title="Sadaqa">
          <RowSwitch label="Track Sadaqa" sub="Include in soul score" value={sadaqa.enabled} onToggle={() => updateSadaqa('enabled', !sadaqa.enabled)} />
          {sadaqa.enabled && (
            <>
              <Divider />
              <Text style={{ fontSize: 13, color: COLORS.textLight, marginBottom: 4 }}>Frequency</Text>
              <ChipGroup options={SADAQA_FREQUENCIES} value={sadaqa.frequency} onSelect={(k) => updateSadaqa('frequency', k)} />
            </>
          )}
        </Section>

        {/* Data */}
        <Section title="Data">
          <TouchableOpacity onPress={handleReset} style={styles.resetBtn}>
            <Text style={styles.resetBtnText}>Reset All Data</Text>
          </TouchableOpacity>
        </Section>

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: COLORS.parchment },
  scroll: { paddingHorizontal: 20 },

  header:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 16, paddingBottom: 20 },
  backBtn:  { width: 60 },
  backText: { fontSize: 17, color: COLORS.sage, fontWeight: '500' },
  title:    { fontSize: 22, fontWeight: '700', color: COLORS.textDark },

  detailNote: { fontSize: 12, color: COLORS.textLight, fontStyle: 'italic', marginBottom: 4 },

  locationRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  locBtn:      { backgroundColor: COLORS.sage, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, minWidth: 72, alignItems: 'center' },
  locBtnText:  { fontSize: 13, color: 'white', fontWeight: '600' },
  subSectionLabel: { fontSize: 12, color: COLORS.textLight, fontWeight: '600', letterSpacing: 0.4, textTransform: 'uppercase', marginTop: 4, marginBottom: 2 },

  goalRow:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  miniStepper:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
  miniBtn:      { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.parchmentDeep, justifyContent: 'center', alignItems: 'center' },
  miniBtnText:  { fontSize: 18, color: COLORS.textDark, fontWeight: '400' },
  miniVal:      { fontSize: 17, fontWeight: '600', color: COLORS.textDark, minWidth: 32, textAlign: 'center' },

  resetBtn:     { paddingVertical: 12, alignItems: 'center', borderRadius: 12, backgroundColor: 'rgba(158,80,80,0.08)', borderWidth: 1, borderColor: 'rgba(158,80,80,0.2)' },
  resetBtnText: { fontSize: 15, color: '#9E5050', fontWeight: '600' },
});
