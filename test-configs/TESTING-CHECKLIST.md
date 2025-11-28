# Configuration Save/Load Testing Checklist

## Phase 20: Configuration Save/Load Feature - Manual Testing

### Setup
- [ ] Build project: `npm run build`
- [ ] Start dev server: `npm run dev`
- [ ] Open browser to http://localhost:5173
- [ ] Verify configuration panel is visible

---

## Test Suite 1: Save Configuration

### Test 1.1: Basic Save Functionality
- [ ] Modify some configuration parameters (e.g., board width to 50, male spawn to 0.05)
- [ ] Click "Save Configuration" button
- [ ] Verify file downloads with format: `game-of-life-config-YYYY-MM-DDTHH-MM-SS.json`
- [ ] Verify success notification appears: "✅ Configuration Saved"
- [ ] Open downloaded JSON file
- [ ] Verify JSON structure includes:
  - `version: "1.0"`
  - `timestamp` (ISO 8601 format)
  - `config` object with all 9 sections

### Test 1.2: Keyboard Shortcut (Ctrl+S / Cmd+S)
- [ ] Modify some parameters
- [ ] Press Ctrl+S (Windows/Linux) or Cmd+S (Mac)
- [ ] Verify browser's default save dialog is prevented
- [ ] Verify configuration downloads
- [ ] Verify success notification appears

### Test 1.3: Save with Default Values
- [ ] Click "Reset to Defaults" button
- [ ] Save configuration
- [ ] Open saved file
- [ ] Verify all values match DEFAULT_CONFIG from src/config.ts

---

## Test Suite 2: Load Configuration - Valid Files

### Test 2.1: Load Valid Configuration
- [ ] Click "Load Configuration" button
- [ ] Select `test-configs/valid-config.json`
- [ ] Verify success notification: "✅ Configuration Loaded"
- [ ] Verify configuration panel updates with loaded values:
  - Board: 30x30
  - Male spawn: 0.03 (3%)
  - Female spawn: 0.03 (3%)
  - Human health: 100
  - Wolf health: 80

### Test 2.2: Keyboard Shortcut (Ctrl+O / Cmd+O)
- [ ] Press Ctrl+O (Windows/Linux) or Cmd+O (Mac)
- [ ] Verify file picker dialog opens
- [ ] Select `test-configs/valid-config.json`
- [ ] Verify configuration loads successfully

### Test 2.3: Load Same File Twice
- [ ] Load valid-config.json
- [ ] Without modifying anything, load valid-config.json again
- [ ] Verify no errors occur
- [ ] Verify file input allows re-selection of same file

---

## Test Suite 3: Load Configuration - Invalid Files

### Test 3.1: Missing Fields Validation
- [ ] Load `test-configs/invalid-missing-fields.json`
- [ ] Verify error notification: "❌ Load Error"
- [ ] Verify error message includes:
  - "Configuration validation failed"
  - "Missing wolf configuration"
  - "Missing dog configuration"
  - Other missing sections listed
- [ ] Verify configuration panel does NOT update (keeps previous values)

### Test 3.2: Out-of-Range Values Validation
- [ ] Load `test-configs/invalid-out-of-range.json`
- [ ] Verify error notification appears
- [ ] Verify error message includes validation errors:
  - "Board width must be between 10 and 100"
  - "Board height must be between 10 and 100"
  - "Male human spawn probability must be between 0 and 1"
  - Other range errors
- [ ] Verify configuration panel does NOT update

### Test 3.3: Wrong Data Types Validation
- [ ] Load `test-configs/invalid-wrong-types.json`
- [ ] Verify error notification appears
- [ ] Verify error message includes type validation errors
- [ ] Verify configuration panel does NOT update

### Test 3.4: Unsupported Version
- [ ] Load `test-configs/invalid-version.json`
- [ ] Verify error notification appears
- [ ] Verify error message: "Unsupported configuration version: 2.0. Expected version 1.0"
- [ ] Verify configuration panel does NOT update

### Test 3.5: Invalid JSON Syntax
- [ ] Create file with invalid JSON (missing bracket, trailing comma, etc.)
- [ ] Attempt to load
- [ ] Verify error notification appears
- [ ] Verify error indicates JSON parsing error

### Test 3.6: Non-JSON File
- [ ] Attempt to load a .txt or .md file
- [ ] Verify error notification appears
- [ ] Verify graceful error handling

---

## Test Suite 4: Round-Trip Save/Load

### Test 4.1: Custom Configuration Persistence
- [ ] Set custom parameters:
  - Board: 40x25
  - Male spawn: 0.08
  - Female spawn: 0.07
  - Human health: 120
  - Wolf damage to male: 25
  - Wolf damage to female: 35
  - Pregnancy period: 15
- [ ] Save configuration (name: custom-test-1.json)
- [ ] Click "Reset to Defaults"
- [ ] Verify all values reset to defaults
- [ ] Load custom-test-1.json
- [ ] Verify ALL custom values restored exactly:
  - Board dimensions: 40x25 ✓
  - Spawn probabilities: 0.08, 0.07 ✓
  - Human health: 120 ✓
  - Wolf damages: 25, 35 ✓
  - Pregnancy: 15 ✓

### Test 4.2: Extreme Values Persistence
- [ ] Set extreme but valid values:
  - Board: 100x100 (max)
  - All spawn probabilities: 0.9 (very high)
  - Human health: 200 (max)
  - Perception ranges: 20 (max)
- [ ] Save configuration
- [ ] Load configuration
- [ ] Verify all extreme values restored correctly

### Test 4.3: Minimal Values Persistence
- [ ] Set minimal valid values:
  - Board: 10x10 (min)
  - All spawn probabilities: 0.001 (very low)
  - Health values: 1 (min)
  - Damage values: 0 (min)
- [ ] Save configuration
- [ ] Load configuration
- [ ] Verify all minimal values restored correctly

---

## Test Suite 5: Localization (i18n)

### Test 5.1: English Notifications
- [ ] Ensure language is set to English
- [ ] Save configuration
- [ ] Verify notification title: "✅ Configuration Saved"
- [ ] Verify notification message includes filename
- [ ] Load valid configuration
- [ ] Verify notification title: "✅ Configuration Loaded"
- [ ] Load invalid configuration
- [ ] Verify notification title: "❌ Load Error"

### Test 5.2: Polish Notifications
- [ ] Switch language to Polish (PL)
- [ ] Save configuration
- [ ] Verify notification title: "✅ Zapisano Konfigurację"
- [ ] Verify notification message: "Konfiguracja wyeksportowana do..."
- [ ] Load valid configuration
- [ ] Verify notification title: "✅ Wczytano Konfigurację"
- [ ] Verify notification message: "Konfiguracja wczytana z..."
- [ ] Load invalid configuration
- [ ] Verify notification title: "❌ Błąd Wczytywania"
- [ ] Verify notification message: "Nie udało się wczytać konfiguracji..."

### Test 5.3: Button Labels and Tooltips
- [ ] Hover over "Save Configuration" button
- [ ] Verify tooltip: "Save configuration to JSON file (Ctrl+S)"
- [ ] Hover over "Load Configuration" button
- [ ] Verify tooltip: "Load configuration from JSON file (Ctrl+O)"
- [ ] Switch to Polish
- [ ] Verify button labels update to Polish

---

## Test Suite 6: Edge Cases

### Test 6.1: Cancel Load Dialog
- [ ] Click "Load Configuration" or press Ctrl+O
- [ ] In file picker, click "Cancel"
- [ ] Verify no error occurs
- [ ] Verify configuration remains unchanged

### Test 6.2: Multiple Rapid Saves
- [ ] Click "Save Configuration" 5 times rapidly
- [ ] Verify 5 files download successfully
- [ ] Verify each has unique timestamp in filename
- [ ] Verify all notifications appear and dismiss correctly

### Test 6.3: Save During Game Running
- [ ] Click "Start Game" to begin simulation
- [ ] While game is running, press Ctrl+S
- [ ] Verify configuration saves successfully
- [ ] Verify game continues running without interruption

### Test 6.4: Load During Game Running
- [ ] Start simulation
- [ ] Attempt to load configuration
- [ ] Verify behavior (should configuration be locked during game?)
- [ ] Document observed behavior

---

## Test Suite 7: Browser Compatibility

### Test 7.1: Chrome (Primary)
- [ ] Run all tests in Chrome
- [ ] Document any issues

### Test 7.2: Firefox (Secondary)
- [ ] Run all tests in Firefox
- [ ] Verify file download behavior
- [ ] Verify keyboard shortcuts work
- [ ] Document any issues

---

## Test Suite 8: Console Validation

### Test 8.1: Console Logging
- [ ] Open browser DevTools console
- [ ] Save configuration
- [ ] Verify console log: "[ConfigPanel] Configuration saved: game-of-life-config-..."
- [ ] Load valid configuration
- [ ] Verify console log: "[ConfigPanel] Configuration loaded from: valid-config.json"
- [ ] Verify console log: "[ConfigPanel] Validation passed: All checks passed"
- [ ] Load invalid configuration
- [ ] Verify console error: "[ConfigPanel] Error loading configuration: ..."

### Test 8.2: No JavaScript Errors
- [ ] Perform 10+ save/load operations with various configs
- [ ] Verify no JavaScript errors in console
- [ ] Verify no unhandled promise rejections
- [ ] Verify no memory leaks (check DevTools Memory tab)

---

## Test Suite 9: Integration with Existing Features

### Test 9.1: Expected Creatures Count
- [ ] Load valid-config.json
- [ ] Verify "Expected starting creatures" count updates
- [ ] Verify calculation matches loaded spawn probabilities

### Test 9.2: Spawn Probability Validation
- [ ] Load configuration with high spawn probabilities (total >1.0)
- [ ] Verify spawn probability warning appears
- [ ] Verify warning persists after load

### Test 9.3: Reset to Defaults
- [ ] Load custom configuration
- [ ] Click "Reset to Defaults"
- [ ] Verify all values return to DEFAULT_CONFIG
- [ ] Save configuration
- [ ] Verify saved file matches DEFAULT_CONFIG

---

## Final Verification

- [ ] All 75+ test cases passed
- [ ] No console errors during testing
- [ ] Save/load works in both English and Polish
- [ ] Keyboard shortcuts functional
- [ ] Validation catches all error types
- [ ] Notifications display correctly
- [ ] Round-trip save/load preserves all values

---

## Known Issues / Notes

_Document any issues discovered during testing:_

1.
2.
3.

---

## Test Completion Sign-off

- Tester: _______________
- Date: _______________
- Build Version: _______________
- Pass/Fail: _______________
- Notes: _______________
