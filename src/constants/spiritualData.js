export const PRAYERS = [
  { key: 'fajr',    name: 'Fajr',    arabic: 'الفجر',  time: 'Dawn'      },
  { key: 'dhuhr',   name: 'Dhuhr',   arabic: 'الظهر',  time: 'Midday'    },
  { key: 'asr',     name: 'Asr',     arabic: 'العصر',  time: 'Afternoon' },
  { key: 'maghrib', name: 'Maghrib', arabic: 'المغرب', time: 'Sunset'    },
  { key: 'isha',    name: 'Isha',    arabic: 'العشاء', time: 'Night'     },
];

export const ZIKAR_PRESETS = [
  {
    key: 'subhanallah',
    label: 'Subhanallah',
    arabic: 'سُبْحَانَ ٱللَّهِ',
    meaning: 'Glory be to Allah',
    target: 33,
  },
  {
    key: 'alhamdulillah',
    label: 'Alhamdulillah',
    arabic: 'ٱلْحَمْدُ لِلَّهِ',
    meaning: 'All praise is due to Allah',
    target: 33,
  },
  {
    key: 'allahuakbar',
    label: 'Allahu Akbar',
    arabic: 'ٱللَّهُ أَكْبَرُ',
    meaning: 'Allah is the Greatest',
    target: 34,
  },
];

export const CHARACTER_STATE_LABELS = {
  withered:   { en: 'Withered',   ar: 'مُتَذَبِّل' },
  struggling: { en: 'Struggling', ar: 'يُكَافِح'  },
  neutral:    { en: 'Peaceful',   ar: 'هَادِئ'    },
  glowing:    { en: 'Glowing',    ar: 'مُشْرِق'   },
  radiant:    { en: 'Radiant',    ar: 'نُورَانِيّ' },
};

export const MOTIVATIONAL_VERSES = [
  '"Verily, with every hardship comes ease." — Quran 94:5',
  '"Allah does not burden a soul beyond that it can bear." — Quran 2:286',
  '"Remember Me, and I will remember you." — Quran 2:152',
  '"Indeed, prayer prohibits immorality and wrongdoing." — Quran 29:45',
  '"The best among you are those who learn the Quran and teach it." — Hadith',
];

export const QURAN_GOAL_TYPES = [
  { key: 'pages',  label: 'Pages',  arabic: 'صفحات' },
  { key: 'ruku',   label: 'Ruku',   arabic: 'ركوع'  },
  { key: 'verses', label: 'Verses', arabic: 'آيات'  },
];

export const SADAQA_FREQUENCIES = [
  { key: 'daily',   label: 'Daily',   arabic: 'يومياً'   },
  { key: 'weekly',  label: 'Weekly',  arabic: 'أسبوعياً' },
  { key: 'monthly', label: 'Monthly', arabic: 'شهرياً'   },
];

export const SADAQA_TYPES = [
  { key: 'money',    label: 'Money',     icon: '💰' },
  { key: 'food',     label: 'Food',      icon: '🍱' },
  { key: 'clothes',  label: 'Clothes',   icon: '👕' },
  { key: 'time',     label: 'Time / Help', icon: '🤝' },
  { key: 'knowledge',label: 'Knowledge', icon: '📚' },
  { key: 'other',    label: 'Other',     icon: '✨' },
];

export const SADAQA_RECIPIENTS = [
  { key: 'family',    label: 'Family'     },
  { key: 'neighbour', label: 'Neighbour'  },
  { key: 'poor',      label: 'Poor / Needy' },
  { key: 'masjid',    label: 'Masjid'     },
  { key: 'charity',   label: 'Charity'    },
  { key: 'orphan',    label: 'Orphan'     },
  { key: 'other',     label: 'Other'      },
];

export const AZAN_CALCULATION_METHODS = [
  { key: 'MuslimWorldLeague',        label: 'Muslim World League'        },
  { key: 'Egyptian',                  label: 'Egyptian'                   },
  { key: 'Karachi',                   label: 'Karachi (Hanafi)'           },
  { key: 'UmmAlQura',                 label: 'Umm Al-Qura (Mecca)'       },
  { key: 'NorthAmerica',              label: 'North America (ISNA)'       },
  { key: 'Dubai',                     label: 'Dubai'                      },
  { key: 'MoonsightingCommittee',     label: 'Moonsighting Committee'     },
];
