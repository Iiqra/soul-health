import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Animated, View } from 'react-native';
import Svg, { Circle, Ellipse, Path, G, Line } from 'react-native-svg';

// ─── Color Helpers ───────────────────────────────────────────────────────────

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

function lerpColor(colorA, colorB, t) {
  const [r1, g1, b1] = hexToRgb(colorA);
  const [r2, g2, b2] = hexToRgb(colorB);
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);
  return `rgb(${r},${g},${b})`;
}

function lerp3Color(c0, c1, c2, t) {
  if (t <= 0.5) return lerpColor(c0, c1, t * 2);
  return lerpColor(c1, c2, (t - 0.5) * 2);
}

// ─── Sub-components ──────────────────────────────────────────────────────────

/** A 4-pointed star sparkle */
function Star({ cx, cy, r, fill, opacity }) {
  const s = r * 0.38;
  return (
    <Path
      d={`M ${cx} ${cy - r} L ${cx + s} ${cy} L ${cx} ${cy + r} L ${cx - s} ${cy} Z`}
      fill={fill}
      opacity={opacity}
    />
  );
}

/** A simple daisy flower */
function Flower({ cx, cy, scale, opacity }) {
  if (opacity <= 0) return null;
  const pr = 4.5 * scale;
  const pd = 8 * scale;
  const petals = Array.from({ length: 6 }, (_, i) => {
    const angle = (i / 6) * Math.PI * 2 - Math.PI / 2;
    return {
      px: cx + Math.cos(angle) * pd,
      py: cy + Math.sin(angle) * pd,
    };
  });
  return (
    <G opacity={opacity}>
      <Line
        x1={cx} y1={cy + pr + pd}
        x2={cx} y2={cy + pr + pd + 18 * scale}
        stroke="#5A8060" strokeWidth={1.8}
      />
      {petals.map((p, i) => (
        <Circle key={i} cx={p.px} cy={p.py} r={pr} fill="#F0D878" />
      ))}
      <Circle cx={cx} cy={cy} r={5 * scale} fill="#C9A040" />
    </G>
  );
}

// ─── Main Character ───────────────────────────────────────────────────────────

/**
 * SoulCharacter — animated spiritual health avatar.
 *
 * Props:
 *   health  0–100  current health score
 *   size    number base size in dp (default 200)
 */
export default function SoulCharacter({ health = 50, size = 200 }) {
  // Normalised 0-1 health
  const t = Math.max(0, Math.min(100, health)) / 100;

  // Floating animation (Animated.Value, native driver)
  const floatAnim = useRef(new Animated.Value(0)).current;

  // Cycle time drives glow pulse & sparkle twinkle (JS thread, 20fps)
  const [cycleTime, setCycleTime] = useState(0);

  useEffect(() => {
    // Float up / down
    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -9, duration: 2300, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 2300, useNativeDriver: true }),
      ])
    );
    floatLoop.start();

    // Cycle timer for SVG-level animations
    const startMs = Date.now();
    const iv = setInterval(() => {
      setCycleTime((Date.now() - startMs) / 1000);
    }, 50);

    return () => {
      floatLoop.stop();
      clearInterval(iv);
    };
  }, []);

  // ── Appearance values derived from health ──────────────────────────────────
  const robeColor   = lerp3Color('#9A9A9A', '#7FA68E', '#4A7A52', t);
  const coverColor  = lerp3Color('#828282', '#6A9278', '#3A6844', t);
  const skinColor   = lerp3Color('#C8B8B0', '#DCC8A8', '#F0D5A8', t);
  const auraColor   = lerp3Color('#7090A8', '#98C0A8', '#FFE068', t);
  const eyeColor    = '#3A2A22';
  const mouthColor  = lerp3Color('#907070', '#806858', '#6A4840', t);

  const eyeRY       = 5 + t * 5.5;          // closed(5) → wide open(10.5)
  const smileDepth  = -7 + t * 22;           // frown(-7) → big smile(15)
  const cheekOp     = Math.max(0, (t - 0.38) / 0.62) * 0.30;
  const eyelidOp    = Math.max(0, (0.36 - t) / 0.36) * 0.92;
  const tearOp      = Math.max(0, (0.22 - t) / 0.22);
  const haloOp      = Math.max(0, (t - 0.28) / 0.72) * 0.85;
  const sparkOp     = Math.max(0, (t - 0.52) / 0.48);
  const flowerOp    = Math.max(0, (t - 0.60) / 0.40);
  const flowerSc    = 0.5 + flowerOp * 0.5;

  // ── Cycle-based (glow pulse, sparkle twinkle) ─────────────────────────────
  const pulse   = 0.5 + 0.5 * Math.sin(cycleTime * Math.PI * 1.1);
  const glowR   = 60 + t * 26;
  const glowOp  = (t * 0.26 + 0.04) * (0.65 + 0.35 * pulse);

  const sin = (offset) => Math.abs(Math.sin(cycleTime * 2.5 + offset));
  const s1 = sparkOp * (0.25 + 0.75 * sin(0));
  const s2 = sparkOp * (0.25 + 0.75 * sin(1.1));
  const s3 = sparkOp * (0.25 + 0.75 * sin(2.2));
  const s4 = sparkOp * (0.25 + 0.75 * sin(3.3));
  const s5 = sparkOp * (0.25 + 0.75 * sin(4.4));

  // Scale the whole SVG to requested size
  const svgW = size;
  const svgH = size * 1.45;

  return (
    <Animated.View style={{ transform: [{ translateY: floatAnim }] }}>
      <Svg width={svgW} height={svgH} viewBox="0 0 200 290">

        {/* ── Outer aura glow ── */}
        <Circle cx={100} cy={148} r={glowR} fill={auraColor} opacity={glowOp} />

        {/* ── Ground shadow ── */}
        <Ellipse cx={100} cy={268} rx={46} ry={10} fill="#7A6858" opacity={0.18} />

        {/* ── Flowers at feet (high health) ── */}
        <Flower cx={62}  cy={248} scale={flowerSc} opacity={flowerOp} />
        <Flower cx={138} cy={248} scale={flowerSc} opacity={flowerOp} />

        {/* ── Robe body ── */}
        <Path
          d="M 72 112 C 64 130 56 164 57 204 C 58 234 76 264 100 266 C 124 264 142 234 143 204 C 144 164 136 130 128 112 Z"
          fill={robeColor}
        />

        {/* Robe centre-fold highlight */}
        <Path
          d="M 94 118 C 92 162 91 212 94 260 Q 100 268 106 260 C 109 212 108 162 106 118 Q 100 110 94 118 Z"
          fill="#FFFFFF"
          opacity={0.07}
        />

        {/* ── Left sleeve ── */}
        <Path
          d="M 68 142 C 57 147 44 160 46 176 C 47 187 60 186 65 178 L 72 157 Z"
          fill={robeColor}
        />

        {/* ── Right sleeve ── */}
        <Path
          d="M 132 142 C 143 147 156 160 154 176 C 153 187 140 186 135 178 L 128 157 Z"
          fill={robeColor}
        />

        {/* ── Hands ── */}
        <Circle cx={46}  cy={179} r={9.5} fill={skinColor} />
        <Circle cx={154} cy={179} r={9.5} fill={skinColor} />

        {/* ── Head ── */}
        <Circle cx={100} cy={78} r={41} fill={skinColor} />

        {/* ── Kufi cap (small Islamic rounded cap) ── */}
        <Path
          d="M 68 70 C 68 40 132 40 132 70 C 118 78 82 78 68 70 Z"
          fill={coverColor}
        />

        {/* ── Left eye ── */}
        <Ellipse cx={82} cy={78} rx={10.5} ry={eyeRY} fill="white" />
        <Ellipse cx={83} cy={79.5} rx={5.8} ry={5.8 * (eyeRY / 10.5)} fill={eyeColor} />
        <Circle  cx={79} cy={75} r={2.2} fill="white" />

        {/* ── Right eye ── */}
        <Ellipse cx={118} cy={78} rx={10.5} ry={eyeRY} fill="white" />
        <Ellipse cx={117} cy={79.5} rx={5.8} ry={5.8 * (eyeRY / 10.5)} fill={eyeColor} />
        <Circle  cx={122} cy={75} r={2.2} fill="white" />

        {/* ── Eyebrows ── */}
        <Path
          d={`M 73 ${65 - t * 3} Q 82 ${60 - t * 3} 91 ${65 - t * 3}`}
          stroke={eyeColor} strokeWidth={2.2} strokeLinecap="round" fill="none"
        />
        <Path
          d={`M 109 ${65 - t * 3} Q 118 ${60 - t * 3} 127 ${65 - t * 3}`}
          stroke={eyeColor} strokeWidth={2.2} strokeLinecap="round" fill="none"
        />

        {/* ── Nose ── */}
        <Circle cx={100} cy={92} r={2.8} fill={mouthColor} opacity={0.55} />

        {/* ── Mouth ── */}
        <Path
          d={`M 86 102 Q 100 ${102 + smileDepth} 114 102`}
          stroke={mouthColor} strokeWidth={2.8} fill="none" strokeLinecap="round"
        />

        {/* ── Rosy cheeks (happy state) ── */}
        <Circle cx={70}  cy={91} r={13} fill="#F09090" opacity={cheekOp} />
        <Circle cx={130} cy={91} r={13} fill="#F09090" opacity={cheekOp} />

        {/* ── Drooping eyelids (sad state) ── */}
        <Path d="M 71 76 Q 82 70 93 76" fill={coverColor} opacity={eyelidOp} />
        <Path d="M 107 76 Q 118 70 129 76" fill={coverColor} opacity={eyelidOp} />

        {/* ── Tears (very low health) ── */}
        <Path
          d="M 82 90 C 79 98 79 104 82 104 C 85 104 85 98 82 90 Z"
          fill="#88AACC" opacity={tearOp}
        />
        <Path
          d="M 118 90 C 115 98 115 104 118 104 C 121 104 121 98 118 90 Z"
          fill="#88AACC" opacity={tearOp}
        />

        {/* ── Halo (golden arc, high health) ── */}
        <Path
          d="M 65 48 Q 100 30 135 48"
          stroke="#F8D878" strokeWidth={3.5} fill="none"
          strokeLinecap="round" opacity={haloOp}
        />

        {/* ── Sparkle stars (high health) ── */}
        <Star cx={36}  cy={92}  r={5.5} fill="#F8D878" opacity={s1} />
        <Star cx={165} cy={88}  r={4.5} fill="#F8E888" opacity={s2} />
        <Star cx={32}  cy={165} r={4}   fill="#F8D878" opacity={s3} />
        <Star cx={168} cy={158} r={4.5} fill="#F8E888" opacity={s4} />
        <Star cx={100} cy={22}  r={6}   fill="#F8D878" opacity={s5} />
        <Star cx={145} cy={258} r={3.5} fill="#F8E888" opacity={s1 * flowerOp} />
        <Star cx={55}  cy={258} r={3.5} fill="#F8D878" opacity={s3 * flowerOp} />

      </Svg>
    </Animated.View>
  );
}
