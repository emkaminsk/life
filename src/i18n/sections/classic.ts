/** Classic Life (Conway) mode: mode switch, settings form, rules, patterns and the side panel. */
export interface ClassicKeys {
  mode: {
    legend: string;
    ecosystem: string;
    classic: string;
    hint: string;
  };
  /** Header counter in classic mode. */
  generation: string;
  form: {
    title: string;
    width: string;
    height: string;
    rule: string;
    customRule: string;
    customPlaceholder: string;
    customHelp: string;
    start: string;
    startRandom: string;
    startPattern: string;
    startDraw: string;
    density: string;
    pattern: string;
    drawInfo: string;
  };
  rules: {
    conway: string;
    highlife: string;
    seeds: string;
    dayNight: string;
    custom: string;
  };
  /** describeRule() building blocks; {0} placeholders are numbers or lists of numbers. */
  explain: {
    sentence: string;
    born: string;
    neverBorn: string;
    survives: string;
    neverSurvives: string;
    exactly: string;
    or: string;
  };
  patterns: {
    glider: string;
    lwss: string;
    pulsar: string;
    rPentomino: string;
    gosperGun: string;
    acorn: string;
    diehard: string;
    pentadecathlon: string;
  };
  errors: {
    size: string;
    rule: string;
    patternTooBig: string;
  };
  panel: {
    title: string;
    generation: string;
    population: string;
    rule: string;
    drawHint: string;
    extinct: string;
    stable: string;
    oscillating: string;
    patternTooBig: string;
  };
}

export const en: ClassicKeys = {
  mode: {
    legend: 'Game',
    ecosystem: '🌳 Ecosystem',
    classic: '⬛ Classic Life',
    hint: 'Classic Life: cells live or die by their neighbours (Conway).',
  },
  generation: 'Generation: {0}',
  form: {
    title: '⬛ Classic Life settings',
    width: 'Board width (cells):',
    height: 'Board height (cells):',
    rule: 'Rule:',
    customRule: 'Your rule (B/S):',
    customPlaceholder: 'e.g. B3/S23',
    customHelp: 'B = neighbour counts that bring a dead cell to life, S = counts that keep a live cell alive.',
    start: 'How to start',
    startRandom: '🎲 Random cells',
    startPattern: '✨ A famous pattern',
    startDraw: '✏️ Draw it myself',
    density: 'Live cells at start: {0}%',
    pattern: 'Pattern:',
    drawInfo: 'The board starts empty and paused: tap or click cells to bring them to life, then press Run Free.',
  },
  rules: {
    conway: "Conway's Life (B3/S23)",
    highlife: 'HighLife (B36/S23)',
    seeds: 'Seeds (B2/S)',
    dayNight: 'Day & Night (B3678/S34678)',
    custom: 'My own rule…',
  },
  explain: {
    sentence: '{0}: {1}; {2}.',
    born: 'a dead cell with {0} neighbours is born',
    neverBorn: 'no new cells are ever born',
    survives: 'a live cell with {0} survives',
    neverSurvives: 'every live cell dies after one generation',
    exactly: 'exactly {0}',
    or: ' or ',
  },
  patterns: {
    glider: 'Glider (walks diagonally)',
    lwss: 'Spaceship (flies sideways)',
    pulsar: 'Pulsar (blinks every 3 steps)',
    rPentomino: 'R-pentomino (5 cells, lots of chaos)',
    gosperGun: 'Glider gun (shoots gliders)',
    acorn: 'Acorn (grows for a long time)',
    diehard: 'Diehard (vanishes after 130 steps)',
    pentadecathlon: 'Pentadecathlon (repeats every 15 steps)',
  },
  errors: {
    size: 'Enter a whole number from {0} to {1}.',
    rule: 'Write the rule like B3/S23: B, digits 0–8, a slash, S, digits 0–8.',
    patternTooBig: 'This pattern needs a board of at least {0}×{1} cells.',
  },
  panel: {
    title: '⬛ Classic Life',
    generation: 'Generation',
    population: 'Live cells',
    rule: 'Rule',
    drawHint: '✏️ Paused: tap a cell to switch it on or off, or drag to paint.',
    extinct: '💀 All cells have died. Press Reset to try another start.',
    stable: '🪨 Nothing changes any more: the board is frozen (a still life).',
    oscillating: '🔁 The board flips back and forth between two pictures (period 2).',
    patternTooBig: 'The pattern does not fit on this board.',
  },
};

export const pl: ClassicKeys = {
  mode: {
    legend: 'Gra',
    ecosystem: '🌳 Ekosystem',
    classic: '⬛ Klasyczne Życie',
    hint: 'Klasyczne Życie: komórki żyją lub giną zależnie od sąsiadów (Conway).',
  },
  generation: 'Pokolenie: {0}',
  form: {
    title: '⬛ Ustawienia Klasycznego Życia',
    width: 'Szerokość planszy (komórki):',
    height: 'Wysokość planszy (komórki):',
    rule: 'Reguła:',
    customRule: 'Twoja reguła (B/S):',
    customPlaceholder: 'np. B3/S23',
    customHelp:
      'B = liczby sąsiadów, przy których martwa komórka ożywa, S = liczby, przy których żywa komórka przeżywa.',
    start: 'Jak zacząć',
    startRandom: '🎲 Losowe komórki',
    startPattern: '✨ Słynny wzór',
    startDraw: '✏️ Narysuję sam',
    density: 'Żywe komórki na start: {0}%',
    pattern: 'Wzór:',
    drawInfo:
      'Plansza startuje pusta i zatrzymana: dotknij lub kliknij komórki, aby je ożywić, a potem naciśnij Uruchom Swobodnie.',
  },
  rules: {
    conway: 'Życie Conwaya (B3/S23)',
    highlife: 'HighLife (B36/S23)',
    seeds: 'Nasiona (B2/S)',
    dayNight: 'Dzień i Noc (B3678/S34678)',
    custom: 'Moja własna reguła…',
  },
  explain: {
    sentence: '{0}: {1}; {2}.',
    born: 'martwa komórka z {0} sąsiadami ożywa',
    neverBorn: 'nowe komórki nigdy się nie rodzą',
    survives: 'żywa komórka z {0} sąsiadami przeżywa',
    neverSurvives: 'każda żywa komórka ginie po jednym pokoleniu',
    exactly: 'dokładnie {0}',
    or: ' lub ',
  },
  patterns: {
    glider: 'Szybowiec (idzie po skosie)',
    lwss: 'Statek kosmiczny (leci w bok)',
    pulsar: 'Pulsar (mruga co 3 kroki)',
    rPentomino: 'R-pentomino (5 komórek, mnóstwo chaosu)',
    gosperGun: 'Działo (wystrzeliwuje szybowce)',
    acorn: 'Żołądź (rośnie bardzo długo)',
    diehard: 'Twardziel (znika po 130 krokach)',
    pentadecathlon: 'Pentadekathlon (powtarza się co 15 kroków)',
  },
  errors: {
    size: 'Wpisz liczbę całkowitą od {0} do {1}.',
    rule: 'Zapisz regułę jak B3/S23: B, cyfry 0–8, ukośnik, S, cyfry 0–8.',
    patternTooBig: 'Ten wzór potrzebuje planszy co najmniej {0}×{1} komórek.',
  },
  panel: {
    title: '⬛ Klasyczne Życie',
    generation: 'Pokolenie',
    population: 'Żywe komórki',
    rule: 'Reguła',
    drawHint: '✏️ Pauza: dotknij komórki, aby ją włączyć lub wyłączyć, albo przeciągnij, aby malować.',
    extinct: '💀 Wszystkie komórki zginęły. Naciśnij Reset, aby spróbować innego startu.',
    stable: '🪨 Nic się już nie zmienia: plansza zamarła (martwa natura).',
    oscillating: '🔁 Plansza przeskakuje tam i z powrotem między dwoma obrazkami (okres 2).',
    patternTooBig: 'Wzór nie mieści się na tej planszy.',
  },
};
