# Product Requirements Document (PRD) - Game of Life Educational Simulator

## 1. Product Overview

Game of Life is a browser-based educational simulation tool designed for students aged 11-15 to explore population dynamics, cause-effect relationships, and ecosystem balance through interactive experimentation. The application simulates a simple ecosystem with humans (males and females), animals (wolves and dogs), and plants (fruits and mushrooms) on a grid-based board, with comprehensive configurable parameters governing all behaviors.

The simulation operates in discrete rounds with a fixed priority order, allowing students to observe emergent behaviors and learn about complex systems through hands-on experimentation. Built with vanilla JavaScript and HTML5 Canvas for optimal performance, the application supports boards ranging from 10x10 to 100x100 cells with up to 1,000 total creatures.

Target delivery: MVP focused on core educational value with complete parameter configurability, visual feedback systems, and comprehensive documentation, excluding tutorials, data export, and save functionality.

## 2. User Problem

Students aged 11-15 need hands-on tools to understand abstract concepts in population dynamics, ecosystem balance, and cause-effect relationships. Traditional learning methods often fail to demonstrate:

- How predator-prey relationships create cyclical population patterns
- The impact of resource availability on population growth and collapse
- How individual behaviors combine to create emergent system-level patterns
- The effects of aging, reproduction, and competition on population stability
- How density-dependent factors regulate population sizes

Current educational simulations either oversimplify (losing educational depth) or overcomplicate (becoming inaccessible to middle-school students). Teachers need a tool that balances complexity with accessibility, allowing students to experiment with real parameters while maintaining clear visual feedback and transparent rule systems.

The solution must enable exploration-based learning where students discover principles through experimentation rather than passive observation, while providing sufficient structure and documentation to support classroom use without requiring extensive teacher preparation.

## 3. Functional Requirements

### 3.1 Game Board and Entities

3.1.1 Board displays as a grid with configurable dimensions (10x10 minimum, 100x100 maximum, 30x30 default)

3.1.2 Board edges function as walls preventing creature movement beyond boundaries

3.1.3 Each cell can contain at most one entity at any time

3.1.4 Entities are represented by emojis (spirits, images): 🧑‍🦰 (male human), 👩 (female human), 🤰 (pregnant female), 🐺 (wolf), 🐕 (dog), 🍎 (ripe fruit), 🍏 (unripe fruit), 🍄 (mushroom)

3.1.5 Injured creatures (health < certain level (parameter) of health) display red border (3px, #FF0000 at 60% opacity) around cell

### 3.2 Creature Mechanics

3.2.1 All creatures possess health (0-100 scale), age (in rounds), and position (x, y coordinates)

3.2.2 Creatures move one square per round using weighted random movement: if target within perception range, configured probability to move closer, otherwise random

3.2.3 When multiple squares are equidistant to target, creature randomly selects among them

3.2.4 If preferred movement blocked, creature selects random available adjacent square

3.2.5 Creatures die when health falls to or below zero, removed during death phase

3.2.6 All creatures subject to age-based mortality using Gompertz function: P(death | age) = 1 - e^(-A × e^(B × age))

3.2.7 When population exceeds overcrowding threshold, death probability multiplied by configured overcrowding multiplier

### 3.3 Human Behavior

3.3.1 Humans move toward fruits when fruits detected within perception range

3.3.2 Males and females on adjacent squares (including diagonals) attempt reproduction with configured probability

3.3.3 Each adjacent male-female pair can reproduce independently in same round

3.3.4 Successful reproduction places female in pregnant state with visible pregnancy indicator (🤰)

3.3.5 Pregnancy lasts configured number of rounds before birth occurs

3.3.6 After birth, female enters cooldown period (configured rounds) preventing new pregnancy

3.3.7 If pregnant female dies, pregnancy is lost

3.3.8 Two males on adjacent squares fight, each dealing configured damage to the other

3.3.9 Two females on adjacent squares do not fight

3.3.10 When wolf adjacent to male at round end, male deals configured damage back to wolf

3.3.11 When wolf adjacent to female at round end, female takes damage but does not fight back

### 3.4 Animal Behavior

3.4.1 Wolves move toward humans when humans detected within perception range

3.4.2 When wolf on square adjacent to human at round end, wolf deals configured damage to human

3.4.3 Dogs move toward wolves when wolves detected within perception range

3.4.4 When dog on square adjacent to wolf at round end, dog deals configured damage to wolf

### 3.5 Plant Mechanics

3.5.1 Fruits spawn randomly on empty squares with configured probability per round

3.5.2 Newly spawned fruit is unripe (🍏) for configured number of rounds

3.5.3 After ripening period, fruit becomes ripe (🍎) and edible

3.5.4 When ripe fruit adjacent to human at round end, one random human (if multiple adjacent) eats it, gaining configured energy

3.5.5 Eaten fruit is removed from board

3.5.6 Mushrooms spawn randomly on empty squares with configured probability per round

3.5.7 Mushrooms are immediately poisonous upon spawning

3.5.8 When mushroom adjacent to human at round end, one random human (if multiple adjacent) eats it, losing configured energy

3.5.9 Eaten mushroom is removed from board

3.5.10 Plant spawning skipped when no empty squares available

### 3.6 Round Priority Order

3.6.1 Each round executes phases in fixed order: (1) Movement, (2) Combat/damage dealing, (3) Eating (plants), (4) Reproduction, (5) Death/removal, (6) Birth, (7) Plant spawning

3.6.2 All entities complete current phase before next phase begins

3.6.3 Round counter increments after all phases complete

### 3.7 Configuration System

3.7.1 Configuration panel accessible only before game starts or after game finishes

3.7.2 Configuration locked (read-only) once game starts

3.7.3 Configuration organized into collapsible sections: Board Setup, Humans, Animals, Plants, Population Control

3.7.4 Board Setup section includes: width (10-100), height (10-100), spawn probabilities for each entity type, health level below which red border is displayed

3.7.5 Human configuration includes: starting health, male damage to wolf, male damage to male, reproduction probability, pregnancy period, cooldown period, age mortality rate A, age acceleration B, perception range, probability to move toward fruit

3.7.6 Wolf configuration includes: starting health, damage to human, age mortality rate A, age acceleration B, perception range, probability to move toward human

3.7.7 Dog configuration includes: starting health, damage to wolf, age mortality rate A, age acceleration B, perception range, probability to move toward wolf

3.7.8 Fruit configuration includes: energy added to human, spawn probability per round, rounds to ripen

3.7.9 Mushroom configuration includes: energy removed from human, spawn probability per round

3.7.10 Population Control configuration includes: human overcrowding threshold, human overcrowding multiplier, animal overcrowding threshold, animal overcrowding multiplier

3.7.11 Real-time validation with visual indicators (red border for invalid values)

3.7.12 Tooltips display valid ranges for each parameter

3.7.13 Validation ensures sum of spawn probabilities does not exceed 100% per field

3.7.14 Warning displays at 90% total spawn probability: "High spawn probability may cause overcrowding at game start"

3.7.15 Real-time calculation displays: "Expected starting creatures: approximately X"

3.7.16 "Reset to Defaults" button restores all parameters to default values

3.7.17 "Start Game" button initializes simulation with current configuration

### 3.8 Game Controls

3.8.1 Pause button pauses continuous simulation

3.8.2 "Run One Round" button advances simulation by exactly one round

3.8.3 "Run Five Rounds" button advances simulation by exactly five rounds

3.8.4 "Run Free" button starts continuous simulation at configured speed

3.8.5 "Finish Game" button ends current simulation and displays configuration panel

3.8.6 Speed slider controls simulation speed: Slow (500ms/round), Medium (200ms/round), Fast (50ms/round)

3.8.7 Keyboard shortcuts: Space (pause/play toggle), Right arrow (advance 1 round), Up arrow (advance 5 rounds), Down arrow (pause), Left arrow (pause)

3.8.8 All controls disabled during round execution to prevent state corruption

### 3.9 Visual Feedback

3.9.1 Combat events trigger brief red flash (approximately 1 second) on affected squares

3.9.2 Reproduction events trigger brief green flash (approximately 1 second) on affected squares

3.9.3 Eating events trigger brief yellow flash (approximately 1 second) on affected squares

3.9.4 Canvas rendering uses requestAnimationFrame for smooth display

3.9.5 Dirty rectangle optimization redraws only changed cells and neighbors

3.9.6 Emoji images cached to avoid repeated text rendering

3.9.7 Rendering throttled to maximum 60 FPS

3.9.8 Intermediate states skipped when game logic faster than rendering

### 3.10 Statistics Display

3.10.1 Statistics panel fixed in top-right corner displays: Males (count), Females (count, with X pregnant), Wolves (count), Dogs (count), Fruits (count ripe/unripe), Mushrooms (count), Total creatures: X/(number of fields)

3.10.2 Line graph shows total human population (males + females) over time

3.10.3 Graph updates in real-time as simulation progresses

3.10.4 Round counter displays in top-left corner

### 3.11 Rules Reference

3.11.1 "?" button in top-right corner opens modal overlay

3.11.2 Modal contains tabbed sections: Game Rules, Creature Types, Plant Types, Controls

3.11.3 Game Rules tab prominently displays priority order documentation

3.11.4 Creature Types tab provides qualitative descriptions (example: "Wolves hunt humans")

3.11.5 Plant Types tab describes fruit and mushroom mechanics

3.11.6 Controls tab documents all keyboard shortcuts and button functions

3.11.7 Modal closeable by clicking outside, pressing Escape, or clicking close button

### 3.12 Notifications

3.12.1 Alert displays when all males die: "All males have died - reproduction no longer possible"

3.12.2 Alert displays when all females die: "All females have died - reproduction no longer possible"

3.12.3 Warning displays at 90% board capacity: "Board nearly full - ecosystem may become unstable"

3.12.4 Notifications appear as non-intrusive overlay messages

### 3.13 Initialization

3.13.1 For boards larger than 50x50, display "Initializing game..." with progress indicator

3.13.2 Progress indicator shows "Spawning creatures: X%" during entity creation

3.13.3 Each field randomly determines whether entity spawns based on configured probabilities

3.13.4 Entity type selected randomly if entity spawns, weighted by type-specific probabilities

3.13.5 Configuration applied to all spawned entities

3.13.6 Simulation begins automatically after initialization completes

### 3.14 Performance Requirements

3.14.1 Maintain minimum 30 FPS on default configuration (30x30, approximately 200-300 creatures)

3.14.2 100x100 board with 1000 creatures runs smoothly (no lag, responsive controls) in medium speed mode

3.14.3 Application fully functional in Chrome (primary target) and Firefox

3.14.4 FPS counter available in debug mode (hidden in production)

## 4. Product Boundaries

### 4.1 In Scope for MVP

- Complete simulation with all entity types and behaviors
- Full parameter configurability before game start
- Visual feedback system for events
- Statistics panel with population graph
- Comprehensive rules documentation
- Keyboard and mouse controls
- Real-time configuration validation
- Performance optimization for 1000 creatures

### 4.2 Out of Scope for MVP

- Tutorial system or guided learning experience
- Data export functionality (CSV, JSON)
- Game state saving and loading
- Multiple simultaneous simulations
- Additional performance testing beyond standard implementation
- Intent visualization (showing creature targeting)
- Historical playback or rewind functionality
- Screenshot or recording capabilities
- Achievement system
- Multiplayer or scenario sharing
- Mobile or tablet optimization
- Screen reader support beyond basic accessibility
- Explicit testing for browsers beyond Chrome and Firefox

### 4.3 Future Enhancement Opportunities

- Save/load game configurations
- Export statistical data as CSV
- Screenshot/recording functionality
- Tutorial scenarios
- Achievement system tied to learning objectives
- Multiplayer scenario sharing
- More sophisticated graphing (multi-variable plots)
- Historical playback (rewind functionality)

## 5. User Stories

### US-001: Game Initialization
Title: Start new simulation with default configuration
Description: As a student, I want to quickly start a simulation with default settings so that I can begin exploring immediately without configuration.
Acceptance Criteria:
- Configuration panel displays on application load
- "Start Game" button visible and enabled with default configuration
- Clicking "Start Game" initializes 30x30 board
- Random entities spawn according to default probabilities
- Simulation begins automatically after initialization
- Configuration panel closes and game board displays

### US-002: Board Visualization
Title: View current game state
Description: As a student, I want to see all entities clearly on the board so that I can observe population dynamics.
Acceptance Criteria:
- Board renders with distinct grid lines
- Each entity type displays with unique emoji
- Injured creatures (health < 50%) show red border
- Pregnant females display pregnancy emoji (🤰)
- Unripe fruits display green apple (🍏)
- Ripe fruits display red apple (🍎)
- Board scales appropriately to window size
- All entities visible without overlapping

### US-003: Manual Round Progression
Title: Advance simulation one round at a time
Description: As a student, I want to step through rounds individually so that I can observe detailed cause-effect relationships.
Acceptance Criteria:
- "Run One Round" button visible and enabled when simulation paused
- Clicking button executes exactly one round
- All seven phases execute in priority order
- Board updates reflect changes from round
- Round counter increments by one
- Statistics panel updates
- Button remains enabled for next round

### US-004: Continuous Simulation
Title: Run simulation continuously
Description: As a student, I want to run the simulation automatically so that I can observe long-term population trends.
Acceptance Criteria:
- "Run Free" button visible and enabled when simulation paused
- Clicking button starts continuous execution
- Rounds execute automatically at configured speed
- Board updates smoothly without lag
- Statistics update in real-time
- Graph updates as population changes
- Pause button available to stop continuous execution

### US-005: Speed Control
Title: Adjust simulation speed
Description: As a student, I want to control simulation speed so that I can balance detailed observation with long-term analysis.
Acceptance Criteria:
- Speed slider visible with three positions: Slow, Medium, Fast
- Slow setting executes rounds at 500ms intervals
- Medium setting executes rounds at 200ms intervals
- Fast setting executes rounds at 50ms intervals
- Speed changes take effect immediately during continuous execution
- Speed setting persists when pausing and resuming

### US-006: Pause Simulation
Title: Pause continuous simulation
Description: As a student, I want to pause the simulation so that I can examine the current state in detail.
Acceptance Criteria:
- Pause button visible during continuous execution
- Space bar triggers pause
- Down arrow triggers pause
- Left arrow triggers pause
- Simulation stops after completing current round
- Board state frozen until resume
- Manual round controls become enabled

### US-007: Custom Configuration
Title: Configure simulation parameters
Description: As a student, I want to modify parameters before starting so that I can experiment with different scenarios.
Acceptance Criteria:
- Configuration panel displays before game starts
- All parameters editable in organized sections
- Sections collapsible for focused editing
- Changes reflect immediately in input fields
- Invalid values display red border
- Tooltips show valid ranges on hover
- "Reset to Defaults" restores all values
- "Start Game" applies configuration

### US-008: Configuration Validation
Title: Receive feedback on invalid configuration
Description: As a student, I want to know when my configuration is invalid so that I can correct it before starting.
Acceptance Criteria:
- Invalid numeric values show red border immediately
- Tooltip explains valid range for each parameter
- Sum of spawn probabilities validated
- Warning displays at 90% total spawn probability
- "Start Game" disabled when validation fails
- Error messages clear and actionable
- Expected creature count displays in real-time

### US-009: Human Reproduction
Title: Observe human population growth
Description: As a student, I want to see humans reproduce so that I can understand population growth dynamics.
Acceptance Criteria:
- Male and female on adjacent squares attempt reproduction each round
- Reproduction occurs based on configured probability
- Green flash displays on successful reproduction
- Female displays pregnancy emoji (🤰)
- Pregnancy lasts configured number of rounds
- Birth adds new human at adjacent empty square
- Female enters cooldown period after birth
- Statistics panel shows pregnant female count

### US-010: Predator-Prey Dynamics
Title: Observe wolf-human interactions
Description: As a student, I want to see wolves hunt humans so that I can understand predator-prey relationships.
Acceptance Criteria:
- Wolves move toward humans within perception range
- Wolf adjacent to human deals damage at round end
- Red flash displays on combat squares
- Human health decreases by configured damage amount
- Male humans deal damage back to wolves
- Female humans do not fight back
- Injured creatures display red border when health < 50%
- Creatures die when health reaches zero

### US-011: Resource Consumption
Title: Observe fruit consumption and healing
Description: As a student, I want to see humans eat fruits so that I can understand resource dynamics.
Acceptance Criteria:
- Fruits spawn randomly on empty squares
- Unripe fruits display green apple for configured rounds
- Fruits become ripe (red apple) after ripening period
- Human adjacent to ripe fruit eats it at round end
- Yellow flash displays on eating event
- Human health increases by configured energy
- Eaten fruit removed from board
- Only one human eats fruit when multiple adjacent

### US-012: Poisonous Resources
Title: Observe mushroom poisoning
Description: As a student, I want to see humans get poisoned by mushrooms so that I can understand resource hazards.
Acceptance Criteria:
- Mushrooms spawn randomly on empty squares
- Mushrooms immediately poisonous (no ripening)
- Human adjacent to mushroom eats it at round end
- Yellow flash displays on eating event
- Human health decreases by configured energy loss
- Eaten mushroom removed from board
- Only one human eats mushroom when multiple adjacent

### US-013: Age-Based Mortality
Title: Observe creatures die from old age
Description: As a student, I want to see creatures die from age so that I can understand mortality dynamics.
Acceptance Criteria:
- Each creature has age incrementing each round
- Gompertz function calculates death probability from age
- Death occurs randomly based on calculated probability
- Dead creatures removed during death phase
- Statistics update to reflect deaths
- No visual notification for natural deaths (distinguish from combat)

### US-014: Overcrowding Effects
Title: Observe population regulation
Description: As a student, I want to see overcrowding increase death rates so that I can understand density-dependent regulation.
Acceptance Criteria:
- System tracks total human count and total animal count separately
- When count exceeds configured threshold, overcrowding active
- Death probability multiplied by configured multiplier
- Warning displays at 90% board capacity
- Effects apply to all creatures of overcrowded type
- Statistics help identify when threshold crossed

### US-015: Statistics Tracking
Title: View real-time population statistics
Description: As a student, I want to see current population counts so that I can track population changes.
Acceptance Criteria:
- Statistics panel visible in top-right corner
- Males count updates every round
- Females count updates with pregnant subset
- Wolves count updates every round
- Dogs count updates every round
- Fruits count shows ripe/unripe split
- Mushrooms count updates every round
- Total creatures shows X/(total fields)

### US-016: Population Graph
Title: View population trends over time
Description: As a student, I want to see a graph of population over time so that I can identify patterns.
Acceptance Criteria:
- Line graph displays in statistics panel
- X-axis represents rounds elapsed
- Y-axis represents total human population (males + females)
- Graph updates in real-time during simulation
- Graph maintains history from game start
- Graph scales appropriately to data range
- Graph readable and labeled

### US-017: Rules Reference
Title: Access game rules during simulation
Description: As a student, I want to reference rules without stopping the simulation so that I can understand observed behaviors.
Acceptance Criteria:
- "?" button visible in top-right corner
- Clicking opens modal overlay
- Modal contains four tabs: Game Rules, Creature Types, Plant Types, Controls
- Game Rules tab shows priority order prominently
- Creature Types tab describes all creature behaviors
- Plant Types tab describes fruit and mushroom mechanics
- Controls tab lists all keyboard shortcuts
- Modal closeable by clicking outside, Escape key, or close button
- Simulation continues while modal open

### US-018: Combat Between Males
Title: Observe male competition
Description: As a student, I want to see males fight each other so that I can understand intra-species competition.
Acceptance Criteria:
- Two males on adjacent squares fight at round end
- Each male deals configured damage to the other
- Red flash displays on both combat squares
- Both males lose health simultaneously
- Injured males display red border if health < 50%
- Males die if health reaches zero
- Females do not fight each other

### US-019: Dog Protection
Title: Observe dogs protecting humans
Description: As a student, I want to see dogs attack wolves so that I can understand protective behaviors.
Acceptance Criteria:
- Dogs move toward wolves within perception range
- Dog adjacent to wolf deals damage at round end
- Red flash displays on combat squares
- Wolf health decreases by configured damage
- Dogs do not attack humans
- Wolves do not attack dogs independently (only counter-damage)

### US-020: Keyboard Controls
Title: Control simulation with keyboard
Description: As a student, I want to use keyboard shortcuts so that I can control the simulation efficiently.
Acceptance Criteria:
- Space bar toggles pause/play
- Right arrow advances one round when paused
- Up arrow advances five rounds when paused
- Down arrow pauses continuous simulation
- Left arrow pauses continuous simulation
- Keyboard shortcuts documented in rules modal
- Shortcuts work regardless of focus (except in input fields)

### US-021: Extinction Alerts
Title: Receive alerts on critical population events
Description: As a student, I want to be notified when populations go extinct so that I can understand extinction dynamics.
Acceptance Criteria:
- Alert displays when last male dies: "All males have died - reproduction no longer possible"
- Alert displays when last female dies: "All females have died - reproduction no longer possible"
- Alerts appear as non-intrusive overlay
- Alerts dismissible by clicking or timeout
- Simulation continues during alert display
- Alerts do not repeat for same extinction event

### US-022: Capacity Warning
Title: Receive warning when board nearly full
Description: As a student, I want to know when the board is nearly full so that I can understand carrying capacity.
Acceptance Criteria:
- Warning displays when total creatures reaches 90% of total fields
- Warning message: "Board nearly full - ecosystem may become unstable"
- Warning appears as non-intrusive overlay
- Warning dismissible by clicking or timeout
- Warning does not repeat until capacity drops below 90% then rises again

### US-023: Game Completion
Title: End simulation and restart
Description: As a student, I want to end the current simulation so that I can start a new experiment.
Acceptance Criteria:
- "Finish Game" button visible during simulation
- Clicking button stops simulation immediately
- Configuration panel displays
- Previous configuration values retained
- Statistics reset to zero
- Graph cleared
- Board cleared
- "Start Game" enabled for new simulation

### US-024: Configuration Reset
Title: Restore default parameters
Description: As a student, I want to reset all parameters to defaults so that I can start with known baseline.
Acceptance Criteria:
- "Reset to Defaults" button visible in configuration panel
- Clicking button restores all parameters to default values
- Default values: Human health 100, Wolf health 80, Dog health 70, Fruit energy +30, Mushroom damage -40, Gompertz A 0.0001, Gompertz B 0.1
- Board size resets to 30x30
- All spawn probabilities reset to defaults
- Visual confirmation of reset (values update immediately)
- No confirmation dialog required for MVP

### US-025: Movement Bias Observation
Title: Observe biased random movement
Description: As a student, I want to see creatures move toward targets so that I can understand behavioral biases.
Acceptance Criteria:
- Humans within perception range of fruit move toward fruit with configured probability
- Wolves within perception range of human move toward human with configured probability
- Dogs within perception range of wolf move toward wolf with configured probability
- Creatures outside perception range move randomly
- Movement bias probability configurable per creature type
- Perception range configurable per creature type
- Random component prevents deterministic behavior

### US-026: Pregnancy Vulnerability
Title: Observe pregnant female vulnerability
Description: As a student, I want to see pregnancy affects survival so that I can understand reproductive costs.
Acceptance Criteria:
- Pregnant females display pregnancy emoji (🤰)
- If pregnant female dies, pregnancy lost (no birth occurs)
- Pregnancy period configurable in rounds
- Cooldown period after birth configurable in rounds
- Cooldown prevents immediate re-pregnancy
- Statistics show count of pregnant females

### US-027: Plant Spawning Dynamics
Title: Observe resource regeneration
Description: As a student, I want to see fruits and mushrooms spawn randomly so that I can understand resource renewal.
Acceptance Criteria:
- Each round, each empty square has configured probability to spawn fruit
- Each round, each empty square has configured probability to spawn mushroom
- Spawn probabilities independent (can attempt both)
- Only one entity spawns per square per round if both succeed
- Spawning skipped when no empty squares available
- Fruit spawn probability configurable
- Mushroom spawn probability configurable

### US-028: Priority Order Clarity
Title: Understand event resolution order
Description: As a student, I want to understand the order events occur so that I can predict outcomes.
Acceptance Criteria:
- Rules modal documents priority order: (1) Movement, (2) Combat/damage, (3) Eating, (4) Reproduction, (5) Death/removal, (6) Birth, (7) Plant spawning
- All entities complete current phase before next phase
- Same-phase events can occur simultaneously
- Round counter increments after all phases complete
- Documentation uses clear examples of order effects

### US-029: Large Board Initialization
Title: Initialize large boards with progress feedback
Description: As a student, I want to see initialization progress for large boards so that I know the application is working.
Acceptance Criteria:
- Boards larger than 50x50 display "Initializing game..." message
- Progress indicator shows percentage: "Spawning creatures: X%"
- Progress updates at least every 10% increment
- Initialization completes without freezing browser
- Simulation starts automatically after initialization
- Message disappears when initialization complete

### US-030: Board Size Configuration
Title: Configure board dimensions
Description: As a student, I want to change board size so that I can experiment with different scales.
Acceptance Criteria:
- Width configurable from 10 to 100 fields
- Height configurable from 10 to 100 fields
- Invalid values (< 10 or > 100) show red border
- Expected creature count updates based on dimensions
- Maximum 1000 total creatures enforced
- Configuration validates dimensions before game start

### US-031: Visual Event Feedback
Title: See visual feedback for events
Description: As a student, I want to see flashes when events occur so that I can identify what happened where.
Acceptance Criteria:
- Combat events trigger red flash on affected squares for approximately 1 second
- Reproduction events trigger green flash on affected squares for approximately 1 second
- Eating events trigger yellow flash on affected squares for approximately 1 second
- Multiple events on same square stack visually if possible, or most recent flash takes precedence
- Flashes do not block entity visibility
- Flash timing consistent and noticeable

### US-032: Multi-Female Pregnancy
Title: Observe multiple simultaneous pregnancies
Description: As a student, I want to see multiple females get pregnant in same round so that I can understand parallel reproduction.
Acceptance Criteria:
- Each adjacent male-female pair attempts reproduction independently
- One male can reproduce with multiple adjacent females in same round
- One female can only reproduce once per round (first successful attempt)
- All successful pregnancies display pregnancy emoji
- All pregnancies proceed independently
- All births occur after respective pregnancy periods

### US-033: Configuration Persistence
Title: Maintain configuration during session
Description: As a student, I want my configuration to persist when ending a game so that I can run repeated experiments.
Acceptance Criteria:
- Clicking "Finish Game" retains all configuration values
- Starting new game uses retained configuration
- Configuration values editable before each new game
- Configuration resets only when "Reset to Defaults" clicked
- Browser refresh resets to defaults (no cross-session persistence in MVP)

### US-034: Ripening Process
Title: Observe fruit ripening
Description: As a student, I want to see fruits ripen over time so that I can understand resource availability delays.
Acceptance Criteria:
- Newly spawned fruit displays green apple (🍏)
- Fruit remains unripe for configured number of rounds
- Fruit changes to red apple (🍎) when ripening complete
- Only ripe fruits edible by humans
- Unripe fruits not consumed
- Ripening period configurable in rounds

### US-035: Round Counter
Title: Track simulation progress
Description: As a student, I want to see the current round number so that I can measure time progression.
Acceptance Criteria:
- Round counter displays in top-left corner
- Counter shows "Round: X" format
- Counter increments after each complete round
- Counter resets to 0 when new game starts
- Counter visible at all times during simulation
- Counter updates before board renders new state

### US-036: Blocked Movement Handling
Title: Observe movement when paths blocked
Description: As a student, I want to see how creatures handle blocked movement so that I can understand spatial constraints.
Acceptance Criteria:
- If preferred direction occupied, creature selects random available adjacent square
- If all adjacent squares occupied, creature does not move
- Creatures cannot move beyond board edges (walls)
- Multiple creatures cannot occupy same square
- Movement failures do not generate errors
- Statistics on successful vs. failed movements not required for MVP

### US-037: Simultaneous Combat Resolution
Title: Observe mutual combat damage
Description: As a student, I want to see both combatants take damage simultaneously so that I can understand combat symmetry.
Acceptance Criteria:
- Male vs. male combat: both males take damage simultaneously
- Human male vs. wolf: both take damage simultaneously
- Wolf vs. human female: only female takes damage
- Dog vs. wolf: only wolf takes damage
- All combat damage applied in combat phase (phase 2)
- Deaths from combat processed in death phase (phase 5)

### US-038: Expected Creature Calculation
Title: View expected starting population
Description: As a student, I want to see expected starting creatures before starting so that I can calibrate my experiment.
Acceptance Criteria:
- Configuration panel shows "Expected starting creatures: approximately X"
- Calculation based on board dimensions and spawn probabilities
- Calculation updates in real-time as parameters change
- Calculation accounts for all entity types
- Approximation acceptable (based on probability, not deterministic)

### US-039: Chrome and Firefox Compatibility
Title: Use application in supported browsers
Description: As a student, I want the application to work in Chrome and Firefox so that I can access it easily.
Acceptance Criteria:
- Full functionality in Chrome (latest version)
- Full functionality in Firefox (latest version)
- Emoji rendering consistent across browsers
- Canvas performance acceptable in both browsers
- Keyboard shortcuts work in both browsers
- No browser-specific warnings or errors

### US-040: Performance at Maximum Scale
Title: Run large simulations smoothly
Description: As a student, I want large boards to run smoothly so that I can experiment with complex ecosystems.
Acceptance Criteria:
- 100x100 board with 1000 creatures runs without lag
- Medium speed (200ms/round) achievable with large boards
- Responsive controls even during continuous execution
- Minimum 30 FPS maintained during rendering
- No browser freezing or unresponsiveness
- Memory usage stable over extended sessions (no memory leaks)

## 6. Success Metrics

### 6.1 Educational Outcomes

6.1.1 Population Dynamics Understanding
- Success criterion: 80% of students can predict how parameter changes affect population trends in post-use assessment
- Measurement: Survey asking students to explain what happens when predator damage increases
- Target: Students articulate specific cause-effect relationships (example: "more wolf damage → humans die faster → fewer humans → wolves starve → population crash")

6.1.2 Cause-Effect Recognition
- Success criterion: 75% of students connect specific mechanics to observed outcomes in classroom discussion
- Measurement: Students articulate why populations crashed or thrived in their experiments without prompting
- Target: Students identify at least 3 specific mechanisms that caused observed outcomes

6.1.3 Ecosystem Balance Experimentation
- Success criterion: 70% of students discover at least one stable configuration through iteration
- Measurement: Classroom discussion reveals students found multiple stable states through experimentation
- Target: Students describe different parameter combinations that produce stable populations

### 6.2 Technical Performance

6.2.1 Rendering Performance
- Success criterion: Maintain 30+ FPS on default configuration (30x30, 200-300 creatures)
- Measurement: Built-in FPS counter in debug mode during standard usage sessions
- Target: Average FPS ≥ 30 over 5-minute continuous simulation

6.2.2 Browser Compatibility
- Success criterion: Full functionality in Chrome and Firefox without errors
- Measurement: Manual testing checklist covering all features in both browsers
- Target: 100% feature parity, zero critical errors, consistent visual rendering

6.2.3 Large Board Performance
- Success criterion: 100x100 board with 1000 creatures runs smoothly in medium speed
- Measurement: Performance testing with maximum configuration (100x100, 1000 creatures, medium speed 200ms/round)
- Target: No lag, responsive controls, minimum 20 FPS sustained, stable memory usage

### 6.3 Usability

6.3.1 Configuration Clarity
- Success criterion: 80% of students modify parameters without teacher assistance
- Measurement: Observation of first-time users navigating configuration panel during classroom introduction
- Target: Students successfully change at least 5 parameters and start simulation without help

6.3.2 Rules Comprehension
- Success criterion: 75% of students understand game mechanics from documentation alone
- Measurement: Students explain priority order and creature behaviors after reading rules modal
- Target: Students correctly describe at least 2 priority order effects and 3 creature behaviors

6.3.3 Engagement
- Success criterion: 70% of students voluntarily experiment with multiple configurations
- Measurement: Session length and number of different configurations tested per student
- Target: Average 3+ different configurations tested per session, sessions lasting 15+ minutes

### 6.4 System Reliability

6.4.1 Stability
- Success criterion: Zero crashes or unrecoverable errors during typical classroom usage
- Measurement: Error logging during pilot classroom sessions (30 students, 45-minute sessions)
- Target: Zero application crashes, zero data loss events, zero requiring browser refresh

6.4.2 Initialization Reliability
- Success criterion: 100% successful initialization across all valid configurations
- Measurement: Automated testing of configuration combinations
- Target: Every valid configuration (dimensions 10-100, spawn probabilities totaling ≤100%) initializes successfully

6.4.3 Cross-Session Consistency
- Success criterion: Identical configurations produce statistically similar outcomes across sessions
- Measurement: Run same configuration 10 times, measure population curve variance
- Target: Consistent emergence of expected patterns (variation acceptable due to randomness, but general trends consistent)

### 6.5 Adoption Indicators

6.5.1 Teacher Satisfaction
- Success criterion: 80% of pilot teachers rate the tool as valuable for classroom use
- Measurement: Post-pilot survey asking teachers to rate educational value (1-5 scale)
- Target: Average rating ≥ 4.0, with specific feedback on learning objective alignment

6.5.2 Student Satisfaction
- Success criterion: 75% of students report the tool helped them understand concepts better
- Measurement: Student feedback survey after classroom usage
- Target: Majority agree or strongly agree with statement "This simulation helped me understand population dynamics"

6.5.3 Repeat Usage
- Success criterion: 60% of students voluntarily return to experiment further after initial session
- Measurement: Track voluntary usage outside required classroom time
- Target: Students demonstrate continued interest through self-directed experimentation

