/**
 * Config screen help texts (owned by workstream B).
 *
 * One plain-language explanation per config field (key = the input's DOM id),
 * written for students aged 11-15: what the number does and what happens when
 * you make it bigger or smaller. Range hints are added separately.
 */
export interface ConfigHelpKeys {
  boardWidth: string;
  boardHeight: string;
  injuredThreshold: string;
  spawnMaleHuman: string;
  spawnFemaleHuman: string;
  spawnWolf: string;
  spawnDog: string;
  spawnFruit: string;
  spawnMushroom: string;
  humanHealth: string;
  humanMaleDamage: string;
  humanWolfDamage: string;
  humanReproduction: string;
  humanPregnancy: string;
  humanCooldown: string;
  humanGompertzA: string;
  humanGompertzB: string;
  humanPerception: string;
  humanFruitProb: string;
  humanCaution: string;
  humanMetabolism: string;
  wolfHealth: string;
  wolfDamageToMale: string;
  wolfDamageToFemale: string;
  wolfDamageToDog: string;
  wolfGompertzA: string;
  wolfGompertzB: string;
  wolfPerception: string;
  wolfHumanProb: string;
  wolfSpawn: string;
  dogHealth: string;
  dogDamage: string;
  dogGompertzA: string;
  dogGompertzB: string;
  dogPerception: string;
  dogWolfProb: string;
  dogSpawn: string;
  fruitHealing: string;
  fruitSpawn: string;
  fruitRipen: string;
  mushroomDamage: string;
  mushroomSpawn: string;
  humanThreshold: string;
  humanMultiplier: string;
  animalThreshold: string;
  animalMultiplier: string;

  /** Accessible name of the ⓘ button; {0} = field label. */
  moreInfo: string;
  /** Labels for fields that have no entry in the `config` section. */
  labels: {
    humanCaution: string;
    humanMetabolism: string;
  };
  setupMode: {
    legend: string;
    random: string;
    manual: string;
    randomHint: string;
    manualHint: string;
  };
  /** {0} = expected creatures (humans + wolves + dogs), {1} = all entities incl. plants. */
  totals: string;
  /** {0} = expected creatures. Soft warning, never blocks Start. */
  perfWarning: string;
  /** Tooltip of the Start button. */
  startShortcut: string;
}

export const en: ConfigHelpKeys = {
  boardWidth: 'How many cells wide the board is. Bigger board = more room and more creatures at the start.',
  boardHeight: 'How many cells tall the board is. Bigger board = more room and more creatures at the start.',
  injuredThreshold:
    'A creature gets the 💔 icon when its health drops below this percent of its maximum. It only changes the picture, not the rules.',
  spawnMaleHuman: 'Chance that a cell starts with a man. 0.15 means about 15 of every 100 cells.',
  spawnFemaleHuman: 'Chance that a cell starts with a woman. More women = more babies possible.',
  spawnWolf: 'Chance that a cell starts with a wolf. More wolves = more danger for humans.',
  spawnDog: 'Chance that a cell starts with a dog. Dogs protect humans by fighting wolves.',
  spawnFruit: 'Chance that a cell starts with a fruit. Fruit is food that heals humans.',
  spawnMushroom: 'Chance that a cell starts with a poisonous mushroom. Humans who eat it get hurt.',
  humanHealth: 'Health each human starts with. Bigger = humans survive more fights and hunger.',
  humanMaleDamage: 'How much a man hurts another man when they fight. Bigger = fights end faster and more men die.',
  humanWolfDamage: 'How much a man hurts a wolf when he hits back. Bigger = men defend themselves better.',
  humanReproduction:
    'Chance that a woman next to a man becomes pregnant each round. Bigger = more babies, faster growth.',
  humanPregnancy: 'How many rounds a pregnancy lasts before the baby is born. Bigger = babies come later.',
  humanCooldown:
    'Rounds a mother must rest after giving birth before she can be pregnant again. Bigger = fewer babies.',
  humanGompertzA: 'Basic chance of dying of old age. Bigger = shorter lives, even for young humans.',
  humanGompertzB: 'How fast the risk of dying grows with age. Bigger = shorter lives, old humans die much sooner.',
  humanPerception: 'How many cells away a human can see fruit and wolves. Bigger = finds food and spots danger sooner.',
  humanFruitProb:
    'Average greed of the first humans: the chance to walk toward fruit they see. Babies inherit greed from their parents.',
  humanCaution:
    'Average caution of the first humans: the chance to run away from a wolf they see. Bigger = fewer humans eaten. Babies inherit it.',
  humanMetabolism:
    'Average health the first humans burn as energy. Bigger = they get hungry faster and need more fruit. Babies inherit it.',
  wolfHealth: 'Health each wolf starts with. Bigger = wolves are harder to kill.',
  wolfDamageToMale: 'How much a wolf hurts a man in one attack. Bigger = men die faster.',
  wolfDamageToFemale: 'How much a wolf hurts a woman in one attack. Bigger = women die faster.',
  wolfDamageToDog: 'How much a wolf hurts a dog that attacks it. Bigger = dogs lose more fights.',
  wolfGompertzA: 'Basic chance of a wolf dying of old age. Bigger = shorter wolf lives.',
  wolfGompertzB: 'How fast the risk of dying grows as a wolf gets older. Bigger = shorter wolf lives.',
  wolfPerception: 'How many cells away a wolf can smell humans. Bigger = wolves find humans more easily.',
  wolfHumanProb: 'Chance that a wolf walks toward a human it sees instead of wandering. Bigger = better hunters.',
  wolfSpawn: 'Chance that a new wolf appears on an empty cell each round. Bigger = wolves keep coming back.',
  dogHealth: 'Health each dog starts with. Bigger = dogs survive more fights with wolves.',
  dogDamage: 'How much a dog hurts a wolf in one attack. Bigger = dogs kill wolves faster.',
  dogGompertzA: 'Basic chance of a dog dying of old age. Bigger = shorter dog lives.',
  dogGompertzB: 'How fast the risk of dying grows as a dog gets older. Bigger = shorter dog lives.',
  dogPerception: 'How many cells away a dog can notice wolves. Bigger = dogs reach wolves sooner.',
  dogWolfProb: 'Chance that a dog walks toward a wolf it sees instead of wandering. Bigger = braver guards.',
  dogSpawn: 'Chance that a new dog appears on an empty cell each round. Bigger = more helpers over time.',
  fruitHealing: 'How much health a human gets back by eating one fruit. Bigger = food is worth more.',
  fruitSpawn: 'Chance that a new fruit grows on an empty cell each round. Bigger = more food, so more humans can live.',
  fruitRipen: 'Rounds a new fruit needs before it can be eaten. Bigger = humans wait longer for food.',
  mushroomDamage: 'How much health a human loses by eating a poisonous mushroom. Bigger = mushrooms are deadlier.',
  mushroomSpawn: 'Chance that a new mushroom grows on an empty cell each round. Bigger = more poison on the board.',
  humanThreshold:
    'If there are more humans than this, the board is crowded and humans die of old age more often. Smaller = crowding starts sooner.',
  humanMultiplier:
    'How many times more likely humans are to die while crowded. 1 = no effect, bigger = crowding is harsher.',
  animalThreshold:
    'If there are more wolves and dogs together than this, they die of old age more often. Smaller = crowding starts sooner.',
  animalMultiplier:
    'How many times more likely wolves and dogs are to die while crowded. 1 = no effect, bigger = crowding is harsher.',

  moreInfo: 'More about: {0}',
  labels: {
    humanCaution: 'Average Caution (initial):',
    humanMetabolism: 'Average Metabolism (initial):',
  },
  setupMode: {
    legend: 'How to fill the board',
    random: '🎲 Random',
    manual: '✋ Place it myself',
    randomHint: 'Creatures and plants are placed at random using the chances below.',
    manualHint: 'You will place every creature and plant yourself on the next screen, so the start chances are off.',
  },
  totals: 'Expected starting creatures: ~{0} (all entities including plants: ~{1})',
  perfWarning: 'About {0} creatures is a lot: the simulation may run slowly. You can still start.',
  startShortcut: 'Start the game (Ctrl+Enter)',
};

export const pl: ConfigHelpKeys = {
  boardWidth: 'Ile pól ma plansza wszerz. Większa plansza = więcej miejsca i więcej stworzeń na starcie.',
  boardHeight: 'Ile pól ma plansza wzwyż. Większa plansza = więcej miejsca i więcej stworzeń na starcie.',
  injuredThreshold:
    'Stworzenie dostaje ikonę 💔, gdy jego zdrowie spadnie poniżej tylu procent maksimum. Zmienia tylko obrazek, nie zasady.',
  spawnMaleHuman: 'Szansa, że na polu na starcie stoi mężczyzna. 0.15 to mniej więcej 15 na każde 100 pól.',
  spawnFemaleHuman: 'Szansa, że na polu na starcie stoi kobieta. Więcej kobiet = więcej możliwych dzieci.',
  spawnWolf: 'Szansa, że na polu na starcie stoi wilk. Więcej wilków = większe zagrożenie dla ludzi.',
  spawnDog: 'Szansa, że na polu na starcie stoi pies. Psy chronią ludzi, walcząc z wilkami.',
  spawnFruit: 'Szansa, że na polu na starcie leży owoc. Owoce to jedzenie, które leczy ludzi.',
  spawnMushroom: 'Szansa, że na polu na starcie rośnie trujący grzyb. Kto go zje, traci zdrowie.',
  humanHealth: 'Zdrowie, z jakim zaczyna każdy człowiek. Więcej = ludzie przetrwają więcej walk i głodu.',
  humanMaleDamage:
    'Jak mocno mężczyzna rani innego mężczyznę w walce. Więcej = walki kończą się szybciej i ginie więcej mężczyzn.',
  humanWolfDamage: 'Jak mocno mężczyzna rani wilka, gdy się broni. Więcej = mężczyźni lepiej się bronią.',
  humanReproduction:
    'Szansa, że kobieta obok mężczyzny zajdzie w ciążę w danej rundzie. Więcej = więcej dzieci, szybszy wzrost.',
  humanPregnancy: 'Ile rund trwa ciąża, zanim urodzi się dziecko. Więcej = dzieci rodzą się później.',
  humanCooldown: 'Ile rund mama musi odpocząć po porodzie, zanim znów zajdzie w ciążę. Więcej = mniej dzieci.',
  humanGompertzA: 'Podstawowa szansa śmierci ze starości. Więcej = krótsze życie, nawet dla młodych.',
  humanGompertzB:
    'Jak szybko rośnie ryzyko śmierci z wiekiem. Więcej = krótsze życie, starsi ludzie umierają dużo szybciej.',
  humanPerception:
    'Z ilu pól człowiek widzi owoce i wilki. Więcej = szybciej znajduje jedzenie i zauważa niebezpieczeństwo.',
  humanFruitProb:
    'Średnia łakomość pierwszych ludzi: szansa, że pójdą do widzianego owocu. Dzieci dziedziczą łakomość po rodzicach.',
  humanCaution:
    'Średnia ostrożność pierwszych ludzi: szansa ucieczki przed widzianym wilkiem. Więcej = mniej zjedzonych ludzi. Dzieci ją dziedziczą.',
  humanMetabolism:
    'Ile zdrowia średnio spalają pierwsi ludzie jako energię. Więcej = szybciej głodnieją i potrzebują więcej owoców. Dzieci to dziedziczą.',
  wolfHealth: 'Zdrowie, z jakim zaczyna każdy wilk. Więcej = trudniej pokonać wilka.',
  wolfDamageToMale: 'Jak mocno wilk rani mężczyznę jednym atakiem. Więcej = mężczyźni giną szybciej.',
  wolfDamageToFemale: 'Jak mocno wilk rani kobietę jednym atakiem. Więcej = kobiety giną szybciej.',
  wolfDamageToDog: 'Jak mocno wilk rani psa, który go atakuje. Więcej = psy częściej przegrywają.',
  wolfGompertzA: 'Podstawowa szansa, że wilk umrze ze starości. Więcej = krótsze życie wilków.',
  wolfGompertzB: 'Jak szybko rośnie ryzyko śmierci starzejącego się wilka. Więcej = krótsze życie wilków.',
  wolfPerception: 'Z ilu pól wilk wyczuwa ludzi. Więcej = wilki łatwiej znajdują ludzi.',
  wolfHumanProb: 'Szansa, że wilk pójdzie do widzianego człowieka zamiast błądzić. Więcej = lepsi łowcy.',
  wolfSpawn: 'Szansa, że w każdej rundzie na pustym polu pojawi się nowy wilk. Więcej = wilki wciąż wracają.',
  dogHealth: 'Zdrowie, z jakim zaczyna każdy pies. Więcej = psy przetrwają więcej walk z wilkami.',
  dogDamage: 'Jak mocno pies rani wilka jednym atakiem. Więcej = psy szybciej pokonują wilki.',
  dogGompertzA: 'Podstawowa szansa, że pies umrze ze starości. Więcej = krótsze życie psów.',
  dogGompertzB: 'Jak szybko rośnie ryzyko śmierci starzejącego się psa. Więcej = krótsze życie psów.',
  dogPerception: 'Z ilu pól pies zauważa wilki. Więcej = psy szybciej docierają do wilków.',
  dogWolfProb: 'Szansa, że pies pójdzie do widzianego wilka zamiast błądzić. Więcej = odważniejsi strażnicy.',
  dogSpawn: 'Szansa, że w każdej rundzie na pustym polu pojawi się nowy pies. Więcej = więcej pomocników z czasem.',
  fruitHealing: 'Ile zdrowia człowiek odzyskuje po zjedzeniu owocu. Więcej = jedzenie jest cenniejsze.',
  fruitSpawn:
    'Szansa, że w każdej rundzie na pustym polu wyrośnie owoc. Więcej = więcej jedzenia, więc może żyć więcej ludzi.',
  fruitRipen: 'Ile rund nowy owoc musi dojrzewać, zanim da się go zjeść. Więcej = ludzie dłużej czekają na jedzenie.',
  mushroomDamage: 'Ile zdrowia człowiek traci po zjedzeniu trującego grzyba. Więcej = grzyby są groźniejsze.',
  mushroomSpawn: 'Szansa, że w każdej rundzie na pustym polu wyrośnie grzyb. Więcej = więcej trucizny na planszy.',
  humanThreshold:
    'Gdy ludzi jest więcej niż ta liczba, jest tłok i ludzie częściej umierają ze starości. Mniej = tłok zaczyna się wcześniej.',
  humanMultiplier: 'Ile razy częściej ludzie umierają podczas tłoku. 1 = bez zmian, więcej = tłok jest groźniejszy.',
  animalThreshold:
    'Gdy wilków i psów razem jest więcej niż ta liczba, częściej umierają ze starości. Mniej = tłok zaczyna się wcześniej.',
  animalMultiplier:
    'Ile razy częściej wilki i psy umierają podczas tłoku. 1 = bez zmian, więcej = tłok jest groźniejszy.',

  moreInfo: 'Więcej o: {0}',
  labels: {
    humanCaution: 'Średnia ostrożność (na start):',
    humanMetabolism: 'Średni metabolizm (na start):',
  },
  setupMode: {
    legend: 'Jak wypełnić planszę',
    random: '🎲 Losowo',
    manual: '✋ Ułożę sam',
    randomHint: 'Stworzenia i rośliny zostaną rozmieszczone losowo według szans poniżej.',
    manualHint: 'Na następnym ekranie sam ustawisz każde stworzenie i roślinę, więc szanse startowe są wyłączone.',
  },
  totals: 'Oczekiwane stworzenia na start: ~{0} (wszystkie obiekty razem z roślinami: ~{1})',
  perfWarning: 'Około {0} stworzeń to dużo: symulacja może działać wolno. Nadal możesz zacząć.',
  startShortcut: 'Rozpocznij grę (Ctrl+Enter)',
};
