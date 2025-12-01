import { Board } from './core/Board';
import { Renderer } from './core/Renderer';
import { Game } from './core/Game';
import { Human } from './entities/Human';
import { EntityType } from './types';
import { ConfigPanel, type GameConfig } from './ui/ConfigPanel';
import { TooltipManager } from './ui/TooltipManager';
import { i18n } from './i18n/i18n';
import { Language } from './i18n/types';
import { initializeDOMRenderer } from './i18n/DOMRenderer';

// Initialize i18n DOM renderer (must be called before any UI rendering)
initializeDOMRenderer();

// Initialize language selector
const languageSelector = document.getElementById('languageSelector') as HTMLSelectElement;
if (languageSelector) {
  // Set initial value from i18n
  languageSelector.value = i18n.getCurrentLanguage();

  // Handle language change
  languageSelector.addEventListener('change', (event) => {
    const target = event.target as HTMLSelectElement;
    const newLanguage = target.value as Language;
    i18n.setLanguage(newLanguage);
    console.log('[i18n] Language changed to:', newLanguage);
  });
}

// Initialize
const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
const board = new Board();
const renderer = new Renderer(canvas);
const game = new Game(board, renderer);

// Initialize Config Panel
const configPanel = new ConfigPanel();
configPanel.onStart((config: GameConfig) => {
  console.log('[Main] Starting game with config:', config);

  // Update board dimensions if changed
  if (config.board.width !== board.width || config.board.height !== board.height) {
    board.resize(config.board.width, config.board.height);
    renderer.resize(config.board.width, config.board.height);
  }

  // Update game config
  game.updateConfig(config);

  // Check if board is large (> 50x50)
  const isLargeBoard = board.width > 50 || board.height > 50;

  if (isLargeBoard) {
    // Show progress indicator for large boards
    const progressOverlay = document.getElementById('initProgress');
    const progressBar = document.getElementById('progressBar') as HTMLDivElement;
    const progressText = document.getElementById('progressText');

    if (progressOverlay && progressBar && progressText) {
      progressOverlay.classList.add('active');

      // Simulate async initialization with progress updates
      new Promise<void>((resolve) => {
        let progress = 0;
        const totalCells = board.width * board.height;
        let processedCells = 0;

        const updateProgress = () => {
          if (processedCells < totalCells) {
            // Process in chunks to prevent freezing
            const chunkSize = Math.min(100, totalCells - processedCells);
            processedCells += chunkSize;
            progress = Math.floor((processedCells / totalCells) * 100);

            progressBar.style.width = `${progress}%`;
            progressText.textContent = `Spawning creatures: ${progress}%`;

            if (processedCells < totalCells) {
              requestAnimationFrame(updateProgress);
            } else {
              // Actually initialize the board
              game.initializeBoard(config);
              setTimeout(() => {
                progressOverlay.classList.remove('active');
                resolve();
              }, 300);
            }
          }
        };

        updateProgress();
      });
    } else {
      // Fallback if progress elements not found
      game.initializeBoard(config);
    }
  } else {
    // Small board - initialize normally
    game.initializeBoard(config);
  }

  updateStatistics();

  // Reset alert flags
  maleExtinctionAlerted = false;
  femaleExtinctionAlerted = false;
  capacityWarningShown = false;
  previousMaleCount = 0;
  previousFemaleCount = 0;

  startBtn.disabled = true;
  pauseBtn.disabled = false;
  stepBtn.disabled = false;
  runBtn.disabled = false;
  resetBtn.disabled = false;
  finishBtn.disabled = false;
});

// Show config panel on page load
configPanel.show();

// Initial render
renderer.renderFull(board);

// Initialize Tooltip Manager
const tooltipManager = new TooltipManager();

// Mouse event handlers for tooltip
let tooltipThrottleId: number | null = null;

canvas.addEventListener('mousemove', (event) => {
  // Throttle tooltip updates using requestAnimationFrame for ~60fps
  if (tooltipThrottleId === null) {
    tooltipThrottleId = requestAnimationFrame(() => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;

      // Calculate cell coordinates
      const cellSize = canvas.width / board.width;
      const cellX = Math.floor(mouseX / cellSize);
      const cellY = Math.floor(mouseY / cellSize);

      // Check if cell is within board bounds
      if (cellX >= 0 && cellX < board.width && cellY >= 0 && cellY < board.height) {
        const entity = board.getEntity(cellX, cellY);
        if (entity) {
          // Show tooltip at mouse position
          tooltipManager.show(entity, event.clientX, event.clientY);
        } else {
          tooltipManager.hide();
        }
      } else {
        tooltipManager.hide();
      }

      tooltipThrottleId = null;
    });
  }
});

canvas.addEventListener('mouseleave', () => {
  tooltipManager.hide();
  if (tooltipThrottleId !== null) {
    cancelAnimationFrame(tooltipThrottleId);
    tooltipThrottleId = null;
  }
});

// Notification system
let previousMaleCount = 0;
let previousFemaleCount = 0;
let maleExtinctionAlerted = false;
let femaleExtinctionAlerted = false;
let capacityWarningShown = false;

export function showNotification(title: string, message: string, type: 'error' | 'warning' | 'info' = 'info'): void {
  const container = document.getElementById('notificationContainer');
  if (!container) return;

  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.innerHTML = `
    <div class="notification-title">${title}</div>
    <div class="notification-message">${message}</div>
  `;

  // Click to dismiss
  notification.addEventListener('click', () => {
    notification.style.opacity = '0';
    setTimeout(() => notification.remove(), 200);
  });

  // Auto-dismiss after 5 seconds
  setTimeout(() => {
    notification.style.opacity = '0';
    setTimeout(() => notification.remove(), 200);
  }, 5000);

  container.appendChild(notification);
}

function checkForAlerts(): void {
  const entities = board.getAllEntities();
  const maleCount = entities.filter(e => e.type === EntityType.MALE).length;
  const femaleCount = entities.filter(e => e.type === EntityType.FEMALE).length;
  const totalCreatures = entities.filter(e =>
    e.type === EntityType.MALE ||
    e.type === EntityType.FEMALE ||
    e.type === EntityType.WOLF ||
    e.type === EntityType.DOG
  ).length;
  const totalCells = board.width * board.height;
  const capacity = totalCreatures / totalCells;

  // Extinction alerts
  if (previousMaleCount > 0 && maleCount === 0 && !maleExtinctionAlerted) {
    showNotification(
      i18n.t('notifications.maleExtinctionTitle'),
      i18n.t('notifications.allMalesDied'),
      'error'
    );
    maleExtinctionAlerted = true;
  }

  if (previousFemaleCount > 0 && femaleCount === 0 && !femaleExtinctionAlerted) {
    showNotification(
      i18n.t('notifications.femaleExtinctionTitle'),
      i18n.t('notifications.allFemalesDied'),
      'error'
    );
    femaleExtinctionAlerted = true;
  }

  // Capacity warning
  if (capacity >= 0.9 && !capacityWarningShown) {
    showNotification(
      i18n.t('notifications.boardNearlyFullTitle'),
      i18n.t('notifications.boardNearlyFull'),
      'warning'
    );
    capacityWarningShown = true;
  } else if (capacity < 0.9 && capacityWarningShown) {
    // Reset flag if capacity drops below 90%
    capacityWarningShown = false;
  }

  // Update previous counts
  previousMaleCount = maleCount;
  previousFemaleCount = femaleCount;
}

// Update round counter
function updateRoundCounter(): void {
  const roundElement = document.getElementById('round');
  if (roundElement) {
    roundElement.textContent = i18n.t('header.round', board.round);
  }
}

// Update rounds per second display
function updateRoundsPerSec(): void {
  const roundsPerSecElement = document.getElementById('roundsPerSec');
  if (roundsPerSecElement) {
    roundsPerSecElement.textContent = i18n.t('header.roundsPerSec', renderer.getCurrentFps());
  }
}

// Update statistics
function updateStatistics(): void {
  const entities = board.getAllEntities();

  const maleCount = entities.filter(e => e.type === EntityType.MALE).length;
  const femaleCount = entities.filter(e => e.type === EntityType.FEMALE).length;
  const wolfCount = entities.filter(e => e.type === EntityType.WOLF).length;
  const dogCount = entities.filter(e => e.type === EntityType.DOG).length;
  const fruitCount = entities.filter(e => e.type === EntityType.FRUIT).length;
  const mushroomCount = entities.filter(e => e.type === EntityType.MUSHROOM).length;
  const pregnantCount = entities.filter(e => e instanceof Human && e.isPregnant()).length;

  document.getElementById('maleCount')!.textContent = maleCount.toString();
  document.getElementById('femaleCount')!.textContent = femaleCount.toString();
  document.getElementById('pregnantCount')!.textContent = pregnantCount.toString();
  document.getElementById('wolfCount')!.textContent = wolfCount.toString();
  document.getElementById('dogCount')!.textContent = dogCount.toString();
  document.getElementById('fruitCount')!.textContent = fruitCount.toString();
  document.getElementById('mushroomCount')!.textContent = mushroomCount.toString();
}

// Render population graph
function renderPopulationGraph(): void {
  const graphCanvas = document.getElementById('populationGraph') as HTMLCanvasElement;
  if (!graphCanvas) return;

  const ctx = graphCanvas.getContext('2d');
  if (!ctx) return;

  const history = game.getPopulationHistory();
  const width = graphCanvas.width;
  const height = graphCanvas.height;
  const padding = 20;

  // Clear canvas
  ctx.fillStyle = '#fafafa';
  ctx.fillRect(0, 0, width, height);

  if (history.length < 2) {
    // Not enough data to draw
    ctx.fillStyle = '#999';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(i18n.t('stats.waitingForData'), width / 2, height / 2);
    return;
  }

  // Find min/max for scaling
  const maxPop = Math.max(...history, 1);
  const minPop = Math.min(...history, 0);
  const range = maxPop - minPop || 1;

  // Draw axes
  ctx.strokeStyle = '#999';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padding, padding);
  ctx.lineTo(padding, height - padding);
  ctx.lineTo(width - padding, height - padding);
  ctx.stroke();

  // Draw Y-axis labels
  ctx.fillStyle = '#666';
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(maxPop.toString(), padding - 5, padding + 5);
  ctx.fillText(minPop.toString(), padding - 5, height - padding + 5);

  // Draw line graph
  ctx.strokeStyle = '#4CAF50';
  ctx.lineWidth = 2;
  ctx.beginPath();

  const graphWidth = width - 2 * padding;
  const graphHeight = height - 2 * padding;
  const xStep = graphWidth / Math.max(history.length - 1, 1);

  history.forEach((pop, index) => {
    const x = padding + index * xStep;
    const y = height - padding - ((pop - minPop) / range) * graphHeight;

    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });

  ctx.stroke();

  // Draw X-axis label (rounds)
  ctx.fillStyle = '#666';
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`Round ${history.length - 1}`, width - padding, height - padding + 15);
  ctx.fillText('Round 0', padding, height - padding + 15);
}

// Update UI periodically
setInterval(() => {
  updateRoundCounter();
  updateStatistics();
  updateRoundsPerSec();
  renderPopulationGraph();
  checkForAlerts();
}, 100);

// Button handlers
const startBtn = document.getElementById('startBtn') as HTMLButtonElement;
const pauseBtn = document.getElementById('pauseBtn') as HTMLButtonElement;
const stepBtn = document.getElementById('stepBtn') as HTMLButtonElement;
const runBtn = document.getElementById('runBtn') as HTMLButtonElement;
const resetBtn = document.getElementById('resetBtn') as HTMLButtonElement;
const finishBtn = document.getElementById('finishBtn') as HTMLButtonElement;
const speedSelect = document.getElementById('speedSelect') as HTMLSelectElement;

startBtn.addEventListener('click', async () => {
  console.log('[UI] Start game clicked');

  // Check if board is large (> 50x50)
  const isLargeBoard = board.width > 50 || board.height > 50;

  if (isLargeBoard) {
    // Show progress indicator for large boards
    const progressOverlay = document.getElementById('initProgress');
    const progressBar = document.getElementById('progressBar') as HTMLDivElement;
    const progressText = document.getElementById('progressText');

    if (progressOverlay && progressBar && progressText) {
      progressOverlay.classList.add('active');

      // Simulate async initialization with progress updates
      await new Promise<void>((resolve) => {
        let progress = 0;
        const totalCells = board.width * board.height;
        let processedCells = 0;

        const updateProgress = () => {
          if (processedCells < totalCells) {
            // Process in chunks to prevent freezing
            const chunkSize = Math.min(100, totalCells - processedCells);
            processedCells += chunkSize;
            progress = Math.floor((processedCells / totalCells) * 100);

            progressBar.style.width = `${progress}%`;
            progressText.textContent = `Spawning creatures: ${progress}%`;

            if (processedCells < totalCells) {
              requestAnimationFrame(updateProgress);
            } else {
              // Actually initialize the board
              game.initializeBoard();
              setTimeout(() => {
                progressOverlay.classList.remove('active');
                resolve();
              }, 300);
            }
          }
        };

        updateProgress();
      });
    } else {
      // Fallback if progress elements not found
      game.initializeBoard();
    }
  } else {
    // Small board - initialize normally
    game.initializeBoard();
  }

  updateStatistics();

  // Reset alert flags
  maleExtinctionAlerted = false;
  femaleExtinctionAlerted = false;
  capacityWarningShown = false;
  previousMaleCount = 0;
  previousFemaleCount = 0;

  startBtn.disabled = true;
  pauseBtn.disabled = false;
  stepBtn.disabled = false;
  runBtn.disabled = false;
  resetBtn.disabled = false;
  finishBtn.disabled = false;
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
  // Disable step button during animations
  stepBtn.disabled = true;
  game.step();
});

// Set up callback to re-enable step button when animations complete
game.onStepComplete = () => {
  stepBtn.disabled = false;
};

runBtn.addEventListener('click', () => {
  console.log('[UI] Run clicked');
  game.start();
  pauseBtn.textContent = 'Pause';
  runBtn.disabled = true;
  stepBtn.disabled = true;
});

resetBtn.addEventListener('click', () => {
  console.log('[UI] Reset clicked');
  game.reset();
  updateStatistics();
  renderPopulationGraph();
  // Show config panel again for new game
  configPanel.show();
  // Disable game controls
  startBtn.disabled = true;
  pauseBtn.disabled = true;
  pauseBtn.textContent = 'Pause';
  stepBtn.disabled = true;
  runBtn.disabled = true;
  resetBtn.disabled = true;
  finishBtn.disabled = true;
});

finishBtn.addEventListener('click', () => {
  console.log('[UI] Finish game clicked');
  game.reset();
  updateStatistics();
  renderPopulationGraph();
  // Show config panel again for new game
  configPanel.show();
  // Disable game controls
  startBtn.disabled = true;
  pauseBtn.disabled = true;
  pauseBtn.textContent = 'Pause';
  stepBtn.disabled = true;
  runBtn.disabled = true;
  resetBtn.disabled = true;
  finishBtn.disabled = true;
});

// Speed control
speedSelect.addEventListener('change', () => {
  const speed = parseInt(speedSelect.value, 10);
  console.log(`[UI] Speed changed to ${speed}ms`);
  game.setSpeed(speed);
});

// Rules Modal Controls
const helpBtn = document.getElementById('helpBtn') as HTMLButtonElement;
const rulesModal = document.getElementById('rulesModal') as HTMLDivElement;
const closeModalBtn = document.getElementById('closeModal') as HTMLButtonElement;
const modalTabs = document.querySelectorAll('.modal-tab');
const tabContents = document.querySelectorAll('.tab-content');

function openRulesModal(): void {
  rulesModal.classList.add('active');
}

function closeRulesModal(): void {
  rulesModal.classList.remove('active');
}

helpBtn.addEventListener('click', openRulesModal);
closeModalBtn.addEventListener('click', closeRulesModal);

// Click outside modal to close
rulesModal.addEventListener('click', (e) => {
  if (e.target === rulesModal) {
    closeRulesModal();
  }
});

// Tab switching
modalTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const tabName = tab.getAttribute('data-tab');

    // Remove active class from all tabs and contents
    modalTabs.forEach(t => t.classList.remove('active'));
    tabContents.forEach(content => content.classList.remove('active'));

    // Add active class to clicked tab and corresponding content
    tab.classList.add('active');
    const activeContent = document.getElementById(`${tabName}-tab`);
    if (activeContent) {
      activeContent.classList.add('active');
    }
  });
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  // Escape to close modal
  if (e.code === 'Escape' && rulesModal.classList.contains('active')) {
    e.preventDefault();
    closeRulesModal();
    return;
  }

  // Ignore if user is typing in an input field
  if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) {
    return;
  }

  // Ignore if modal is open
  if (rulesModal.classList.contains('active')) {
    return;
  }

  switch (e.code) {
    case 'Space':
      e.preventDefault();
      pauseBtn.click();
      break;
    case 'ArrowRight':
      e.preventDefault();
      if (!game.running() && !stepBtn.disabled) {
        stepBtn.click();
      }
      break;
    case 'ArrowUp':
      e.preventDefault();
      if (!game.running() && !stepBtn.disabled) {
        // Run 5 rounds
        for (let i = 0; i < 5; i++) {
          game.step();
        }
        console.log('[UI] Ran 5 rounds via Up arrow');
      }
      break;
    case 'ArrowDown':
    case 'ArrowLeft':
      e.preventDefault();
      if (game.running()) {
        pauseBtn.click();
      }
      break;
  }
});

// Initial update
updateRoundCounter();
updateStatistics();

console.log('Game of Life Simulator initialized');
console.log('Board size:', board.width, 'x', board.height);
console.log('Press "Start Game" to begin');
