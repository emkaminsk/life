# Game of Life - PRD Planning Summary

## Conversation Summary

<a id="decisions"></a>
## Decisions

### Product Scope & Target Audience
1. **Target Audience**: Children aged 11-15 years old
2. **Educational Goals**:
   - Understand population dynamics
   - Observe cause-effect relationships
   - Experiment with ecosystem balance
3. **MVP Scope Exclusions**:
   - No tutorial system
   - No data export functionality
   - No game state saving
   - No additional performance testing beyond standard implementation
   - No intent visualization (showing creature targeting)

### Technical Stack & Architecture
4. **Technology**: Vanilla JavaScript with HTML5 Canvas for performance
5. **File Structure**:
   - `index.html` - Entry point
   - `css/styles.css` - Styling
   - `js/game.js` - Main game loop
   - `js/board.js` - Board rendering
   - `js/entities.js` - Creature/plant classes
   - `js/config.js` - Configuration management
   - `js/ui.js` - UI controls
   - `js/utils.js` - Helper functions (Gompertz calculation, etc.)

### Game Mechanics & Parameters
6. **Health System**:
   - Scale: 0-100 for all creatures
   - Starting values: Humans (100), Wolves (80), Dogs (70)
   - Fruit healing: +30 energy
   - Mushroom damage: -40 energy

7. **Death Probability Model**: Gompertz function
   - Formula: `P(death | age) = 1 - e^(-A * e^(B * age))`
   - Default values: A=0.0001, B=0.1 for all creature types
   - Configurable parameters: "Age Mortality Rate (A)" and "Age Acceleration (B)"

8. **Movement System**:
   - Perception range: configurable parameter per creature type
   - Probability to move closer to target: configurable parameter
   - Algorithm: If target in perception range → 70% (parameter) move closer, 30% (parameter) random; otherwise purely random
   - When multiple squares equidistant: random choice among them
   - If blocked: random available adjacent square

9. **Round Priority Order**:
   1. Movement
   2. Combat/damage dealing
   3. Eating (plants)
   4. Reproduction
   5. Death/removal
   6. Birth
   7. Plant spawning

10. **Board Specifications**:
    - Minimum: 10x10 (100 fields)
    - Maximum: 100x100 (10,000 fields)
    - Default: 30x30 (900 fields)
    - Max objects: 1,000 total creatures

11. **Additional Game Rules**:
    - Male humans deal damage back to wolves when attacked
    - Female humans do not fight back against wolves
    - Pregnancy lost if female dies
    - Skip plant spawning if no empty squares available

### User Interface & Visualization
12. **Visual Design**:
    - Nature-inspired color scheme (earth tones: brown/green board background)
    - White/light gray configuration panel
    - Green buttons for Start/Run
    - Red buttons for Pause/Finish
    - Minimal, educational design (avoid game-like flashiness)
    - System fonts for accessibility

13. **Emoji Representations**:
    - Standard creatures: 🧑‍🦰 (human), 🐺 (wolf), 🐕 (dog)
    - Pregnant females: 🤰
    - Unripe fruit: 🍏 (green apple)
    - Ripe fruit: 🍎 (red apple)
    - Mushroom: 🍄
    - Injured creatures (health < 50%): Red border (3px, #FF0000 at 60% opacity) around cell

14. **Visual Feedback**:
    - Combat: Brief red flash on affected squares
    - Reproduction: Green flash
    - Eating: Yellow flash
    - Flashes last ~1 second

15. **Configuration Panel**:
    - Collapsible sections: Board Setup, Humans, Animals, Plants, Population Control
    - Two-column layout for space efficiency
    - Real-time validation with visual indicators (red border for invalid values)
    - Tooltips showing valid ranges
    - "Start Game" button
    - "Reset to Defaults" button
    - Only accessible before game starts or after game finishes
    - Configuration locked once game starts

16. **Configuration Validation**:
    - Spawn probability sum ≤ 100% per field
    - Warning at 90%: "High spawn probability may cause overcrowding at game start"
    - Real-time calculation: "Expected starting creatures: ~X"
    - No upper limits on other parameters (encourage experimentation)

17. **Controls & Keyboard Shortcuts**:
    - Pause button
    - Run one round button
    - Run five rounds button
    - Run free button
    - Finish game button
    - Speed slider: Slow (500ms/round), Medium (200ms/round), Fast (50ms/round)
    - Keyboard: Space (pause/play), Right arrow (advance 1 round), Up arrow (advance 5 rounds), Down arrow (pause), Left arrow (pause)

18. **Statistics Panel** (top-right corner):
    - Males (count)
    - Females (count, with X pregnant)
    - Wolves (count)
    - Dogs (count)
    - Fruits (count ripe/unripe)
    - Mushrooms (count)
    - Total creatures: X/(number of fields)
    - Line graph showing total human population over time

19. **Rules Reference Panel**:
    - "?" button in top-right corner
    - Modal overlay with tabbed sections:
      - Game Rules
      - Creature Types
      - Plant Types
      - Controls
    - Quick-reference mode (condensed sidebar, toggleable)
    - Qualitative descriptions ("Wolves hunt humans")
    - Priority order documentation prominent

20. **Notifications**:
    - Alert when all males die
    - Alert when all females die
    - Warning at 90% board capacity: "Board nearly full - ecosystem may become unstable"

### Performance & Optimization
21. **Rendering Strategy**:
    - requestAnimationFrame for smooth rendering
    - Dirty rectangle optimization (only redraw changed cells)
    - Cache emoji images to avoid repeated text rendering
    - Throttle rendering to max 60 FPS
    - Skip rendering intermediate states if game logic faster than rendering
    - Display actual FPS in debug mode (hidden in production)

22. **Loading States**:
    - For boards >50x50: Display "Initializing game..." with progress indicator
    - Show "Spawning creatures: X%" during entity creation

### Browser Compatibility
23. **Target Browsers**:
    - Chrome (primary)
    - Firefox
    - No explicit testing for other browsers in MVP

---

<a id="matched_recommendations"></a>
## Matched Recommendations

### Educational Focus
1. **Age-appropriate complexity**: For 11-15 year olds, expose full parameter set to enable deep experimentation and learning about complex systems

2. **Learning objectives alignment**: Design parameter interface to guide discovery of population dynamics, cause-effect relationships, and ecosystem balance concepts

3. **Clear cause-effect feedback**: Visual indicators (flashes) help students connect actions to outcomes in real-time

### User Experience
4. **Configuration organization**: Collapsible sections with logical grouping reduce cognitive load while maintaining access to all parameters

5. **Real-time validation**: Immediate feedback on invalid configurations helps students learn constraints while experimenting

6. **Multiple interaction speeds**: Speed slider allows both detailed observation (slow) and long-term trend analysis (fast)

7. **Keyboard accessibility**: Arrow key controls improve accessibility and enable efficient classroom use

8. **Rules transparency**: Modal reference panel with qualitative descriptions makes complex mechanics understandable without overwhelming the interface

### Technical Implementation
9. **Vanilla JS + Canvas**: Provides best performance for grid-based rendering with 1000+ objects

10. **Modular architecture**: Separation of concerns (game logic, rendering, entities, UI) aids maintainability and future expansion

11. **Gompertz mortality model**: Scientifically accurate aging model teaches realistic population dynamics

12. **Dirty rectangle optimization**: Efficient rendering strategy scales well with board size

13. **Performance throttling**: Decoupling game logic speed from rendering prevents performance degradation

### Game Design
14. **Priority order system**: Explicit resolution order for simultaneous events creates predictable, learnable system

15. **Weighted random movement**: Combination of bias and randomness creates emergent behaviors while maintaining predictability

16. **Pregnancy mechanics**: Female vulnerability during pregnancy creates interesting strategic dynamics for observation

17. **Resource scarcity**: Board capacity limits and overcrowding mechanics teach resource constraints

18. **No tutorial required**: For target age group, exploration-based learning with good documentation is more engaging

### Scope Management
19. **MVP focus**: Excluding tutorials, data export, and saves keeps initial development focused on core educational value

20. **Future-ready architecture**: Modular design and planned enhancement areas (graphs, saved experiments) enable natural growth

---

<a id="prd_planning_summary"></a>
## PRD Planning Summary

### Product Overview
**Game of Life** is a browser-based educational simulation tool designed for students aged 11-15 to explore population dynamics, cause-effect relationships, and ecosystem balance through interactive experimentation. The game simulates a simple ecosystem with humans, animals (wolves and dogs), and plants (fruits and mushrooms) on a grid-based board, with configurable parameters governing all behaviors.

### Core Functional Requirements

#### Game Mechanics
The simulation operates in discrete rounds with a fixed priority order:
1. All creatures move one square (weighted random movement toward targets within perception range)
2. Combat damage applied (wolves vs humans, dogs vs wolves, males vs males)
3. Plant consumption (fruits heal, mushrooms poison)
4. Reproduction attempts (male + female humans with probability)
5. Death removal (creatures with health ≤ 0)
6. Birth processing (end of pregnancy period)
7. Plant spawning (random on empty squares)

#### Entity Types & Behaviors
**Humans** (male/female):
- Move toward fruits when in perception range
- Males fight each other and fight back against wolves
- Females don't fight but can reproduce and become pregnant
- Reproduction requires male + female on adjacent squares
- Pregnancy lasts configurable rounds with cooldown period

**Animals**:
- **Wolves**: Hunt humans, deal damage to adjacent humans at round end
- **Dogs**: Protect humans, deal damage to adjacent wolves at round end
- Both move toward their respective targets within perception range

**Plants**:
- **Fruits**: Heal humans (+30 energy default), require ripening period
- **Mushrooms**: Poison creatures (-40 energy default), immediately poisonous

All creatures use Gompertz mortality model for age-based death probability.

#### Configuration System
Comprehensive parameter control organized into sections:
- **Board Setup**: Dimensions (10x10 to 100x100), spawn probabilities for each entity type
- **Humans**: Health, damage, reproduction probability, age mortality (A, B), perception range, movement bias
- **Animals**: Separate parameters for wolves and dogs (health, damage, mortality, perception, movement)
- **Plants**: Energy values, spawn rates, ripening periods
- **Population Control**: Overcrowding thresholds and death multipliers

All parameters configurable before game start with real-time validation and helpful tooltips.

#### Visualization & UI
- **Main View**: Canvas-based grid with emoji representations, visual state indicators (pregnancy, injury, ripeness)
- **Statistics Panel**: Real-time counts + population graph over time
- **Controls**: Pause, step (1 or 5 rounds), run continuously with speed control
- **Configuration Panel**: Modal overlay when game not running
- **Rules Reference**: Accessible "?" button with comprehensive game documentation
- **Event Feedback**: Color-coded flashes for combat, reproduction, eating

### Key User Stories

1. **Student explores basic ecosystem**
   - Student opens application
   - Views default 30x30 configuration
   - Clicks "Start Game"
   - Observes initial population interactions
   - Notices population cycles as predators and prey interact
   - Sees extinction events and understands causes

2. **Student experiments with parameters**
   - Student finishes initial game
   - Adjusts wolf damage parameter to be higher
   - Starts new game
   - Observes humans dying more quickly
   - Connects parameter change to outcome
   - Iterates with different values to find balance

3. **Student discovers emergent behaviors**
   - Student sets high fruit spawn rate
   - Observes human population explosion
   - Notices overcrowding effects kick in
   - Adjusts overcrowding threshold
   - Learns about density-dependent population regulation

4. **Student investigates reproduction mechanics**
   - Student uses slow speed mode
   - Steps through rounds one at a time
   - Observes male-female interactions
   - Sees pregnancy state changes
   - Understands pregnancy period and cooldown effects

5. **Student analyzes long-term trends**
   - Student configures balanced ecosystem
   - Runs in fast mode for extended time
   - Watches population graph
   - Identifies cyclical patterns
   - Understands predator-prey dynamics

### Success Criteria & Measurement

#### Educational Outcomes
1. **Population Dynamics Understanding**
   - Success: Students can predict how parameter changes affect population trends
   - Measure: Post-use survey asking students to explain what happens when predator damage increases

2. **Cause-Effect Recognition**
   - Success: Students connect specific mechanics to observed outcomes
   - Measure: Students can articulate why populations crashed/thrived in their experiments

3. **Ecosystem Balance Experimentation**
   - Success: Students discover stable configurations through iteration
   - Measure: Classroom discussion reveals students found multiple stable states

#### Technical Performance
1. **Rendering Performance**
   - Success: Maintain 30+ FPS on default configuration
   - Measure: Built-in FPS counter in debug mode

2. **Browser Compatibility**
   - Success: Full functionality in Chrome and Firefox
   - Measure: Manual testing on both browsers

3. **Large Board Performance**
   - Success: 100x100 board with 1000 creatures runs smoothly in medium speed
   - Measure: Performance testing with maximum configuration

#### Usability
1. **Configuration Clarity**
   - Success: Students can modify parameters without teacher assistance
   - Measure: Observation of first-time users navigating configuration panel

2. **Rules Comprehension**
   - Success: Students understand game mechanics from documentation
   - Measure: Students can explain priority order and creature behaviors

3. **Engagement**
   - Success: Students voluntarily experiment with multiple configurations
   - Measure: Session length and number of different configurations tested

### Technical Architecture

#### Components
- **game.js**: Main game loop, state management, round processing
- **board.js**: Canvas rendering, dirty rectangle optimization, emoji caching
- **entities.js**: OOP classes for Creature (Human, Wolf, Dog) and Plant (Fruit, Mushroom)
- **config.js**: Configuration state, validation, defaults, parameter ranges
- **ui.js**: UI controls, statistics panel, graph rendering, modal management
- **utils.js**: Gompertz calculation, distance calculation, random utilities

#### Data Structures
```javascript
// Board state
{
  width: number,
  height: number,
  cells: Array<Array<Entity | null>>,
  round: number
}

// Entity base class
{
  id: string,
  type: 'human' | 'wolf' | 'dog' | 'fruit' | 'mushroom',
  x: number,
  y: number,
  health: number,
  age: number
}

// Human extensions
{
  gender: 'male' | 'female',
  isPregnant: boolean,
  pregnancyRounds: number,
  cooldownRounds: number
}

// Configuration
{
  board: { width, height },
  spawnProbabilities: { ... },
  creatures: { humans: {...}, wolves: {...}, dogs: {...} },
  plants: { fruits: {...}, mushrooms: {...} },
  overcrowding: { ... }
}
```

#### Rendering Strategy
- Use requestAnimationFrame for frame timing
- Maintain dirty cell list for changed positions
- Redraw only dirty cells plus their neighbors
- Cache emoji renders as ImageBitmap
- Decouple game logic tick rate from render frame rate

#### State Management
- Immutable configuration once game starts
- Mutable game state during gameplay
- Clear separation between configuration and runtime state
- Event queue for visual feedback (flashes)

### Design Specifications

#### Visual Style
- **Color Palette**:
  - Board background: #8B7355 (brown earth tone)
  - Grid lines: #6B5344 (darker brown)
  - Configuration panel: #F5F5F5 (light gray)
  - Start/Run buttons: #4CAF50 (green)
  - Pause/Finish buttons: #F44336 (red)
  - Warning text: #FF9800 (orange)

- **Typography**:
  - System font stack for accessibility
  - Clear hierarchy (headings, body, labels)
  - Sufficient size for classroom projection (min 14px body)

- **Layout**:
  - Canvas centered, responsive to window size
  - Statistics panel: fixed top-right
  - Round counter: fixed top-left
  - Controls: bottom center
  - Configuration: modal overlay

#### Interaction Patterns
- Hover tooltips for all parameters
- Visual feedback on all button clicks
- Progress indicators for async operations (initialization)
- Disabled state for invalid actions (Start when config invalid)
- Clear affordances (buttons look clickable)

### Future Enhancement Opportunities
While not in MVP, architecture should support:
1. Save/load game configurations
2. Export statistical data as CSV
3. Screenshot/recording functionality
4. Tutorial scenarios
5. Achievement system tied to learning objectives
6. Multiplayer scenario sharing
7. More sophisticated graphing (multi-variable plots)
8. Historical playback (rewind functionality)

---

<a id="unresolved_issues"></a>
## Unresolved Issues

### Minor Clarifications Needed
1. **Exact color values**: While color scheme is defined (earth tones), specific hex values for board background, grid lines, etc. should be finalized during design phase

2. **Graph implementation details**:
   - How many rounds of history to display on population graph?
   - Should graph be scrollable or compress entire history?
   - What should graph axes labels show?

3. **Flash animation timing**:
   - Exact duration of visual feedback flashes (1 second mentioned, but could be refined)
   - Should flashes stack or override when multiple events occur on same square?

4. **Edge case behaviors**:
   - What happens if a pregnant female is the last female and dies? (Already decided pregnancy lost, but worth highlighting as important edge case)
   - When board is completely full, should game auto-pause with message?
   - How to handle multiple wolves adjacent to one human in same round?

5. **Configuration presets**:
   - While user chooses config, having a "recommended starting point" might help initial exploration
   - Consider whether truly random initial states or slightly curated defaults work better educationally

6. **Performance metrics**:
   - Specific FPS target for "good performance" on different board sizes
   - Whether to include performance warnings for large configurations

7. **Accessibility features**:
   - Beyond keyboard controls, consider screen reader support level for MVP
   - Color contrast ratios for text on earth-tone backgrounds
   - Whether to support reduced motion preferences (disable flashes)

### Technical Investigation Required
1. **Canvas text rendering performance**:
   - Need to benchmark emoji rendering in Canvas across browsers
   - May need fallback strategy if emoji caching doesn't provide sufficient performance

2. **Mobile/tablet support scope**:
   - While desktop Chrome/Firefox specified, clarify whether tablet support is desired
   - Touch controls vs keyboard controls for mobile environments

3. **Large board initialization**:
   - Actual performance testing needed to determine if >50x50 threshold for loading indicator is correct
   - May need to adjust based on device capabilities

### Documentation Gaps
1. **Default parameter values**: While some are specified (Gompertz A=0.0001, B=0.1), full default configuration for all parameters should be documented in config.js

2. **Validation rules**: Specific valid ranges for each parameter should be explicitly listed (e.g., perception range: 1-10, health: 1-200, etc.)

3. **Testing strategy**: No explicit testing requirements defined for MVP (unit tests, integration tests, manual test cases)

---

## Technical analysis performed - results

 1. Tech Stack Assessment: Vanilla JS + Canvas

  ✅ GOOD CHOICE for your situation:
  - Simple setup with Vite (no framework complexity)
  - Canvas is appropriate for grid-based games
  - Good learning opportunity for core web APIs
  - Fast enough with proper optimization

  ⚠️ BUT with one critical caveat:
  - Emoji rendering in Canvas is SLOW - this is your main performance bottleneck

  2. Performance Reality Check (100x100, 1000 objects)

  I ran some mental calculations for worst-case scenario:

  The Math:
  - 10,000 cells to potentially render
  - 1,000 emojis to draw per frame
  - Target: 60 FPS = 16.6ms per frame
  - Canvas fillText() for emojis: ~0.5-2ms per call (varies by browser/emoji)
  - 1000 emojis × 1ms = 1000ms = 1 second per frame ❌

  This won't work without optimization.

  3. Main Difficulties You'll Face

  Critical Performance Issues:

  1. Emoji Rendering (BIGGEST PROBLEM)
    - context.fillText('🧑‍🦰') is expensive
    - Composite emojis (🧑‍🦰) are slower than simple ones (🍎)
    - No hardware acceleration for text
  2. State Management Complexity
    - 1000 objects with individual state (health, age, position, pregnancy, etc.)
    - Complex interactions each round (who's adjacent to whom?)
    - Priority order processing with cascading effects
  3. Collision/Adjacency Detection
    - Naive approach: O(n²) for 1000 objects = 1,000,000 checks per round
    - Need spatial partitioning (grid-based lookup)

  Moderate Challenges:

  4. Game Logic Complexity
    - Gompertz function calculations × 1000 entities
    - Weighted random movement calculations
    - Reproduction/combat/eating resolution
  5. Memory Management
    - Creating/destroying objects frequently (births/deaths)
    - Garbage collection can cause frame drops

  4. Recommended Solutions (Phased Approach)

  Phase 1: Start Simple, Validate Concept

  // Start with SMALLER limits for development:
  // - 30x30 board (900 cells)
  // - ~100-200 objects max
  // - Get everything working first

  Why: This will run smoothly and let you focus on game logic, not optimization.

  Phase 2: Optimize Rendering (Critical for 1000 objects)

  Solution A: Pre-render Emojis to Canvas Images (Recommended)
  // One-time cost at startup
  const emojiCache = {};
  function cacheEmoji(emoji, size) {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');
    ctx.font = `${size}px Arial`;
    ctx.fillText(emoji, 0, 0);
    emojiCache[emoji] = canvas;
  }

  // Fast render using drawImage instead of fillText
  ctx.drawImage(emojiCache['🧑‍🦰'], x, y);
  Performance gain: 5-10x faster (drawImage is hardware accelerated)

  Solution B: Use Image Sprites Instead of Emojis
  - Convert emojis to small PNG sprites
  - Even faster than cached Canvas
  - More consistent cross-browser

  Phase 3: Optimize Game Logic

  Spatial Partitioning:
  // Instead of checking all 1000 entities for adjacency:
  // Build a lookup grid
  const grid = new Map(); // key: "x,y", value: entity

  function getAdjacent(x, y) {
    const adjacent = [];
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const entity = grid.get(`${x+dx},${y+dy}`);
        if (entity) adjacent.push(entity);
      }
    }
    return adjacent; // O(8) instead of O(n)
  }

  Dirty Rectangle Optimization:
  const dirtyRects = new Set();

  function markDirty(x, y) {
    dirtyRects.add(`${x},${y}`);
  }

  function render() {
    dirtyRects.forEach(key => {
      const [x, y] = key.split(',').map(Number);
      // Only redraw this cell
    });
    dirtyRects.clear();
  }

  Phase 4: If Still Slow, Consider Alternatives

  Option A: Switch to PixiJS (WebGL-based)
  - Much faster rendering (GPU acceleration)
  - Similar API to Canvas
  - Good middle ground between vanilla and full framework

  Option B: Reduce maximum to 50x50 / 500 objects
  - Still educational
  - Guaranteed smooth performance
  - Less coding complexity
  
---

## Next Steps

### Immediate Actions
1. **Finalize Design Specifications**: Create detailed design mockups for configuration panel and main game view
2. **Complete Default Configuration**: Document all default parameter values in specification
3. **Define Validation Rules**: Create comprehensive table of parameter ranges and validation logic
4. **Create Technical PRD**: Transform this planning summary into formal PRD document

### Development Preparation
1. Set up project repository with defined file structure
2. Create development environment guidelines
3. Define coding standards for JavaScript modules
4. Establish testing framework (if applicable)

### Future Planning Sessions
1. Post-MVP feature prioritization
2. Classroom deployment strategy
3. Teacher/educator feedback collection plan
4. Iterative improvement roadmap based on educational outcomes

---

*Document Version: 1.0*
*Last Updated: 2025-11-25*
*Status: Planning Complete - Ready for PRD Development*
