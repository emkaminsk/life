# Game of Life Educational Simulator

An interactive browser-based simulation tool designed for students aged 11-15 to explore population dynamics, cause-effect relationships, and ecosystem balance through hands-on experimentation.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Available Scripts](#available-scripts)
- [Project Scope](#project-scope)
- [Performance Requirements](#performance-requirements)
- [Project Status](#project-status)
- [License](#license)

## 🎯 Overview

Game of Life is an educational simulation that creates a simple ecosystem with humans (males and females), animals (wolves and dogs), and plants (fruits and mushrooms) on a configurable grid-based board. The simulation operates in discrete rounds with a fixed priority order, allowing students to observe emergent behaviors and learn about complex systems through interactive experimentation.

### Learning Objectives

- **Population Dynamics**: Understand how populations grow, decline, and stabilize
- **Cause-Effect Relationships**: Observe how parameter changes affect ecosystem outcomes
- **Ecosystem Balance**: Experiment with predator-prey relationships and resource management
- **Systems Thinking**: Recognize how individual behaviors create emergent patterns

## ✨ Features

### Entity Types & Behaviors

**Humans** (Male/Female)
- Move toward fruits when detected within perception range
- Males fight each other and defend against wolves
- Females can become pregnant and give birth after a gestation period
- Both subject to age-based mortality using the Gompertz function

**Animals**
- **Wolves**: Hunt humans, deal damage to adjacent humans
- **Dogs**: Protect humans by attacking wolves

**Plants**
- **Fruits**: Heal humans (+30 energy default), require ripening period before edible
- **Mushrooms**: Poison humans (-40 energy default), immediately dangerous

### Simulation Mechanics

- **Round-Based Processing**: Seven-phase execution order (Movement → Combat → Eating → Reproduction → Death → Birth → Plant Spawning)
- **Configurable Parameters**: Comprehensive control over health, damage, reproduction rates, age mortality, perception range, and more
- **Visual Feedback**: Color-coded flashes for combat (red), reproduction (green), and eating (yellow) events
- **Real-Time Statistics**: Live population counts, pregnancy tracking, and population graphs
- **Interactive Controls**: Pause, step-by-step execution, continuous simulation with adjustable speed

### Configuration System

- **Board Setup**: Dimensions (10x10 to 100x100), entity spawn probabilities
- **Creature Parameters**: Health, damage values, movement behavior, age mortality curves
- **Population Control**: Overcrowding thresholds and death multipliers
- **Real-Time Validation**: Immediate feedback on invalid configurations with helpful tooltips

### User Interface

- Canvas-based grid rendering with emoji or sprite visualization
- Statistics panel with population graphs over time
- Comprehensive rules reference modal
- Keyboard shortcuts for efficient control
- Non-intrusive notification system

## 🛠️ Tech Stack

- **Language**: TypeScript
- **Rendering**: HTML5 Canvas with PNG sprites
- **Optimization**: Dirty rectangle rendering for performance
- **Build Tool**: Vite
- **Testing**: Vitest
- **Target Browsers**: Chrome (primary), Firefox

## 🚀 Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm or yarn package manager

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/life.git
   cd life
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist/` directory, ready for deployment to any static hosting service.

## 📜 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build optimized production bundle |
| `npm run preview` | Preview production build locally |
| `npm run test` | Run unit tests with Vitest |
| `npm run test:ui` | Run tests with Vitest UI interface |

## 🎯 Project Scope

### ✅ In Scope (MVP)

- Complete simulation with all entity types and behaviors
- Full parameter configurability before game start
- Visual feedback system for events (flashes, borders, state indicators)
- Statistics panel with real-time population graph
- Comprehensive rules documentation accessible during gameplay
- Keyboard and mouse controls
- Real-time configuration validation
- Performance optimization for up to 1,000 creatures

### ❌ Out of Scope (Future Enhancements)

- Tutorial system or guided learning experience
- Data export functionality (CSV, JSON)
- Game state saving and loading
- Multiple simultaneous simulations
- Intent visualization (showing creature targeting)
- Historical playback or rewind functionality
- Screenshot or recording capabilities
- Achievement system
- Multiplayer or scenario sharing
- Mobile or tablet optimization
- Screen reader support beyond basic accessibility

## ⚡ Performance Requirements

- **Default Configuration**: Maintain minimum 30 FPS on 30x30 board with 200-300 creatures
- **Maximum Scale**: 100x100 board with 1,000 creatures runs smoothly at medium speed (200ms/round)
- **Browser Support**: Full functionality in Chrome (latest) and Firefox (latest)
- **Rendering**: Dirty rectangle optimization to redraw only changed cells and neighbors
- **Caching**: PNG sprite caching to avoid repeated rendering overhead

## 📊 Project Status

**Current Phase**: MVP Development

### Success Criteria

**Educational Outcomes**
- 80% of students can predict parameter effects on population trends
- 75% of students connect specific mechanics to observed outcomes
- 70% of students discover stable configurations through experimentation

**Technical Performance**
- ✅ 30+ FPS on default configuration (30x30, 200-300 creatures)
- ✅ Smooth performance on 100x100 board with 1,000 creatures
- ✅ Zero crashes during typical classroom usage

**Usability**
- 80% of students modify parameters without teacher assistance
- 75% of students understand mechanics from documentation alone
- 70% of students voluntarily experiment with multiple configurations

## 📄 License

To be determined.

---

**Built with educational excellence in mind** | Designed for students aged 11-15 | Focus on hands-on learning through experimentation
