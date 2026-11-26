/** Rules modal (owned by the rules / app-shell workstream). */
export interface RulesKeys {
  title: string;
  tabGameRules: string;
  tabCreatures: string;
  tabPlants: string;
  tabControls: string;

  // Game Rules tab content
  gameRulesTitle: string;
  roundPriorityTitle: string;
  roundPriorityDesc: string;
  phase1Movement: string;
  phase2Combat: string;
  phase3Eating: string;
  phase4Reproduction: string;
  phase5Death: string;
  phase6Birth: string;
  phase7Spawn: string;
  importantRulesTitle: string;
  importantRule1: string;
  importantRule2: string;
  importantRule3: string;

  // Creatures tab content
  creaturesTitle: string;
  malesTitle: string;
  malesDesc: string;
  femalesTitle: string;
  femalesDesc: string;
  wolvesTitle: string;
  wolvesDesc: string;
  dogsTitle: string;
  dogsDesc: string;

  // Plants tab content
  plantsTitle: string;
  fruitsTitle: string;
  fruitsDesc: string;
  mushroomsTitle: string;
  mushroomsDesc: string;
  mushroomsWarning: string;

  // Controls tab content
  controlsTitle: string;
  keyboardShortcutsTitle: string;
  keySpace: string;
  keyRight: string;
  keyUp: string;
  keyDown: string;
  keyLeft: string;
  mouseControlsTitle: string;
  mouseDesc: string;
}

export const en: RulesKeys = {
  title: 'Game Rules',
  tabGameRules: 'Game Rules',
  tabCreatures: 'Creatures',
  tabPlants: 'Plants',
  tabControls: 'Controls',

  gameRulesTitle: 'How the Game Works',
  roundPriorityTitle: 'Round Priority Order',
  roundPriorityDesc: 'Each round executes in this exact order:',
  phase1Movement: '1. Movement - Creatures move toward targets',
  phase2Combat: '2. Combat - Damage dealt between adjacent creatures',
  phase3Eating: '3. Eating - Humans consume adjacent plants',
  phase4Reproduction: '4. Reproduction - Pregnancy initiated',
  phase5Death: '5. Death - Creatures with health ≤ 0 removed',
  phase6Birth: '6. Birth - New humans born from pregnancy',
  phase7Spawn: '7. Spawn - New plants and animals spawn on empty cells',
  importantRulesTitle: 'Important Rules',
  importantRule1: 'All creatures complete each phase before the next begins',
  importantRule2: 'Creatures age each round and may die from old age',
  importantRule3: 'Only one entity can occupy a cell at any time',

  creaturesTitle: 'Creature Types',
  malesTitle: '🧑‍🦰 Male Humans',
  malesDesc:
    'Males move toward fruits and fight wolves. They compete with other males for territory. Males can reproduce with adjacent females.',
  femalesTitle: '👩 Female Humans',
  femalesDesc:
    'Females move toward fruits and can become pregnant. Pregnancy lasts several rounds before giving birth. Pregnant females show 🤰.',
  wolvesTitle: '🐺 Wolves',
  wolvesDesc: 'Wolves hunt humans and deal damage when adjacent. Males fight back against wolves, but females do not.',
  dogsTitle: '🐕 Dogs',
  dogsDesc:
    'Dogs protect humans by attacking wolves. When adjacent to a wolf, dogs deal damage to protect the ecosystem.',

  plantsTitle: 'Plant Types',
  fruitsTitle: '🍎 Fruits',
  fruitsDesc:
    'Fruits heal humans when eaten. New fruits are unripe (🍏) and become ripe (🍎) after several rounds. Only ripe fruits can be eaten.',
  mushroomsTitle: '🍄 Mushrooms',
  mushroomsDesc:
    'Mushrooms are poisonous plants that damage humans when eaten. They spawn randomly and are immediately dangerous.',
  mushroomsWarning: '⚠️ Warning: Mushrooms reduce health!',

  controlsTitle: 'Controls',
  keyboardShortcutsTitle: 'Keyboard Shortcuts',
  keySpace: 'Space - Pause/Play toggle',
  keyRight: 'Right Arrow - Advance 1 round (when paused)',
  keyUp: 'Up Arrow - Advance 5 rounds (when paused)',
  keyDown: 'Down Arrow - Pause simulation',
  keyLeft: 'Left Arrow - Pause simulation',
  mouseControlsTitle: 'Mouse Controls',
  mouseDesc: 'Use buttons in the control panel to manage the simulation. Click "?" to view these rules anytime.',
};

export const pl: RulesKeys = {
  title: 'Zasady Gry',
  tabGameRules: 'Zasady Gry',
  tabCreatures: 'Stworzenia',
  tabPlants: 'Rośliny',
  tabControls: 'Sterowanie',

  gameRulesTitle: 'Jak Działa Gra',
  roundPriorityTitle: 'Kolejność Priorytetów Rundy',
  roundPriorityDesc: 'Każda runda wykonuje się w tej dokładnej kolejności:',
  phase1Movement: '1. Ruch - Stworzenia poruszają się w stronę celów',
  phase2Combat: '2. Walka - Obrażenia zadawane między sąsiednimi stworzeniami',
  phase3Eating: '3. Jedzenie - Ludzie konsumują sąsiednie rośliny',
  phase4Reproduction: '4. Rozmnażanie - Rozpoczęcie ciąży',
  phase5Death: '5. Śmierć - Usunięcie stworzeń ze zdrowiem ≤ 0',
  phase6Birth: '6. Narodziny - Urodzenie nowych ludzi z ciąży',
  phase7Spawn: '7. Pojawienie - Nowe rośliny i zwierzęta pojawiają się na pustych polach',
  importantRulesTitle: 'Ważne Zasady',
  importantRule1: 'Wszystkie stworzenia kończą każdą fazę przed rozpoczęciem następnej',
  importantRule2: 'Stworzenia starzeją się co rundę i mogą umrzeć ze starości',
  importantRule3: 'Tylko jedno stworzenie może zajmować pole w danym czasie',

  creaturesTitle: 'Typy Stworzeń',
  malesTitle: '🧑‍🦰 Mężczyźni',
  malesDesc:
    'Mężczyźni poruszają się w stronę owoców i walczą z wilkami. Rywalizują z innymi mężczyznami o terytorium. Mogą rozmnażać się z sąsiednimi kobietami.',
  femalesTitle: '👩 Kobiety',
  femalesDesc:
    'Kobiety poruszają się w stronę owoców i mogą zajść w ciążę. Ciąża trwa kilka rund przed porodem. Kobiety w ciąży pokazują 🤰.',
  wolvesTitle: '🐺 Wilki',
  wolvesDesc: 'Wilki polują na ludzi i zadają obrażenia gdy są obok. Mężczyźni walczą z wilkami, ale kobiety nie.',
  dogsTitle: '🐕 Psy',
  dogsDesc: 'Psy chronią ludzi atakując wilki. Gdy są obok wilka, psy zadają obrażenia aby chronić ekosystem.',

  plantsTitle: 'Typy Roślin',
  fruitsTitle: '🍎 Owoce',
  fruitsDesc:
    'Owoce leczą ludzi gdy są zjedzone. Nowe owoce są niedojrzałe (🍏) i stają się dojrzałe (🍎) po kilku rundach. Tylko dojrzałe owoce mogą być zjedzone.',
  mushroomsTitle: '🍄 Muchomory',
  mushroomsDesc:
    'Muchomory są trującymi roślinami które ranią ludzi gdy są zjedzone. Pojawiają się losowo i są natychmiast niebezpieczne.',
  mushroomsWarning: '⚠️ Uwaga: Muchomory zmniejszają zdrowie!',

  controlsTitle: 'Sterowanie',
  keyboardShortcutsTitle: 'Skróty Klawiszowe',
  keySpace: 'Spacja - Przełącz Pauza/Gra',
  keyRight: 'Strzałka w Prawo - 1 runda do przodu (gdy pauza)',
  keyUp: 'Strzałka w Górę - 5 rund do przodu (gdy pauza)',
  keyDown: 'Strzałka w Dół - Pauza symulacji',
  keyLeft: 'Strzałka w Lewo - Pauza symulacji',
  mouseControlsTitle: 'Sterowanie Myszą',
  mouseDesc:
    'Użyj przycisków w panelu sterowania aby zarządzać symulacją. Kliknij "?" aby zobaczyć te zasady w każdej chwili.',
};
