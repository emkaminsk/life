# This is manually developed todo file.

## Note for AI - you are free to delete items from here when this feature is delivered and covered with tests.

## TODO items / features

- GAP (to settle): the "humans are safe" win currently fires instantly the first round with 0 wolves and 0 mushrooms, once at least 10 rounds have passed (src/core/endConditions.ts). Because wolves and mushrooms respawn every round, this can end a game during a brief gap. Future idea: make wolf/mushroom respawn rates vary slowly with their current numbers, and require the condition to hold for N consecutive rounds instead of instantly.
- add challenges section. Player starts with a challenge, wins if challenge is completed. Example challenges:
 - last more than x rounds
 - kill all wolves and remove all mushrooms
 - get at least 100 children born
 - win without dogs
 - win without fruits
 - <more ideas needed>