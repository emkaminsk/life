# This is manually developed todo file.

## Note for AI - you are free to delete items from here when this feature is delivered and covered with tests.

## TODO items / features

- manual board setup creator. In the configuration dialog "Game Configuration" user has a switch - either to set probabilities (male spawn, female spawn etc) or to set up the board manually. If manual setup is selected, a new view is shown on "Start Game": the board + panel on the right with selection of creatures (male, female, dog, wolf, fruit, mushroom). User can: drag&drop items from panel one by one, use keyboard comfortably to add elements to the board (eg. select an area or set of fields and add a given item, eg. wolf all at once). When user confirms the manual setup is done, the game starts and the Game of Life screen is shown.
- every Game Configuration has a tooltip that explains what this setting does (localized)
- the configuration screen should be refactored to improve usefullness, eg. the button to start game should always be visible, the current section header should be visible on top of the fields no matter where in the section the scroll is.
- the game stops when all males and females die out. 
- the game stops when all predators (wolves) die out and there are no more mushrooms.
- on the game stop a screen with written summary is displayed. This summary should cover the key facts about the game that just passed: how many rounds, when first pregnancy started, how many babies were born, when male, female population reached 50%, 10%, 0%, 200% of initial level; any conclusions on which factor most impacted extinction or expansion 