import React from 'react';
import Svg, { Circle, Path, Line, Rect } from 'react-native-svg';

export default function TabBarIcon({ name, color, size = 24 }) {
  const s = size;
  const c = color;

  switch (name) {
    case 'home':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24">
          <Path
            d="M3 12L12 4L21 12V21H15V15H9V21H3V12Z"
            stroke={c} strokeWidth={1.8} fill="none"
            strokeLinecap="round" strokeLinejoin="round"
          />
        </Svg>
      );

    case 'prayers':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24">
          {/* Crescent moon — prayer symbol */}
          <Path
            d="M 21 12.79 A 9 9 0 1 1 11.21 3 A 7 7 0 0 0 21 12.79 Z"
            stroke={c} strokeWidth={1.7} fill="none" strokeLinecap="round"
          />
        </Svg>
      );

    case 'quran':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24">
          {/* Open book */}
          <Path d="M12 6C10 5 7 5 5 6V19C7 18 10 18 12 19" stroke={c} strokeWidth={1.8} fill="none" strokeLinecap="round" />
          <Path d="M12 6C14 5 17 5 19 6V19C17 18 14 18 12 19" stroke={c} strokeWidth={1.8} fill="none" strokeLinecap="round" />
          <Line x1={12} y1={6} x2={12} y2={19} stroke={c} strokeWidth={1.8} />
        </Svg>
      );

    case 'zikar':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24">
          {/* Beads on a loop */}
          <Circle cx={12} cy={4.5} r={2}  stroke={c} strokeWidth={1.7} fill="none" />
          <Circle cx={18.5} cy={9}  r={1.6} stroke={c} strokeWidth={1.5} fill="none" />
          <Circle cx={20}   cy={15} r={1.6} stroke={c} strokeWidth={1.5} fill="none" />
          <Circle cx={16}   cy={20} r={1.6} stroke={c} strokeWidth={1.5} fill="none" />
          <Circle cx={10}   cy={21} r={1.6} stroke={c} strokeWidth={1.5} fill="none" />
          <Circle cx={5}    cy={18} r={1.6} stroke={c} strokeWidth={1.5} fill="none" />
          <Circle cx={3}    cy={12} r={1.6} stroke={c} strokeWidth={1.5} fill="none" />
          <Circle cx={6}    cy={7}  r={1.6} stroke={c} strokeWidth={1.5} fill="none" />
          {/* String connection (partial arc) */}
          <Path
            d="M 12 6.5 C 16 6.5 20 8 20 13 C 20 18 16 22 12 22 C 8 22 4 18.5 4 13 C 4 8 7.5 6.5 12 6.5"
            stroke={c} strokeWidth={1} fill="none" opacity={0.4}
          />
        </Svg>
      );

    case 'sadaqa':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24">
          {/* Open palm with coin */}
          <Path
            d="M 8 14 C 7 12 7 10 7 9 C 7 8 8 7.5 9 8 L 9 11"
            stroke={c} strokeWidth={1.7} fill="none" strokeLinecap="round"
          />
          <Path
            d="M 9 8 C 9 6.5 10.5 6 11 7.5 L 11 11"
            stroke={c} strokeWidth={1.7} fill="none" strokeLinecap="round"
          />
          <Path
            d="M 11 7.5 C 11 6 12.5 5.5 13 7 L 13 11"
            stroke={c} strokeWidth={1.7} fill="none" strokeLinecap="round"
          />
          <Path
            d="M 13 7 C 13 5.5 15 5.5 15 7.5 L 15 11 L 19 9.5 C 20.5 9 21 10.5 20 11.5 L 15 16 C 14 17 12 18 10 18 L 7 18 L 7 14"
            stroke={c} strokeWidth={1.7} fill="none" strokeLinecap="round" strokeLinejoin="round"
          />
          <Circle cx={18} cy={6.5} r={2.5} stroke={c} strokeWidth={1.5} fill="none" />
        </Svg>
      );

    default:
      return null;
  }
}
