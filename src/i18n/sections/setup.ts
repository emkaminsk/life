/** Manual board setup view (owned by workstream A). */
export interface SetupKeys {
  title: string;
  subtitle: string;
  palette: string;
  tool: {
    male: string;
    female: string;
    dog: string;
    wolf: string;
    fruit: string;
    mushroom: string;
    eraser: string;
  };
  /** Palette button tooltip: {0} item name, {1} key. */
  toolHint: string;
  help: string;
  mouseHelp: string;
  confirm: string;
  back: string;
  clear: string;
  /** {0} items placed, {1} fields on the board. */
  counts: string;
  noHumansWarning: string;
  /** {0} column, {1} row (1-based), {2} content. */
  cellAnnounce: string;
  /** {0} width, {1} height, {2} number of fields. */
  selectionAnnounce: string;
  emptyCell: string;
  confirmDiscard: string;
  /** {0} width, {1} height. */
  boardLabel: string;
  roleDescription: string;
  /** {0} tool name. */
  toolSelected: string;
}

export const en: SetupKeys = {
  title: 'Board setup',
  subtitle: 'Place the starting creatures and plants yourself, then start the game.',
  palette: 'Items',
  tool: {
    male: 'Man',
    female: 'Woman',
    dog: 'Dog',
    wolf: 'Wolf',
    fruit: 'Fruit',
    mushroom: 'Mushroom',
    eraser: 'Eraser',
  },
  toolHint: '{0} (key {1})',
  help: 'Arrows: move · Shift+arrows: select area · Ctrl+A: whole board · 1–6: place item · Shift+1–6: sprinkle ~30% · 0 or Delete: erase · Esc: clear selection · Ctrl+Enter: start',
  mouseHelp: 'Drag an item onto the board, click to place the chosen item, or drag across the board to select an area.',
  confirm: 'Start game',
  back: 'Back to settings',
  clear: 'Clear board',
  counts: '{0} items on {1} fields',
  noHumansWarning: 'There are no humans on the board yet. You can still start, but nobody will be there to survive!',
  cellAnnounce: 'Field {0}, {1}: {2}',
  selectionAnnounce: 'Selected {0} by {1} fields ({2} fields)',
  emptyCell: 'empty',
  confirmDiscard: 'Leave the board setup? Your placed items are kept for next time.',
  boardLabel: 'Setup board, {0} by {1} fields',
  roleDescription: 'board editor',
  toolSelected: 'Chosen: {0}',
};

export const pl: SetupKeys = {
  title: 'Ustawienie planszy',
  subtitle: 'Sam rozmieść startowe stworzenia i rośliny, a potem rozpocznij grę.',
  palette: 'Elementy',
  tool: {
    male: 'Mężczyzna',
    female: 'Kobieta',
    dog: 'Pies',
    wolf: 'Wilk',
    fruit: 'Owoc',
    mushroom: 'Grzyb',
    eraser: 'Gumka',
  },
  toolHint: '{0} (klawisz {1})',
  help: 'Strzałki: ruch · Shift+strzałki: zaznacz obszar · Ctrl+A: cała plansza · 1–6: postaw element · Shift+1–6: rozsyp ~30% · 0 lub Delete: wymaż · Esc: usuń zaznaczenie · Ctrl+Enter: start',
  mouseHelp:
    'Przeciągnij element na planszę, kliknij, aby postawić wybrany element, albo przeciągnij po planszy, aby zaznaczyć obszar.',
  confirm: 'Rozpocznij grę',
  back: 'Wróć do ustawień',
  clear: 'Wyczyść planszę',
  counts: '{0} elementów na {1} polach',
  noHumansWarning: 'Na planszy nie ma jeszcze ludzi. Możesz zacząć, ale nikt nie będzie próbował przetrwać!',
  cellAnnounce: 'Pole {0}, {1}: {2}',
  selectionAnnounce: 'Zaznaczono {0} na {1} pól ({2} pól)',
  emptyCell: 'puste',
  confirmDiscard: 'Wyjść z ustawiania planszy? Postawione elementy zostaną zapamiętane na następny raz.',
  boardLabel: 'Plansza do ustawiania, {0} na {1} pól',
  roleDescription: 'edytor planszy',
  toolSelected: 'Wybrano: {0}',
};
