import { Board } from './core/Board';
import { Renderer } from './core/Renderer';
import { Game } from './core/Game';
import { Human } from './entities/Human';
import { EntityType } from './types';

// Initialize
const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
const board = new Board();
const renderer = new Renderer(canvas);
const game = new Game(board, renderer);

// Initial render
renderer.renderFull(board);

// Update round counter
function updateRoundCounter(): void {
  const roundElement = document.getElementById('round');
  if (roundElement) {
    roundElement.textContent = board.round.toString();
  }
}

// Update statistics
function updateStatistics(): void {
  const entities = board.getAllEntities();

  const maleCount = entities.filter(e => e.type === EntityType.MALE).length;
  const femaleCount = entities.filter(e => e.type === EntityType.FEMALE).length;
  const wolfCount = entities.filter(e => e.type === EntityType.WOLF).length;
  const fruitCount = entities.filter(e => e.type === EntityType.FRUIT).length;
  const pregnantCount = entities.filter(e => e instanceof Human && e.isPregnant()).length;

  document.getElementById('maleCount')!.textContent = maleCount.toString();
  document.getElementById('femaleCount')!.textContent = femaleCount.toString();
  document.getElementById('pregnantCount')!.textContent = pregnantCount.toString();
  document.getElementById('wolfCount')!.textContent = wolfCount.toString();
  document.getElementById('fruitCount')!.textContent = fruitCount.toString();
}

// Update UI periodically
setInterval(() => {
  updateRoundCounter();
  updateStatistics();
}, 100);

// Button handlers
const startBtn = document.getElementById('startBtn') as HTMLButtonElement;
const pauseBtn = document.getElementById('pauseBtn') as HTMLButtonElement;
const stepBtn = document.getElementById('stepBtn') as HTMLButtonElement;
const runBtn = document.getElementById('runBtn') as HTMLButtonElement;

startBtn.addEventListener('click', () => {
  console.log('[UI] Start game clicked');
  game.initializeBoard();
  updateStatistics();
  startBtn.disabled = true;
  pauseBtn.disabled = false;
  stepBtn.disabled = false;
  runBtn.disabled = false;
});

pauseBtn.addEventListener('click', () => {
  console.log('[UI] Pause clicked');
  if (game.running()) {
    game.pause();
    pauseBtn.textContent = 'Resume';
    runBtn.disabled = false;
    stepBtn.disabled = false;
  } else {
    game.start();
    pauseBtn.textContent = 'Pause';
    runBtn.disabled = true;
    stepBtn.disabled = true;
  }
});

stepBtn.addEventListener('click', () => {
  console.log('[UI] Step clicked');
  game.step();
});

runBtn.addEventListener('click', () => {
  console.log('[UI] Run clicked');
  game.start();
  pauseBtn.textContent = 'Pause';
  runBtn.disabled = true;
  stepBtn.disabled = true;
});

// Spacebar toggle
document.addEventListener('keydown', (e) => {
  if (e.code === 'Space') {
    e.preventDefault();
    pauseBtn.click();
  }
});

// Initial update
updateRoundCounter();
updateStatistics();

console.log('Game of Life Simulator initialized');
console.log('Board size:', board.width, 'x', board.height);
console.log('Press "Start Game" to begin');
