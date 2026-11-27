# This is manually developed todo file.

## Note for AI - you are free to delete items from here when this feature is delivered and covered with tests.

## TODO items / features

- GAP (to settle): the "humans are safe" win currently fires instantly the first round with 0 wolves and 0 mushrooms, once at least 10 rounds have passed (src/core/endConditions.ts). Because wolves and mushrooms respawn every round, this can end a game during a brief gap. Future idea: make wolf/mushroom respawn rates vary slowly with their current numbers, and require the condition to hold for N consecutive rounds instead of instantly.
- challenges: more ideas welcome (e.g. a gene-threshold challenge such as "evolve average strength above X" needs genome data in the round history; "coexist with wolves" needs wolves to reproduce)
