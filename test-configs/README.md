# Test Configuration Files

This directory contains test configuration files for validating the save/load functionality.

## Valid Configuration

- **valid-config.json** - A complete, valid configuration file that should load successfully

## Invalid Configurations

These files are designed to test validation logic and should trigger appropriate error messages:

### 1. invalid-missing-fields.json
**Error Expected**: Missing configuration sections (wolf, dog, fruit, mushroom, simulation, overcrowding)
**Purpose**: Tests structural validation - ensures all required sections are present

### 2. invalid-out-of-range.json
**Errors Expected**:
- Board width must be between 10 and 100 (got 5)
- Board height must be between 10 and 100 (got 150)
- Male human spawn probability must be between 0 and 1 (got 1.5)
- Female human spawn probability must be between 0 and 1 (got -0.1)
- Human starting health must be between 1 and 200 (got 300)
- Human perception range must be between 0 and 20 (got 50)

**Purpose**: Tests range validation for numeric parameters

### 3. invalid-wrong-types.json
**Errors Expected**:
- Board width is string instead of number
- Male human spawn probability is string instead of number
- Human starting health is boolean instead of number

**Purpose**: Tests type validation (string/boolean instead of number)

### 4. invalid-version.json
**Error Expected**: Unsupported configuration version: 2.0. Expected version 1.0
**Purpose**: Tests version compatibility checking

## Testing Procedure

1. **Valid Config Test**:
   - Load valid-config.json
   - Should show success notification
   - All parameters should populate correctly in the UI

2. **Invalid Config Tests**:
   - Load each invalid-*.json file
   - Should show error notification with descriptive message
   - Should NOT update the configuration panel

3. **Keyboard Shortcuts Test**:
   - Press Ctrl+S (or Cmd+S on Mac) to save current config
   - Press Ctrl+O (or Cmd+O on Mac) to open load dialog

4. **Round-trip Test**:
   - Configure custom parameters
   - Save configuration (Ctrl+S)
   - Reset to defaults
   - Load saved configuration
   - Verify all custom parameters restored correctly

## Expected Validation Behavior

The validation system should:
- Check all 9 top-level sections exist (board, spawn, human, wolf, dog, fruit, mushroom, simulation, overcrowding)
- Validate data types (all numeric parameters must be numbers, not strings/booleans)
- Validate ranges for all numeric parameters
- Check version compatibility (only version "1.0" supported)
- Display first 5 validation errors in notification
- Indicate if more errors exist beyond the first 5
