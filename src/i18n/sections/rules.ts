/**
 * Rules modal (owned by the rules / app-shell workstream).
 *
 * Placeholders are filled from the active config by applyRulesConfigArgs()
 * (src/ui/rulesArgs.ts) through the elements' data-i18n-args:
 * femalesDesc {0}=pregnancy rounds {1}=cooldown rounds; fruitsDesc {0}=rounds to ripen;
 * importantRuleOvercrowding {0}=human threshold {1}=human multiplier
 * {2}=animal threshold {3}=animal multiplier.
 */
export interface RulesKeys {
  title: string;
  tabGameRules: string;
  tabCreatures: string;
  tabPlants: string;
  tabGenetics: string;
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
  importantRuleMaleFight: string;
  importantRuleOvercrowding: string;
  importantRuleBirthSpace: string;
  orderExamplesTitle: string;
  orderExamplesDesc: string;
  orderExample1: string;
  orderExample2: string;
  orderExample3: string;
  gameEndTitle: string;
  gameEndDesc: string;

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

  // Genetics & energy tab content
  geneticsTitle: string;
  geneticsDesc: string;
  geneMaxHealth: string;
  geneStrength: string;
  geneMetabolism: string;
  geneGreed: string;
  geneCaution: string;
  geneLongevity: string;
  energyTitle: string;
  energyDesc: string;
  energyDesperate: string;
  energyHungry: string;
  energyModerate: string;
  energyFull: string;
  energySatiated: string;
  energyTip: string;

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
  title: '📖 Game Rules',
  tabGameRules: 'Game Rules',
  tabCreatures: 'Creatures',
  tabPlants: 'Plants',
  tabGenetics: 'Genetics & Energy',
  tabControls: 'Controls',

  gameRulesTitle: '🎮 How the Game Works',
  roundPriorityTitle: 'Round Priority Order',
  roundPriorityDesc: 'Each round, every creature goes through these 7 phases, always in this order:',
  phase1Movement: '1. Movement - Creatures step toward what they want (food, prey) or run away',
  phase2Combat: '2. Combat - Wolves bite humans, dogs bite wolves, males fight each other',
  phase3Eating: '3. Eating - Humans eat ripe fruits and mushrooms next to them; dogs eat mushrooms',
  phase4Reproduction: '4. Reproduction - A male next to a female may make her pregnant',
  phase5Death: '5. Death - Creatures with health ≤ 0 are removed; others may die of old age',
  phase6Birth: '6. Birth - Pregnant females whose time is up give birth',
  phase7Spawn: '7. Spawn - New plants and animals appear on empty cells',
  importantRulesTitle: '⚡ Important Rules',
  importantRule1: 'Every creature finishes a phase before the next phase begins.',
  importantRule2: 'Creatures get older every round, and the older they are, the more likely they die of old age.',
  importantRule3: 'Only one creature or plant can be on a cell at a time.',
  importantRuleMaleFight:
    '👨 vs 👨: when two males fight, the winner gains the loser’s health as a prize. If both would drop to 0, only the weaker one dies.',
  importantRuleOvercrowding:
    'Overcrowding: with more than {0} humans, every human is {1}× more likely to die of old age. With more than {2} wolves + dogs, they are {3}× more likely.',
  importantRuleBirthSpace:
    'If a mother has no empty cell next to her when her baby is due, she dies and the baby takes her place.',
  orderExamplesTitle: '🔁 Why the Order Matters',
  orderExamplesDesc: 'Because phases run one after another, an early phase can change what happens later:',
  orderExample1:
    'A 👨 male killed in combat in phase 2 cannot father a child in phase 4 — even if a female is right next to him.',
  orderExample2:
    'A human who drops to 0 health from a wolf bite in phase 2 is too weak to eat in phase 3, so a ripe fruit next to them cannot save them.',
  orderExample3:
    'A pregnant female killed by a wolf is removed in phase 5, before births in phase 6 — so her baby is never born.',
  gameEndTitle: '🏁 How the Game Ends',
  gameEndDesc:
    'The game ends when all humans have died. Humans win when no wolves and no mushrooms are left (checked from round 10 on). You can also press Finish Game at any time to see the summary.',

  creaturesTitle: 'Creature Types',
  malesTitle: '👨 Male Humans',
  malesDesc:
    'Males walk toward fruits and bite back when a wolf attacks them. Two males next to each other fight. A male next to a female can make her pregnant.',
  femalesTitle: '👩 Female Humans',
  femalesDesc:
    'Females walk toward fruits and can become pregnant (🤰). A pregnancy lasts {0} rounds; after giving birth she rests for {1} rounds before she can be pregnant again. Females do not fight back against wolves.',
  wolvesTitle: '🐺 Wolves',
  wolvesDesc:
    'Wolves hunt humans and bite them when they are next to them. They can see farther than humans. Males bite back, females do not.',
  dogsTitle: '🐕 Dogs',
  dogsDesc:
    'Dogs protect humans by hunting wolves and biting them. Dogs are immune to mushrooms: they can eat them without getting hurt, which helps clear the poison away.',

  plantsTitle: 'Plant Types',
  fruitsTitle: '🍎 Fruits',
  fruitsDesc:
    'Fruits heal humans who eat them. A new fruit is unripe (🍏) and becomes ripe (🍎) after {0} rounds. Only ripe fruits can be eaten, and only by a human who is not at full health. If several hungry humans are next to it, a random one of them eats it.',
  mushroomsTitle: '🍄 Mushrooms',
  mushroomsDesc:
    'Mushrooms are poisonous: a human who eats one loses health. They are dangerous from the moment they appear. Dogs can eat mushrooms safely. When several humans or dogs stand next to the same mushroom, a random one of them eats it.',
  mushroomsWarning: '⚠️ Warning: Mushrooms reduce health!',

  geneticsTitle: '🧬 Genes',
  geneticsDesc:
    'Every human has their own genes. A baby gets a mix of both parents’ genes plus a small random change (mutation). Over many rounds, genes that help survival become more common.',
  geneMaxHealth: 'Max Health - how much health the human can have (and starts with).',
  geneStrength: 'Strength - how hard the human hits in fights with other males and wolves.',
  geneMetabolism: 'Metabolism - how much health every step costs. A fast metabolism means getting hungry quickly.',
  geneGreed: 'Greed - how likely the human is to walk toward a fruit they can see.',
  geneCaution: 'Caution - how likely the human is to run away from a wolf they can see.',
  geneLongevity:
    'Longevity (aging rate) - how fast the human ages. 1 is normal; above 1 means ageing faster and a shorter life, below 1 a longer life.',
  energyTitle: '⚡ Energy',
  energyDesc: 'Health is also energy. How full a human is changes how they behave:',
  energyDesperate:
    'Desperate (below 30%): hunts for food hard and does not try to have children. A desperate male runs away from other males.',
  energyHungry:
    'Hungry (below 50%): looks for food more often, is more careful around wolves, and does not try to have children.',
  energyModerate: 'Moderate (50–80%): normal behaviour.',
  energyFull: 'Full (above 80%): less interested in food, braver, and more likely to have children.',
  energySatiated: 'Satiated (100%): barely interested in food and most likely to have children.',
  energyTip: 'Tip: hover over a human on the board to see their genes and energy state.',

  controlsTitle: 'Controls',
  keyboardShortcutsTitle: '⌨️ Keyboard Shortcuts',
  keySpace: 'Space - Pause/Play toggle',
  keyRight: 'Right Arrow - Advance 1 round (when paused)',
  keyUp: 'Up Arrow - Advance 5 rounds (when paused)',
  keyDown: 'Down Arrow - Pause simulation',
  keyLeft: 'Left Arrow - Pause simulation',
  mouseControlsTitle: '🖱️ Mouse Controls',
  mouseDesc:
    'Use the buttons in the control panel: Run One Round, Run Five Rounds, Run Free, Pause and Finish Game. Click "?" to see these rules at any time.',
};

export const pl: RulesKeys = {
  title: '📖 Zasady Gry',
  tabGameRules: 'Zasady Gry',
  tabCreatures: 'Stworzenia',
  tabPlants: 'Rośliny',
  tabGenetics: 'Geny i Energia',
  tabControls: 'Sterowanie',

  gameRulesTitle: '🎮 Jak Działa Gra',
  roundPriorityTitle: 'Kolejność Priorytetów Rundy',
  roundPriorityDesc: 'W każdej rundzie każde stworzenie przechodzi przez 7 faz, zawsze w tej kolejności:',
  phase1Movement: '1. Ruch - Stworzenia idą w stronę tego, czego chcą (jedzenie, ofiara), albo uciekają',
  phase2Combat: '2. Walka - Wilki gryzą ludzi, psy gryzą wilki, mężczyźni walczą ze sobą',
  phase3Eating: '3. Jedzenie - Ludzie jedzą sąsiednie dojrzałe owoce i muchomory; psy jedzą muchomory',
  phase4Reproduction: '4. Rozmnażanie - Mężczyzna obok kobiety może sprawić, że zajdzie w ciążę',
  phase5Death: '5. Śmierć - Stworzenia ze zdrowiem ≤ 0 znikają; inne mogą umrzeć ze starości',
  phase6Birth: '6. Narodziny - Kobiety, którym minął czas ciąży, rodzą dzieci',
  phase7Spawn: '7. Pojawienie - Nowe rośliny i zwierzęta pojawiają się na pustych polach',
  importantRulesTitle: '⚡ Ważne Zasady',
  importantRule1: 'Każde stworzenie kończy fazę, zanim zacznie się następna.',
  importantRule2: 'Stworzenia starzeją się co rundę, a im są starsze, tym łatwiej umierają ze starości.',
  importantRule3: 'Na jednym polu może być tylko jedno stworzenie albo jedna roślina.',
  importantRuleMaleFight:
    '👨 kontra 👨: gdy dwóch mężczyzn walczy, zwycięzca dostaje zdrowie przegranego jako nagrodę. Jeśli obaj spadliby do 0, ginie tylko słabszy.',
  importantRuleOvercrowding:
    'Przeludnienie: gdy ludzi jest więcej niż {0}, każdy człowiek ma {1}× większą szansę umrzeć ze starości. Gdy wilków + psów jest więcej niż {2}, mają {3}× większą szansę.',
  importantRuleBirthSpace:
    'Jeśli w chwili porodu obok matki nie ma pustego pola, matka umiera, a dziecko zajmuje jej miejsce.',
  orderExamplesTitle: '🔁 Dlaczego Kolejność Ma Znaczenie',
  orderExamplesDesc: 'Fazy następują po sobie, więc wcześniejsza faza może zmienić to, co stanie się później:',
  orderExample1:
    'Mężczyzna 👨 zabity w walce w fazie 2 nie może zostać ojcem w fazie 4 — nawet jeśli kobieta stoi tuż obok.',
  orderExample2:
    'Człowiek, któremu wilk w fazie 2 zabrał całe zdrowie, jest za słaby, by jeść w fazie 3, więc dojrzały owoc obok go nie uratuje.',
  orderExample3:
    'Kobieta w ciąży zabita przez wilka znika w fazie 5, przed narodzinami w fazie 6 — więc jej dziecko się nie urodzi.',
  gameEndTitle: '🏁 Jak Kończy Się Gra',
  gameEndDesc:
    'Gra kończy się, gdy zginą wszyscy ludzie. Ludzie wygrywają, gdy nie zostanie żaden wilk ani muchomor (sprawdzane od rundy 10). Możesz też w każdej chwili nacisnąć Zakończ Grę, by zobaczyć podsumowanie.',

  creaturesTitle: 'Typy Stworzeń',
  malesTitle: '👨 Mężczyźni',
  malesDesc:
    'Mężczyźni idą w stronę owoców i oddają, gdy zaatakuje ich wilk. Dwóch mężczyzn obok siebie walczy. Mężczyzna obok kobiety może sprawić, że zajdzie w ciążę.',
  femalesTitle: '👩 Kobiety',
  femalesDesc:
    'Kobiety idą w stronę owoców i mogą zajść w ciążę (🤰). Czas ciąży (w rundach): {0}. Po porodzie kobieta odpoczywa (w rundach): {1}, zanim znów może zajść w ciążę. Kobiety nie bronią się przed wilkami.',
  wolvesTitle: '🐺 Wilki',
  wolvesDesc: 'Wilki polują na ludzi i gryzą ich, gdy są obok. Widzą dalej niż ludzie. Mężczyźni oddają, kobiety nie.',
  dogsTitle: '🐕 Psy',
  dogsDesc:
    'Psy chronią ludzi: polują na wilki i je gryzą. Psy są odporne na muchomory: mogą je jeść bez szkody, co pomaga usuwać truciznę.',

  plantsTitle: 'Typy Roślin',
  fruitsTitle: '🍎 Owoce',
  fruitsDesc:
    'Owoce leczą ludzi, którzy je zjedzą. Nowy owoc jest niedojrzały (🍏) i dojrzewa (🍎) po pewnym czasie (w rundach): {0}. Zjeść można tylko dojrzały owoc i tylko wtedy, gdy człowiek nie ma pełnego zdrowia. Jeśli obok stoi kilku głodnych ludzi, zjada go losowo wybrany z nich.',
  mushroomsTitle: '🍄 Muchomory',
  mushroomsDesc:
    'Muchomory są trujące: człowiek, który zje muchomora, traci zdrowie. Są groźne od chwili, gdy się pojawią. Psy mogą je jeść bezpiecznie. Gdy obok tego samego muchomora stoi kilku ludzi lub psów, zjada go losowo wybrany z nich.',
  mushroomsWarning: '⚠️ Uwaga: Muchomory zmniejszają zdrowie!',

  geneticsTitle: '🧬 Geny',
  geneticsDesc:
    'Każdy człowiek ma własne geny. Dziecko dostaje mieszankę genów obojga rodziców i małą losową zmianę (mutację). Z czasem geny, które pomagają przetrwać, stają się częstsze.',
  geneMaxHealth: 'Maks. zdrowie - ile zdrowia może mieć człowiek (i z iloma zaczyna).',
  geneStrength: 'Siła - jak mocno człowiek uderza w walce z innymi mężczyznami i wilkami.',
  geneMetabolism: 'Metabolizm - ile zdrowia kosztuje każdy krok. Szybki metabolizm to szybki głód.',
  geneGreed: 'Chciwość - jak chętnie człowiek idzie do owocu, który widzi.',
  geneCaution: 'Ostrożność - jak chętnie człowiek ucieka przed wilkiem, którego widzi.',
  geneLongevity:
    'Długowieczność (tempo starzenia) - jak szybko człowiek się starzeje. 1 to norma; powyżej 1 oznacza szybsze starzenie i krótsze życie, poniżej 1 dłuższe.',
  energyTitle: '⚡ Energia',
  energyDesc: 'Zdrowie to także energia. To, jak bardzo człowiek jest najedzony, zmienia jego zachowanie:',
  energyDesperate:
    'Zdesperowany (poniżej 30%): usilnie szuka jedzenia i nie próbuje mieć dzieci. Zdesperowany mężczyzna ucieka przed innymi mężczyznami.',
  energyHungry: 'Głodny (poniżej 50%): częściej szuka jedzenia, bardziej uważa na wilki i nie próbuje mieć dzieci.',
  energyModerate: 'Umiarkowany (50–80%): zwykłe zachowanie.',
  energyFull: 'Najedzony (powyżej 80%): mniej interesuje się jedzeniem, jest odważniejszy i chętniej ma dzieci.',
  energySatiated: 'Syty (100%): prawie nie interesuje się jedzeniem i najchętniej ma dzieci.',
  energyTip: 'Wskazówka: najedź myszą na człowieka na planszy, aby zobaczyć jego geny i stan energii.',

  controlsTitle: 'Sterowanie',
  keyboardShortcutsTitle: '⌨️ Skróty Klawiszowe',
  keySpace: 'Spacja - Przełącz Pauza/Gra',
  keyRight: 'Strzałka w Prawo - 1 runda do przodu (gdy pauza)',
  keyUp: 'Strzałka w Górę - 5 rund do przodu (gdy pauza)',
  keyDown: 'Strzałka w Dół - Pauza symulacji',
  keyLeft: 'Strzałka w Lewo - Pauza symulacji',
  mouseControlsTitle: '🖱️ Sterowanie Myszą',
  mouseDesc:
    'Użyj przycisków w panelu sterowania: Jedna Runda, Pięć Rund, Uruchom Swobodnie, Pauza i Zakończ Grę. Kliknij "?", aby w każdej chwili zobaczyć te zasady.',
};
