# Soul Health — App Plan

## Vision

A "brain rot"-style spiritual companion app where a living animated character named **Noor** reflects the real-time health of your soul. The more consistent your spiritual practice, the healthier and happier Noor looks. Neglect it, and Noor visibly suffers. Simple, addictive, meaningful.

---

## Core Concept

Noor is the heart of the app. Every action the user takes — or skips — is reflected immediately in Noor's appearance and mood. The goal is to make the user feel emotionally connected to their spiritual progress through a character that reacts like a living being.

---

## Noor — The Soul Character

### Mood States (based on soul health score)

| Score Range | Noor State     | Description                                      |
|-------------|----------------|--------------------------------------------------|
| 90–100%     | Radiant        | Glowing, sparkles, golden halo, wide smile       |
| 75–89%      | Happy          | Bright eyes, soft smile, gentle glow             |
| 60–74%      | Content        | Calm, steady, neutral positive                   |
| 45–59%      | Blushing       | Slightly flushed, unsure look, trying            |
| 30–44%      | Confused        | Droopy eyes, question marks, dull colors         |
| 15–29%      | Sad            | Tears, grey tones, slumped posture               |
| 0–14%       | Still / Hollow | No glow, faded, eyes closed, barely moving      |

### Noor Visual Details
- Animated SVG / Lottie character
- Smooth transitions between states — no abrupt jumps
- Small ambient animations always running (breathing, blinking)
- Reacts to user actions in real time (e.g., logging a prayer makes Noor smile briefly)
- Sparkles/tears/halos as layered effects on top of base character

---

## Spiritual Pillars (Tracking Sections)

### 1. Namaz (Prayer)
- 5 daily prayers: Fajr, Dhuhr, Asr, Maghrib, Isha
- Each prayer logged as: On Time / Qaza / Missed
- Bonus tracking: Prayed with Jamat or Alone
- Weekly prayer streak display
- Contributes most heavily to soul score (~40%)

### 2. Quran
- Daily reading goal set by user (e.g., 1 page, 5 ayahs, 1 ruku)
- Simple tap to log completion
- Streak tracking
- Contributes ~30% to soul score

### 3. Zikar
- User selects which azkar to track daily (e.g., Subhanallah x33, Istighfar, Durood)
- Counter-style interface — tap to count, or mark as done
- Morning/Evening azkar categories
- Contributes ~20% to soul score

### 4. Sadaqa
- Log acts of charity (money, time, kindness)
- Non-numerical — qualitative logging
- Contributes ~10% to soul score
- Bonus: can trigger special Noor reactions (extra sparkle)

---

## Soul Score System

```
Soul Score = (Namaz % x 0.40) + (Quran % x 0.30) + (Zikar % x 0.20) + (Sadaqa % x 0.10)
```

- Score is calculated daily and averaged over the last 7 days for Noor's base state
- Today's activity causes real-time micro-reactions in Noor
- Score resets contextually — missing Fajr doesn't tank the whole week

---

## Onboarding — Spiritual Goals Wizard

A guided 6-step setup flow the first time the user opens the app.

### Step 1 — Welcome
- Introduce Noor with a short animation
- Brief explanation of how the app works

### Step 2 — Location
- Ask for city/location (text search using Nominatim or similar)
- Optional: request GPS permission for automatic detection
- Used to calculate accurate prayer times

### Step 3 — Prayer Goals
- How many prayers do you want to track? (All 5 recommended)
- Target: On Time / At Least Prayed / Flexible

### Step 4 — Quran Goal
- Daily reading target (Pages / Ayahs / Juz)
- Pick a number

### Step 5 — Zikar
- Choose which daily azkar to track
- Pre-set bundles: Morning Azkar, Evening Azkar, Custom

### Step 6 — Notifications & Calendar
- Enable prayer time reminders? (Yes/No)
- Add prayer times to device calendar? (Yes/No)
- Add prayer times as tasks? (Yes/No)
- Reminder style: Gentle / Standard / Persistent

---

## Settings — Edit Goals Anytime

All onboarding choices must be easily editable from Settings without re-running the wizard.

### Settings Sections
- **My Goals** — Change prayer/quran/zikar targets
- **Location** — Update city or re-enable GPS
- **Notifications** — Toggle/adjust all reminders
- **Calendar & Tasks** — Manage sync preferences
- **Appearance** — Theme toggle (light only for now)
- **About Noor** — App info, version

---

## Namaz Timings & Alarms

### Prayer Time Calculation
- Based on user's city/location
- Calculation method: Muslim World League (default), with option to change
- Times shown on Home screen daily

### Alarms / Reminders
- Per-prayer toggle (e.g., remind for Fajr only)
- Reminder offset: At time / 10 min before / 15 min before
- Notification includes prayer name, time, and a short motivational snippet
- Adhan sound option (optional, for supported platforms)

### Calendar Integration
- Add all 5 prayer times as calendar events (recurring daily)
- Events are read-only blocks so the user is mindful when scheduling meetings
- Also create as Tasks (to-do items) so they show in task managers
- Requires calendar/reminders permission — asked during onboarding step 6
- User can revoke at any time from Settings

---

## Reminders & Motivations

### Reminder Types
- **Prayer reminders** — Timed to each salah
- **Quran reminder** — Once daily at user-set time (e.g., after Fajr)
- **Zikar nudge** — Morning and/or evening push
- **Sadaqa prompt** — Weekly nudge ("Have you done something good this week?")
- **Soul check-in** — If no activity logged in 24h, gentle nudge from Noor

### Motivational Content
- Short ayahs or hadith snippets shown in notifications and on home screen
- Rotated daily
- Kept concise — one line max
- Tone: warm, non-judgmental, encouraging

---

## App Layout & Navigation

### Bottom Tab Navigation
| Tab      | Icon     | Screen                        |
|----------|----------|-------------------------------|
| Home     | House    | Noor + score + today's summary |
| Prayers  | Crescent | Namaz tracker + times         |
| Quran    | Book     | Reading log + streak          |
| Zikar    | Beads    | Counter + azkar list          |
| Sadaqa   | Heart    | Acts of charity log           |
| Settings | Gear     | All settings (accessible via top-right or tab) |

### Home Screen Layout
- Top: Noor character (large, centered, animated)
- Below Noor: Soul score ring or arc (subtle, not gamified-looking)
- Below score: Today's prayer times strip (horizontal scroll)
- Bottom section: Quick log tiles (Quran done? Zikar done? Sadaqa?)
- Daily motivational quote at very bottom

---

## Design System

### Philosophy
Clean, minimal, calm. Feels like a spiritual space — not a productivity app. No clutter, no aggressive colors, no badges.

### Color Palette
| Role         | Color          | Hex       |
|--------------|----------------|-----------|
| Background   | Warm Parchment | `#F8F5FE` |
| Primary      | Soft Sage/Lilac| `#8B76D6` |
| Accent       | Warm Gold      | `#F0906A` |
| Text Primary | Deep Charcoal  | `#2D2D2D` |
| Text Muted   | Warm Grey      | `#9E9E9E` |
| Card BG      | Off-White      | `#FFFFFF` |
| Success      | Soft Green     | `#7DC9A0` |

### Typography
- Clean sans-serif (e.g., Inter or Nunito)
- Large headings, generous line spacing
- Arabic text rendered with proper font (Amiri or similar)

### UI Principles
- Cards with soft shadows, rounded corners (16px+)
- Plenty of white space
- No harsh borders
- Micro-animations on all interactions
- Haptic feedback on prayer toggles and zikar counter

---

## Platform

- **React Native** with Expo (managed workflow)
- Expo SDK 51+, Expo Go compatible
- Target: iOS first, Android parity

### Key Libraries
| Purpose              | Library                          |
|----------------------|----------------------------------|
| Navigation           | React Navigation (bottom tabs)   |
| Animations           | React Native Reanimated + SVG    |
| Prayer Times         | adhan-js                         |
| Notifications        | Expo Notifications               |
| Calendar             | Expo Calendar                    |
| Storage              | AsyncStorage                     |
| Location             | Expo Location                    |
| Geocoding            | Nominatim (free, no API key)     |

---

## Milestones

### Phase 1 — Core Foundation
- [ ] Onboarding wizard (6 steps)
- [ ] Noor character with all mood states
- [ ] Soul score calculator
- [ ] Home screen with Noor + score

### Phase 2 — Tracking Screens
- [ ] Prayer tracker screen
- [ ] Quran log screen
- [ ] Zikar counter screen
- [ ] Sadaqa log screen

### Phase 3 — Namaz Timings & Alarms
- [ ] Prayer time calculation by location
- [ ] Per-prayer alarms/reminders
- [ ] Calendar + Task integration

### Phase 4 — Polish & Reminders
- [ ] Motivational notifications
- [ ] Soul check-in nudges
- [ ] Animated transitions between screens
- [ ] Settings screen (edit all goals)

### Phase 5 — Stretch Goals
- [ ] Journey / history view (weekly/monthly soul score graph)
- [ ] Noor special animations (Ramadan mode, Jumu'ah highlight)
- [ ] Widget support (show Noor on home screen)
- [ ] Offline-first with optional cloud backup

---

## What Makes This Different

- Noor creates **emotional accountability** — you feel it when you miss a prayer
- Not a checklist app — it's a **companion**
- Calendar blocking makes users **mindful of prayer times** when scheduling work
- Minimal design keeps it from feeling like another productivity tool
- Spiritual, not gamified — no XP, no leaderboards, no streaks as the main hook
