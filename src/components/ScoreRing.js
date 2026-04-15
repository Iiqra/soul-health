import React, { useEffect, useRef } from 'react';
import { Animated, View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { COLORS } from '../constants/colors';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default function ScoreRing({ score = 0, size = 120 }) {
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const cx = size / 2;
  const cy = size / 2;

  const animatedScore = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedScore, {
      toValue: score,
      duration: 900,
      useNativeDriver: false,
    }).start();
  }, [score]);

  const strokeDashoffset = animatedScore.interpolate({
    inputRange: [0, 100],
    outputRange: [circumference, 0],
  });

  const strokeColor =
    score <= 25 ? '#9A9A9A' :
    score <= 50 ? '#A89068' :
    score <= 65 ? COLORS.sage :
    score <= 82 ? COLORS.gold :
    COLORS.goldBright;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        {/* Track */}
        <Circle
          cx={cx} cy={cy} r={radius}
          stroke={COLORS.parchmentDeep}
          strokeWidth={8}
          fill="none"
        />
        {/* Progress */}
        <AnimatedCircle
          cx={cx} cy={cy} r={radius}
          stroke={strokeColor}
          strokeWidth={8}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          rotation={-90}
          origin={`${cx}, ${cy}`}
        />
      </Svg>
      {/* Score label in centre */}
      <View style={styles.labelContainer}>
        <Text style={[styles.score, { color: strokeColor }]}>{score}</Text>
        <Text style={styles.unit}>/ 100</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelContainer: {
    position: 'absolute',
    alignItems: 'center',
  },
  score: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 32,
  },
  unit: {
    fontSize: 11,
    color: COLORS.textLight,
    letterSpacing: 0.5,
  },
});
