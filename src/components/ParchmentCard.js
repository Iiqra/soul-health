import React from 'react';
import { View, StyleSheet } from 'react-native';
import { COLORS } from '../constants/colors';

export default function ParchmentCard({ children, style, padding = 16 }) {
  return (
    <View style={[styles.card, { padding }, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(139,118,214,0.18)',
    shadowColor: '#4A3AAA',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
});
