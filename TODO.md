# This is manually developed todo file.

## Note for AI - you are free to delete items from here when this feature is delivered and covered with tests.

## TODO items / features

- GAP (to settle): the "humans are safe" win currently fires instantly the first round with 0 wolves and 0 mushrooms, once at least 10 rounds have passed (src/core/endConditions.ts). Because wolves and mushrooms respawn every round, this can end a game during a brief gap. Future idea: make wolf/mushroom respawn rates vary slowly with their current numbers, and require the condition to hold for N consecutive rounds instead of instantly.
- the initial manual board setup doesn't work on mobile - the board does not show up currently
- add challenges section. Player starts with a challenge, wins if challenge is completed. Example challenges:
 - last more than x rounds
 - kill all wolves and remove all mushrooms
 - get at least 100 children born
 - win without dogs
 - win without fruits
 - <more ideas needed>/
- when starting the game, there are two separate buttons to start the game running and start the game paused (in the latter case user can play it round by round)
- classic life game - in configuration user has an option to switch to classic life game (a cell dies, survives or spreads depending on number of neighbor cells); in this case the only configuration is board size, specific version of the rules and the starting position of cells