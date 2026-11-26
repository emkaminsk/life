/** Classic Life (Conway) mode: mode switch, form and panel (owned by workstream W-C; W0 stub). */
export interface ClassicKeys {
  mode: {
    legend: string;
    ecosystem: string;
    classic: string;
    hint: string;
  };
  /** Header counter in classic mode. */
  generation: string;
}

export const en: ClassicKeys = {
  mode: {
    legend: 'Game',
    ecosystem: '🌳 Ecosystem',
    classic: '⬛ Classic Life',
    hint: 'Classic Life: cells live or die by their neighbours (Conway).',
  },
  generation: 'Generation: {0}',
};

export const pl: ClassicKeys = {
  mode: {
    legend: 'Gra',
    ecosystem: '🌳 Ekosystem',
    classic: '⬛ Klasyczne Życie',
    hint: 'Klasyczne Życie: komórki żyją lub giną zależnie od sąsiadów (Conway).',
  },
  generation: 'Pokolenie: {0}',
};
