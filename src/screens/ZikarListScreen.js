import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  Modal, TextInput, ScrollView, Alert, useWindowDimensions,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useHealth } from '../context/HealthContext';
import { useSettings } from '../context/SettingsContext';
import { AZKAR_CATALOG } from '../constants/spiritualData';
import { COLORS } from '../constants/colors';

const TINTS = [
  { color: '#8B76D6', bg: 'rgba(139,118,214,0.12)' },
  { color: '#68A880', bg: 'rgba(104,168,128,0.12)' },
  { color: '#C868A8', bg: 'rgba(200,104,168,0.12)' },
  { color: '#6888C8', bg: 'rgba(104,136,200,0.12)' },
  { color: '#F0906A', bg: 'rgba(240,144,106,0.12)' },
  { color: '#9068C8', bg: 'rgba(144,104,200,0.12)' },
];

export default function ZikarListScreen({ navigation }) {
  const { record, resetZikar } = useHealth();
  const { settings, updateSettings } = useSettings();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const [showAdd, setShowAdd]         = useState(false);
  const [addTab, setAddTab]           = useState('presets');
  const [customLabel, setCustomLabel] = useState('');
  const [customArabic, setCustomArabic] = useState('');
  const [customTarget, setCustomTarget] = useState('33');

  if (!record || !settings) return null;

  const items    = settings.zikar.items.filter(i => i.enabled);
  const allDone  = items.length > 0 && items.every(i => (record.zikar[i.key] ?? 0) >= i.target);

  // Catalog entries not yet in settings
  const catalogAvailable = AZKAR_CATALOG.filter(
    c => !settings.zikar.items.some(i => i.key === c.key)
  );

  // ── Add from catalog ───────────────────────────────────────────────────────
  function handleAddFromCatalog(c) {
    const newItem = {
      key: c.key, label: c.label, arabic: c.arabic,
      meaning: c.meaning, target: c.defaultTarget, enabled: true,
    };
    updateSettings({
      zikar: { ...settings.zikar, items: [...settings.zikar.items, newItem] },
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  // ── Add custom ─────────────────────────────────────────────────────────────
  function handleAddCustom() {
    if (!customLabel.trim()) {
      Alert.alert('Name required', 'Please enter a name for your zikar.');
      return;
    }
    const target = parseInt(customTarget, 10);
    if (!target || target < 1) {
      Alert.alert('Invalid target', 'Please enter a valid target count (≥ 1).');
      return;
    }
    const key = `custom_${Date.now()}`;
    updateSettings({
      zikar: {
        ...settings.zikar,
        items: [
          ...settings.zikar.items,
          { key, label: customLabel.trim(), arabic: customArabic.trim(), meaning: '', target, enabled: true },
        ],
      },
    });
    setCustomLabel(''); setCustomArabic(''); setCustomTarget('33');
    setShowAdd(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  // ── Remove item ────────────────────────────────────────────────────────────
  function handleRemove(itemKey) {
    Alert.alert('Remove Zikar', 'Remove this zikar from your list?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive',
        onPress: () => {
          resetZikar(itemKey);
          updateSettings({
            zikar: {
              ...settings.zikar,
              items: settings.zikar.items.filter(i => i.key !== itemKey),
            },
          });
        },
      },
    ]);
  }

  // ── Render card ────────────────────────────────────────────────────────────
  function renderItem({ item, index }) {
    const count = record.zikar[item.key] ?? 0;
    const pct   = Math.min(count / item.target, 1);
    const done  = count >= item.target;
    const tint  = TINTS[index % TINTS.length];

    return (
      <TouchableOpacity
        style={[styles.card, done && styles.cardDone]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          navigation.navigate('ZikarCounter', { zikarKey: item.key });
        }}
        onLongPress={() => handleRemove(item.key)}
        activeOpacity={0.82}
        delayLongPress={600}
      >
        {/* Left accent strip */}
        <View style={[styles.accentStrip, { backgroundColor: tint.color }]} />

        {/* Content */}
        <View style={styles.info}>
          {/* Arabic text — linear, truncates with ellipsis */}
          {item.arabic ? (
            <Text
              style={[styles.arabicText, { color: tint.color }]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {item.arabic}
            </Text>
          ) : null}

          {/* Label + done pill */}
          <View style={styles.topRow}>
            <Text style={[styles.label, done && { color: COLORS.textLight }]} numberOfLines={1}>
              {item.label}
            </Text>
            {done && (
              <View style={[styles.donePill, { borderColor: tint.color, backgroundColor: tint.bg }]}>
                <Text style={[styles.donePillText, { color: tint.color }]}>✓ Done</Text>
              </View>
            )}
          </View>

          {item.meaning ? (
            <Text style={styles.meaning} numberOfLines={1}>{item.meaning}</Text>
          ) : null}

          {/* Progress */}
          <View style={styles.progressRow}>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${pct * 100}%`, backgroundColor: tint.color }]} />
            </View>
            <Text style={[styles.countText, done && { color: tint.color }]}>
              {count}/{item.target}
            </Text>
          </View>
        </View>

        {/* Chevron */}
        <Text style={[styles.chevron, { color: tint.color + '80' }]}>›</Text>
      </TouchableOpacity>
    );
  }

  const contentStyle = [
    styles.listContent,
    isTablet && { maxWidth: 600, alignSelf: 'center', width: '100%' },
  ];

  return (
    <View style={styles.safe}>

      {/* ── Header ── */}
      <View style={[styles.header, isTablet && { maxWidth: 600, alignSelf: 'center', width: '100%' }]}>
        <View>
          <Text style={styles.title}>Zikar</Text>
          <Text style={styles.titleAr}>الذِّكْر</Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setShowAdd(true)}
          hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
        >
          <Text style={styles.addBtnText}>＋ Add</Text>
        </TouchableOpacity>
      </View>

      {/* ── All-done banner ── */}
      {allDone && (
        <View style={[styles.doneBanner, isTablet && { maxWidth: 600, alignSelf: 'center', width: '100%' }]}>
          <Text style={styles.doneBannerStar}>✦</Text>
          <Text style={styles.doneBannerText}>MashaAllah! All zikar complete for today</Text>
        </View>
      )}

      {/* ── List ── */}
      <FlatList
        data={items}
        keyExtractor={i => i.key}
        renderItem={renderItem}
        contentContainerStyle={contentStyle}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No zikar yet</Text>
            <Text style={styles.emptyHint}>Tap "＋ Add" to pick from presets or create your own.</Text>
          </View>
        }
        ListFooterComponent={items.length > 0
          ? <Text style={styles.longPressHint}>Long-press a card to remove it</Text>
          : null
        }
      />

      {/* ── Add Modal ── */}
      <Modal visible={showAdd} animationType="slide" transparent statusBarTranslucent>
        <View style={styles.overlay}>
          <View style={[styles.sheet, isTablet && { maxWidth: 520, alignSelf: 'center', width: '90%' }]}>

            {/* Modal header */}
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Add Zikar</Text>
              <TouchableOpacity onPress={() => setShowAdd(false)} hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                <Text style={styles.sheetClose}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Tab switch */}
            <View style={styles.tabRow}>
              {['presets', 'custom'].map(t => (
                <TouchableOpacity
                  key={t}
                  style={[styles.tab, addTab === t && styles.tabActive]}
                  onPress={() => setAddTab(t)}
                >
                  <Text style={[styles.tabText, addTab === t && styles.tabTextActive]}>
                    {t === 'presets' ? 'Presets' : 'Custom'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
              {addTab === 'presets' ? (
                catalogAvailable.length === 0 ? (
                  <Text style={styles.allAdded}>All available presets are already added.</Text>
                ) : (
                  catalogAvailable.map((c, i) => {
                    const tint = TINTS[i % TINTS.length];
                    return (
                      <TouchableOpacity
                        key={c.key}
                        style={styles.catalogRow}
                        onPress={() => handleAddFromCatalog(c)}
                        activeOpacity={0.78}
                      >
                        <View style={[styles.catalogAccent, { backgroundColor: tint.color }]} />
                        <View style={styles.catalogInfo}>
                          {c.arabic ? (
                            <Text style={[styles.catalogAr, { color: tint.color }]} numberOfLines={1}>
                              {c.arabic}
                            </Text>
                          ) : null}
                          <Text style={styles.catalogLabel}>{c.label}</Text>
                          <Text style={styles.catalogMeaning}>{c.meaning} · ×{c.defaultTarget}</Text>
                        </View>
                        <View style={[styles.addPill, { backgroundColor: tint.bg, borderColor: tint.color + '55' }]}>
                          <Text style={[styles.addPillText, { color: tint.color }]}>Add</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })
                )
              ) : (
                <View style={styles.customForm}>
                  <Text style={styles.formLabel}>Name *</Text>
                  <TextInput
                    style={styles.input}
                    value={customLabel}
                    onChangeText={setCustomLabel}
                    placeholder="e.g. Salawat"
                    placeholderTextColor={COLORS.textLight}
                  />

                  <Text style={styles.formLabel}>Arabic text (optional)</Text>
                  <TextInput
                    style={[styles.input, styles.inputAr]}
                    value={customArabic}
                    onChangeText={setCustomArabic}
                    placeholder="اللهم صل على محمد"
                    placeholderTextColor={COLORS.textLight}
                    textAlign="right"
                  />

                  <Text style={styles.formLabel}>Target count *</Text>
                  <TextInput
                    style={styles.input}
                    value={customTarget}
                    onChangeText={setCustomTarget}
                    keyboardType="number-pad"
                    placeholder="33"
                    placeholderTextColor={COLORS.textLight}
                  />

                  <TouchableOpacity style={styles.submitBtn} onPress={handleAddCustom}>
                    <Text style={styles.submitBtnText}>Add Zikar</Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.parchment },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 12,
  },
  title:   { fontSize: 26, fontWeight: '700', color: COLORS.textDark },
  titleAr: { fontSize: 18, color: COLORS.textGold, marginTop: 1 },

  addBtn: {
    backgroundColor: COLORS.sage,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  addBtnText: { color: COLORS.white, fontSize: 13, fontWeight: '700' },

  // All-done banner
  doneBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 22,
    marginBottom: 10,
    backgroundColor: 'rgba(139,118,214,0.10)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(139,118,214,0.25)',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  doneBannerStar: { fontSize: 16, color: COLORS.sage },
  doneBannerText: { fontSize: 13, fontWeight: '600', color: COLORS.sage, flex: 1 },

  // List
  listContent: { paddingHorizontal: 16, paddingBottom: 24 },

  // Card
  card: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(139,118,214,0.14)',
    marginBottom: 10,
    overflow: 'hidden',
    shadowColor: '#4A3AAA',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardDone: { opacity: 0.75 },

  accentStrip: {
    width: 4,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },

  info: { flex: 1, paddingVertical: 12, paddingHorizontal: 14, gap: 3 },

  arabicText: {
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '400',
    marginBottom: 2,
  },

  topRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label:  { fontSize: 14, fontWeight: '700', color: COLORS.textDark, flex: 1 },
  meaning:{ fontSize: 12, color: COLORS.textLight },

  donePill: {
    borderWidth: 1.2,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  donePillText: { fontSize: 10, fontWeight: '700' },

  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  track:  { flex: 1, height: 4, backgroundColor: COLORS.parchmentDeep, borderRadius: 2, overflow: 'hidden' },
  fill:   { height: '100%', borderRadius: 2 },
  countText: { fontSize: 11, color: COLORS.textLight, fontWeight: '600', minWidth: 38, textAlign: 'right' },

  chevron: { fontSize: 24, paddingRight: 12, alignSelf: 'center', fontWeight: '300' },

  // Empty state
  empty:      { alignItems: 'center', paddingTop: 60, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textMid, marginBottom: 8 },
  emptyHint:  { fontSize: 14, color: COLORS.textLight, textAlign: 'center', lineHeight: 20 },

  longPressHint: {
    textAlign: 'center',
    fontSize: 11,
    color: COLORS.textLight,
    paddingBottom: 8,
    fontStyle: 'italic',
  },

  // Modal overlay + sheet
  overlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.offWhite,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 36,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sheetTitle: { fontSize: 20, fontWeight: '700', color: COLORS.textDark },
  sheetClose: { fontSize: 18, color: COLORS.textLight, fontWeight: '600' },

  // Tabs
  tabRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.parchmentDark,
    borderRadius: 12,
    padding: 3,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 10,
    alignItems: 'center',
  },
  tabActive:     { backgroundColor: COLORS.white, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  tabText:       { fontSize: 13, color: COLORS.textLight, fontWeight: '500' },
  tabTextActive: { color: COLORS.sage, fontWeight: '700' },

  allAdded: { textAlign: 'center', fontSize: 13, color: COLORS.textLight, paddingVertical: 20 },

  // Catalog rows
  catalogRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
    overflow: 'hidden',
  },
  catalogAccent: { width: 3 },
  catalogAr:     { fontSize: 16, lineHeight: 24, marginBottom: 2 },
  catalogInfo:   { flex: 1, paddingVertical: 12, paddingHorizontal: 12 },
  catalogLabel:  { fontSize: 14, fontWeight: '700', color: COLORS.textDark },
  catalogMeaning:{ fontSize: 11, color: COLORS.textLight, marginTop: 2 },
  addPill: {
    borderWidth: 1.2,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 5,
    alignSelf: 'center',
    marginRight: 12,
  },
  addPillText: { fontSize: 12, fontWeight: '700' },

  // Custom form
  customForm:    { paddingBottom: 8 },
  formLabel:     { fontSize: 12, fontWeight: '600', color: COLORS.textMid, marginBottom: 5, marginTop: 14 },
  input: {
    backgroundColor: COLORS.parchmentDark,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    color: COLORS.textDark,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  inputAr: { fontSize: 17, lineHeight: 26 },

  submitBtn: {
    backgroundColor: COLORS.sage,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 20,
  },
  submitBtnText: { color: COLORS.white, fontSize: 15, fontWeight: '700' },
});
